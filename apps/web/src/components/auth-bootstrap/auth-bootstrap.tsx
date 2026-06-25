"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { appStore } from "@/stores/app-store";

/** 启动时用 Cookie 会话同步登录态，并标记 authChecked 避免登录按钮闪烁 */
export function AuthBootstrap() {
  useEffect(() => {
    let cancelled = false;

    void api
      .me()
      .then(({ user }) => {
        if (!cancelled) appStore.setUser(user);
      })
      .catch(() => {
        if (!cancelled) appStore.setUser(null);
      })
      .finally(() => {
        if (!cancelled) appStore.setAuthChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}