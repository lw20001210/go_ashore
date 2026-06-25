import type { DailyPlan, DailyReview, ProgressSummary, Task, UserProfile } from "@shangan/shared";

/** 为每次 API 请求生成唯一任务 ID（HTTP 局域网下 crypto.randomUUID 可能不可用） */
export function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // 非 HTTPS 环境下 randomUUID 可能抛错
    }
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class ApiError extends Error {
  status: number;
  requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

/** Turbopack 分包后 instanceof 可能失效，用字段判断更可靠 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as ApiError).name === "ApiError" &&
    typeof (error as ApiError).status === "number"
  );
}

interface ApiErrorBody {
  message?: string | string[];
  requestId?: string;
}

async function parseErrorResponse(response: Response): Promise<{ message: string; requestId?: string }> {
  const headerRequestId = response.headers.get("X-Request-Id") ?? undefined;
  const text = await response.text();

  try {
    const body = JSON.parse(text) as ApiErrorBody;
    if (Array.isArray(body.message)) {
      return { message: body.message.join("；"), requestId: body.requestId ?? headerRequestId };
    }
    if (typeof body.message === "string") {
      return { message: body.message, requestId: body.requestId ?? headerRequestId };
    }
  } catch {
    // ignore invalid JSON
  }

  return { message: text || "请求失败，请稍后再试。", requestId: headerRequestId };
}

const AUTH_PATHS_SKIP_REFRESH = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
]);

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const clientRequestId = createRequestId();
  const method = (init?.method ?? "GET").toUpperCase();
  const hasBody = init?.body != null && method !== "GET" && method !== "HEAD";
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        "X-Request-Id": clientRequestId,
        ...init?.headers,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "网络请求失败";
    throw new ApiError(`无法连接服务器：${detail}`, 0, clientRequestId);
  }

  if (response.status === 401 && !retried && !AUTH_PATHS_SKIP_REFRESH.has(path)) {
    try {
      await request<{ user: { id: string; email: string } }>("/api/auth/refresh", { method: "POST" }, true);
      return request<T>(path, init, true);
    } catch {
      // fall through to original 401
    }
  }

  if (!response.ok) {
    const { message, requestId } = await parseErrorResponse(response);
    throw new ApiError(message, response.status, requestId ?? clientRequestId);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("服务器响应格式错误", response.status, clientRequestId);
  }
}

export const api = {
  register: (email: string, password: string) =>
    request<{ user: { id: string; email: string } }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ user: { id: string; email: string } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  me: () => request<{ user: { id: string; email: string } }>("/api/auth/me"),
  getProfile: () => request<UserProfile>("/api/users/profile"),
  saveProfile: (profile: UserProfile) =>
    request<UserProfile>("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }),
  generatePlan: (profile: UserProfile) =>
    request<DailyPlan>("/api/ai/daily-plan", {
      method: "POST",
      body: JSON.stringify({ profile }),
    }),
  getTodayPlan: () => request<DailyPlan>("/api/plans/today"),
  saveTodayPlan: (tasks: Task[]) =>
    request<DailyPlan>("/api/plans/today", {
      method: "PUT",
      body: JSON.stringify({ tasks }),
    }),
  updateTask: (taskId: string, patch: Partial<Task>) =>
    request<DailyPlan>(`/api/plans/today/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    }),
  addTask: (task: Omit<Task, "id" | "completed">) =>
    request<DailyPlan>("/api/plans/today/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    }),
  deleteTask: (taskId: string) =>
    request<DailyPlan>(`/api/plans/today/tasks/${taskId}`, { method: "DELETE" }),
  saveReview: (review: DailyReview) =>
    request<DailyReview>("/api/reviews/today", {
      method: "POST",
      body: JSON.stringify({
        completedTaskIds: review.completedTaskIds,
        userNote: review.userNote,
        aiSummary: review.aiSummary,
        tomorrowSuggestion: review.tomorrowSuggestion,
      }),
    }),
  getProgress: () => request<ProgressSummary>("/api/progress"),
  merge: (payload: { profile?: UserProfile; plans: DailyPlan[]; reviews: DailyReview[] }) =>
    request<{ ok: true }>("/api/sync/merge", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAiStatus: () =>
    request<{
      provider: string;
      model: string;
      configured: boolean;
      mode: "deepseek" | "fallback";
      baseUrl: string;
      endpoint: string;
      apiFormat: string;
      hint: string;
      note: string;
    }>("/api/ai/status"),
};

export async function streamReview(
  completedTasks: Task[],
  userNote: string,
  onChunk: (chunk: string) => void,
) {
  const response = await fetch("/api/ai/review", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completedTasks, userNote }),
  });

  if (!response.ok || !response.body) {
    throw new Error(await response.text());
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      const line = event.split("\n").find((item) => item.startsWith("data: "));
      if (!line) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return;
      const parsed = JSON.parse(payload) as { content?: string };
      if (parsed.content) onChunk(parsed.content);
    }
  }
}
