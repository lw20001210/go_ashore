import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

/** 为每次 API 请求生成唯一 ID */
export function createRequestId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
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
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

/** Turbopack 分包后 instanceof 可能失效，用字段判断更可靠 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as ApiError).name === 'ApiError' &&
    typeof (error as ApiError).status === 'number'
  );
}

const AUTH_PATHS_SKIP_REFRESH = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
]);

type RetryAxiosRequestConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
};

const client: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

/** 请求拦截器：注入 X-Request-Id */
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set('X-Request-Id', createRequestId());
  return config;
});

/** 响应拦截器：统一错误处理 + 401 自动刷新 */
client.interceptors.response.use(
  (response) => response,
  async (
    error: AxiosError<{ message?: string | string[]; requestId?: string }>,
  ) => {
    const requestId = error.config?.headers?.['X-Request-Id'] as
      | string
      | undefined;
    const status = error.response?.status ?? 0;

    // 网络错误（无响应）
    if (!error.response) {
      throw new ApiError(`无法连接服务器：${error.message}`, 0, requestId);
    }

    const path = error.config?.url ?? '';
    const data = error.response.data;
    const retryConfig = error.config as RetryAxiosRequestConfig | undefined;

    // 401 自动刷新 token（仅一次）
    if (
      status === 401 &&
      !AUTH_PATHS_SKIP_REFRESH.has(path) &&
      retryConfig &&
      !retryConfig._retried
    ) {
      retryConfig._retried = true;
      try {
        await client.post('/api/auth/refresh');
        retryConfig.headers.set('X-Request-Id', createRequestId());
        return client(retryConfig);
      } catch {
        // 刷新失败，继续抛原始 401
      }
    }

    // 解析错误消息
    const message = data?.message
      ? Array.isArray(data.message)
        ? data.message.join('；')
        : data.message
      : error.response.statusText || '请求失败，请稍后再试。';

    throw new ApiError(message, status, data?.requestId ?? requestId);
  },
);

export default client;
