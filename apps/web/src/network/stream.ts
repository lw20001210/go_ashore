import type { Task } from '@shangan/shared';
import client, { ApiError, createRequestId } from './client';

async function requestReviewStream(
  completedTasks: Task[],
  userNote: string,
  requestId: string,
) {
  return fetch('/api/ai/review', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
    },
    body: JSON.stringify({ completedTasks, userNote }),
  });
}

export async function streamReview(
  completedTasks: Task[],
  userNote: string,
  onChunk: (chunk: string) => void,
) {
  let requestId = createRequestId();
  let response = await requestReviewStream(completedTasks, userNote, requestId);

  if (response.status === 401) {
    try {
      await client.post('/api/auth/refresh');
      requestId = createRequestId();
      response = await requestReviewStream(completedTasks, userNote, requestId);
    } catch {
      // 刷新失败，继续用原始 401 响应
    }
  }

  if (!response.ok || !response.body) {
    let message = '请求失败，请稍后再试。';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join('；') : body.message;
      }
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status, requestId);
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
        const json = JSON.parse(payload) as { content?: string };
        if (json.content) onChunk(json.content);
      } catch {
        continue;
      }
    }
  }
}
