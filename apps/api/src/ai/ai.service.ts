import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Subject, Task, UserProfile, subjects } from '@shangan/shared';
import { randomUUID } from 'crypto';

export interface AiCallOptions {
  /** 未登录时为 false，仅返回本地模板，避免匿名消耗 DeepSeek 配额 */
  useRemoteAi?: boolean;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  getStatus() {
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    const configured = Boolean(apiKey && apiKey !== 'sk-xxx');
    const baseUrl = this.baseUrl();
    return {
      provider: 'deepseek',
      model: 'deepseek-chat',
      configured,
      mode: configured ? 'deepseek' : 'fallback',
      baseUrl,
      endpoint: `${baseUrl}/chat/completions`,
      apiFormat: 'OpenAI Chat Completions',
      hint: configured
        ? '已接入 DeepSeek（OpenAI 兼容接口）'
        : '未配置 DEEPSEEK_API_KEY，当前使用本地模板',
      note: '本项目使用 OpenAI 格式，不是 CCSwitch 里的 /anthropic 端点',
    };
  }

  async generateDailyPlan(
    profile: UserProfile,
    options?: AiCallOptions,
  ): Promise<{ tasks: Task[]; aiGenerated: boolean }> {
    const minutes = this.minutesForToday(profile);
    const fallback = this.fallbackPlan(profile, minutes);
    if (options?.useRemoteAi === false || !this.isDeepSeekConfigured()) {
      return { tasks: fallback, aiGenerated: false };
    }

    try {
      const response = await fetch(`${this.baseUrl()}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.deepSeekApiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          response_format: { type: 'json_object' },
          messages: this.planMessages(profile, minutes),
          temperature: 0.3,
        }),
      });
      if (!response.ok) {
        return { tasks: fallback, aiGenerated: false };
      }
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        return { tasks: fallback, aiGenerated: false };
      }
      const parsed = JSON.parse(content) as { tasks?: Task[] };
      const tasks = (parsed.tasks ?? []).filter((task) => subjects.includes(task.subject));
      const normalizedTasks = this.normalizeTasks(tasks, minutes);
      if (normalizedTasks.length === 0) {
        return { tasks: fallback, aiGenerated: false };
      }
      return { tasks: normalizedTasks, aiGenerated: true };
    } catch {
      return { tasks: fallback, aiGenerated: false };
    }
  }

  async *streamReview(
    completedTasks: Task[],
    userNote: string,
    options?: AiCallOptions,
  ): AsyncGenerator<string> {
    if (options?.useRemoteAi === false || !this.isDeepSeekConfigured()) {
      yield this.fallbackReview(completedTasks, userNote);
      return;
    }

    const response = await fetch(`${this.baseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.deepSeekApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: this.reviewMessages(completedTasks, userNote),
        stream: true,
        temperature: 0.5,
      }),
    });

    if (!response.ok || !response.body) {
      yield this.fallbackReview(completedTasks, userNote);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          continue;
        }
      }
    }
  }

  private baseUrl() {
    return this.config.get<string>('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com';
  }

  private isDeepSeekConfigured() {
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    return Boolean(apiKey && apiKey !== 'sk-xxx');
  }

  private deepSeekApiKey() {
    return this.config.getOrThrow<string>('DEEPSEEK_API_KEY');
  }

  private minutesForToday(profile: UserProfile) {
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      weekday: 'short',
    }).format(new Date());
    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    return isWeekend ? profile.weekendMinutes : profile.weekdayMinutes;
  }

  private planMessages(profile: UserProfile, minutes: number): ChatMessage[] {
    return [
      {
        role: 'system',
        content:
          '你是严谨的在职考公笔试学习教练。只输出 JSON，不要 Markdown。科目只能是：言语、数量、判断、资料、常识、申论。',
      },
      {
        role: 'user',
        content: `用户配置：${JSON.stringify(profile)}。今天可用 ${minutes} 分钟。生成 2-4 个任务，总时长不超过可用时间。输出格式：{"tasks":[{"subject":"资料","title":"资料分析练习 2 套","estimatedMinutes":40,"completed":false}]}`,
      },
    ];
  }

  private reviewMessages(completedTasks: Task[], userNote: string): ChatMessage[] {
    return [
      { role: 'system', content: '你是温和但直接的在职考公复盘教练，输出简短 Markdown。' },
      {
        role: 'user',
        content: `已完成任务：${JSON.stringify(completedTasks)}。用户备注：${userNote || '无'}。请输出今日总结、一个主要卡点、明日一条具体建议。`,
      },
    ];
  }

  private normalizeTasks(tasks: Task[], maxMinutes: number): Task[] {
    let used = 0;
    return tasks.slice(0, 4).map((task) => {
      const remaining = Math.max(10, maxMinutes - used);
      const estimatedMinutes = Math.min(task.estimatedMinutes || 20, remaining);
      used += estimatedMinutes;
      return {
        id: task.id || randomUUID(),
        subject: task.subject,
        title: task.title,
        estimatedMinutes,
        completed: false,
      };
    });
  }

  private fallbackPlan(profile: UserProfile, minutes: number): Task[] {
    const focus: Subject[] = profile.focusSubjects.length ? profile.focusSubjects : ['资料', '言语', '申论'];
    const first = Math.max(20, Math.floor(minutes * 0.45));
    const second = Math.max(20, Math.floor(minutes * 0.3));
    const third = Math.max(15, minutes - first - second);
    return [
      {
        id: randomUUID(),
        subject: focus[0],
        title: `${focus[0]}专项练习`,
        estimatedMinutes: first,
        completed: false,
      },
      {
        id: randomUUID(),
        subject: focus[1] ?? '资料',
        title: `${focus[1] ?? '资料'}限时训练`,
        estimatedMinutes: second,
        completed: false,
      },
      {
        id: randomUUID(),
        subject: focus[2] ?? '申论',
        title: `${focus[2] ?? '申论'}复盘整理`,
        estimatedMinutes: third,
        completed: false,
      },
    ];
  }

  private fallbackReview(completedTasks: Task[], userNote: string) {
    const done = completedTasks.length;
    return `### 今日总结\n你完成了 ${done} 个备考任务，先把连续性稳住。\n\n### 主要卡点\n${userNote || '今天还没有记录具体卡点，可以从耗时最长的科目开始复盘。'}\n\n### 明日建议\n明天只保留 2-3 个任务，优先安排薄弱科目，并给每个任务设置明确结束时间。`;
  }
}
