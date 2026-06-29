import type { DailyPlan, Task } from '@shangan/shared';
import client from '@/network/client';

/** 获取今日计划 */
export function getTodayPlan() {
  return client.get<DailyPlan>('/api/plans/today').then((r) => r.data);
}

/** 整体保存今日计划 */
export function saveTodayPlan(tasks: Task[]) {
  return client.put<DailyPlan>('/api/plans/today', { tasks }).then((r) => r.data);
}

/** 更新单个任务 */
export function updateTask(taskId: string, patch: Partial<Task>) {
  return client.put<DailyPlan>(`/api/plans/today/tasks/${taskId}`, patch).then((r) => r.data);
}

/** 新增任务 */
export function addTask(task: Omit<Task, 'id' | 'completed'>) {
  return client.post<DailyPlan>('/api/plans/today/tasks', task).then((r) => r.data);
}

/** 删除任务 */
export function deleteTask(taskId: string) {
  return client.delete<DailyPlan>(`/api/plans/today/tasks/${taskId}`).then((r) => r.data);
}
