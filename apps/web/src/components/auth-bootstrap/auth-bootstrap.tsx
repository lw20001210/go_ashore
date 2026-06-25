"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { appStore } from "@/stores/app-store";

/** 挂载后恢复 localStorage，并校验 Cookie 会话 */
export function AuthBootstrap() {
  useEffect(() => {
    appStore.hydrateFromStorage();

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