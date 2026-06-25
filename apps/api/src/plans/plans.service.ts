import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DailyPlan, Task } from '@shangan/shared';
import { randomUUID } from 'crypto';
import { todayDateOnly, toDateKey } from '../common/date';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday(userId: string): Promise<DailyPlan> {
    const plan = await this.prisma.dailyPlan.findUnique({
      where: { userId_date: { userId, date: todayDateOnly() } },
    });
    if (!plan) {
      throw new NotFoundException('Today plan not found');
    }
    return this.toDailyPlan(plan);
  }

  async upsertToday(userId: string, tasks: Task[], aiGenerated = true): Promise<DailyPlan> {
    const totalMinutes = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
    const plan = await this.prisma.dailyPlan.upsert({
      where: { userId_date: { userId, date: todayDateOnly() } },
      create: {
        userId,
        date: todayDateOnly(),
        tasks: tasks as unknown as Prisma.InputJsonValue,
        aiGenerated,
        totalMinutes,
      },
      update: { tasks: tasks as unknown as Prisma.InputJsonValue, aiGenerated, totalMinutes },
    });
    return this.toDailyPlan(plan);
  }

  async addTask(userId: string, dto: CreateTaskDto): Promise<DailyPlan> {
    const plan = await this.getToday(userId);
    return this.upsertToday(userId, [
      ...plan.tasks,
      { id: randomUUID(), completed: false, ...dto },
    ], plan.aiGenerated);
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto): Promise<DailyPlan> {
    const plan = await this.getToday(userId);
    const tasks = plan.tasks.map((task) => (task.id === taskId ? { ...task, ...dto } : task));
    if (!tasks.some((task) => task.id === taskId)) {
      throw new NotFoundException('Task not found');
    }
    return this.upsertToday(userId, tasks, plan.aiGenerated);
  }

  async deleteTask(userId: string, taskId: string): Promise<DailyPlan> {
    const plan = await this.getToday(userId);
    const tasks = plan.tasks.filter((task) => task.id !== taskId);
    return this.upsertToday(userId, tasks, plan.aiGenerated);
  }

  async syncToday(userId: string, tasks: Task[]): Promise<DailyPlan> {
    const normalized = tasks.map((task) => ({
      id: task.id,
      subject: task.subject,
      title: task.title,
      estimatedMinutes: task.estimatedMinutes,
      completed: Boolean(task.completed),
    }));
    const plan = await this.getToday(userId).catch(() => null);
    return this.upsertToday(userId, normalized, plan?.aiGenerated ?? true);
  }

  private toDailyPlan(plan: {
    date: Date;
    tasks: unknown;
    aiGenerated: boolean;
    totalMinutes: number;
  }): DailyPlan {
    return {
      date: toDateKey(plan.date),
      tasks: plan.tasks as Task[],
      aiGenerated: plan.aiGenerated,
      totalMinutes: plan.totalMinutes,
    };
  }
}
