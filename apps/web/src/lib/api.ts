/**
 * @deprecated 请直接 import from '@/network'
 *
 * 原有 api.ts 已按目录结构拆分到 network/ 目录：
 *   - client.ts     → axios 实例、拦截器、ApiError、isApiError
 *   - api/           → 按业务模块拆分的纯函数（auth/user/plan/ai/review/progress/sync）
 *   - stream.ts     → streamReview SSE 流式请求
 *   - index.ts      → 统一导出
 */
export {
  authApi,
  userApi,
  planApi,
  aiApi,
  reviewApi,
  progressApi,
  syncApi,
  historyApi,
  ApiError,
  createRequestId,
  isApiError,
  streamReview,
} from '@/network';
