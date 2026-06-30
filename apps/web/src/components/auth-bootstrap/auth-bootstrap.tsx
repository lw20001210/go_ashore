'use client';

import { useEffect } from 'react';
import { authApi } from '@/network';
import { applyCloudPull, pullCloudData } from '@/lib/cloud-sync';
import { appStore } from '@/stores/app-store';

/** 挂载后恢复 localStorage，并用 refresh token 恢复 Cookie 会话 */
export function AuthBootstrap() {
  useEffect(() => {
    appStore.hydrateFromStorage();

    let cancelled = false;

    void authApi
      .refresh()
      .then(async ({ user }) => {
        if (cancelled) return;
        appStore.setUser(user);
        try {
          applyCloudPull(await pullCloudData());
        } catch {
          // 云端拉取失败不阻断会话
        }
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
