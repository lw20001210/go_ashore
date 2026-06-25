"use client";

import type { DailyPlan, DailyReview, Task, UserProfile } from "@shangan/shared";
import { autorun, makeAutoObservable, runInAction } from "mobx";
import { todayKey } from "@/lib/utils";

const STORAGE_KEY = "shangan-store";

export type AppUser = { id: string; email: string };

type PersistedState = {
  profile: UserProfile | null;
  plans: Record<string, DailyPlan>;
  reviews: Record<string, DailyReview>;
};

declare global {
  // eslint-disable-next-line no-var
  var __shanganAppStore: AppStore | undefined;
}

class AppStore {
  user: AppUser | null = null;
  profile: UserProfile | null = null;
  plans: Record<string, DailyPlan> = {};
  reviews: Record<string, DailyReview> = {};
  /** localStorage 是否已同步恢复 */
  hydrated = false;
  /** Cookie 会话是否已校验 */
  authChecked = false;

  constructor() {
    makeAutoObservable(this);

    if (typeof window === "undefined") {
      return;
    }

    autorun(() => {
      if (!this.hydrated) return;
      this.persist();
    });
  }

  /** 挂载后调用，避免 SSR 与客户端首屏 HTML 不一致 */
  hydrateFromStorage() {
    if (this.hydrated) return;
    this.rehydrate();
  }

  /** 仅在本地恢复完成且会话校验结束、确实未登录时显示登录按钮 */
  get showLoginButton() {
    return this.hydrated && this.authChecked && !this.user;
  }

  private rehydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState & { state?: PersistedState };
        const data = parsed.state ?? parsed;
        runInAction(() => {
          this.profile = data.profile ?? null;
          this.plans = data.plans ?? {};
          this.reviews = data.reviews ?? {};
        });
      }
    } catch {
      // 损坏的缓存忽略
    }

    runInAction(() => {
      this.hydrated = true;
    });
  }

  private persist() {
    const payload: PersistedState = {
      profile: this.profile,
      plans: this.plans,
      reviews: this.reviews,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // 无痕模式或存储已满时不应阻断登录等流程
    }
  }

  setUser = (user: AppUser | null) => {
    this.user = user;
  };

  setAuthChecked = (checked: boolean) => {
    this.authChecked = checked;
  };

  setProfile = (profile: UserProfile | null) => {
    this.profile = profile;
  };

  setTodayPlan = (plan: DailyPlan) => {
    const key = todayKey();
    this.plans = { ...this.plans, [key]: { ...plan, date: key } };
  };

  updateLocalTask = (taskId: string, patch: Partial<Task>) => {
    const key = todayKey();
    let plan = this.plans[key];

    if (!plan) {
      const entry = Object.entries(this.plans).find(([, item]) => item.tasks.some((task) => task.id === taskId));
      if (!entry) return;
      plan = entry[1];
    }

    const tasks = plan.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task));
    const planKey = plan.date === key ? key : plan.date;

    this.plans = {
      ...this.plans,
      [planKey]: {
        ...plan,
        date: planKey,
        tasks,
        totalMinutes: tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
      },
    };
  };

  addLocalTask = (task: Task) => {
    const key = todayKey();
    const plan = this.plans[key] ?? {
      date: key,
      tasks: [],
      aiGenerated: false,
      totalMinutes: 0,
    };
    const tasks = [...plan.tasks, task];
    this.plans = {
      ...this.plans,
      [key]: {
        ...plan,
        tasks,
        totalMinutes: tasks.reduce((sum, item) => sum + item.estimatedMinutes, 0),
      },
    };
  };

  removeLocalTask = (taskId: string) => {
    const key = todayKey();
    const plan = this.plans[key];
    if (!plan) return;

    const tasks = plan.tasks.filter((task) => task.id !== taskId);
    this.plans = {
      ...this.plans,
      [key]: {
        ...plan,
        tasks,
        totalMinutes: tasks.reduce((sum, item) => sum + item.estimatedMinutes, 0),
      },
    };
  };

  saveLocalReview = (review: DailyReview) => {
    this.reviews = { ...this.reviews, [review.date]: review };
  };

  clearAuth = () => {
    this.user = null;
  };
}

function createAppStore() {
  return new AppStore();
}

export const appStore =
  typeof window !== "undefined"
    ? (globalThis.__shanganAppStore ??= createAppStore())
    : createAppStore();

/** 在 observer 组件内使用，自动响应 MobX 变更 */
export function useAppStore() {
  return appStore;
}
