import { redirect } from "next/navigation";

/** 旧链接 /reset-password?token= 已废弃，统一走验证码流程 */
export default function ResetPasswordRedirect() {
  redirect("/forgot-password");
}
