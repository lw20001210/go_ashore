import { message } from "antd";
import { isApiError } from "@/lib/api";
import { showTaskIdError } from "@/lib/show-task-id-error";

type AuthMode = "login" | "register";

function mapAuthError(error: unknown, mode: AuthMode): { message: string; status?: number } {
  if (isApiError(error)) {
    if (error.status === 0) {
      return { message: "无法连接后端，请确认 API 已启动", status: 0 };
    }
    if (error.status >= 500) {
      return { message: "服务器出错了", status: error.status };
    }
    if (error.status === 409 || error.message.includes("Email already registered")) {
      return { message: "该邮箱已注册，请直接登录", status: error.status };
    }
    if (error.status === 401 || error.message.includes("Invalid email or password")) {
      return {
        message: mode === "login" ? "邮箱或密码错误" : "注册失败，请检查填写内容",
        status: error.status,
      };
    }
    if (error.status === 400) {
      return {
        message: "请检查邮箱格式和密码（至少 8 位）",
        status: error.status,
      };
    }
    return { message: error.message, status: error.status };
  }

  if (error instanceof Error) {
    const text = error.message.toLowerCase();
    if (text.includes("quota") || text.includes("localstorage") || text.includes("storage")) {
      return { message: "浏览器存储不可用，请关闭无痕模式后重试" };
    }
    if (error.message) {
      return { message: error.message };
    }
  }

  return {
    message: mode === "login" ? "登录失败，请稍后再试" : "注册失败，请稍后再试",
  };
}

/** 登录/注册失败时用 antd message.error 弹出提示 */
export function showAuthError(error: unknown, mode: AuthMode) {
  const mapped = mapAuthError(error, mode);
  const requestId = isApiError(error) ? error.requestId : undefined;

  if (mapped.status === 401) {
    message.error("邮箱或密码错误。如果还没注册，请先切换到「注册」。");
    return;
  }
  if (mapped.status === 409) {
    message.error("该邮箱已注册，请切回「登录」直接登录。");
    return;
  }
  if (mapped.status === 0) {
    message.error("无法连接后端，请先运行 npm run dev。");
    return;
  }
  if (mapped.status && mapped.status >= 500 && requestId) {
    showTaskIdError(requestId);
    return;
  }

  message.error(mapped.message);
}
