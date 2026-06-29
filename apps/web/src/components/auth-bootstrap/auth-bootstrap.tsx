'use client';

import { useEffect } from 'react';
import { authApi } from '@/network';
import { appStore } from '@/stores/app-store';

/** 挂载后恢复 localStorage，并用 refresh token 恢复 Cookie 会话 */
export function AuthBootstrap() {
  useEffect(() => {
    appStore.hydrateFromStorage();

    let cancelled = false;

    void authApi
      .refresh()
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
