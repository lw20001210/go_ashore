import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncTodayPlanDto } from './dto/sync-plan.dto';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { PlansService } from './plans.service';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('today')
  getToday(@Req() request: AuthRequest) {
    return this.plansService.getToday(request.user.sub);
  }

  /** 整份同步今日任务（勾选/重排后写入），比按 taskId PUT 更稳 */
  @Put('today')
  syncToday(@Req() request: AuthRequest, @Body() dto: SyncTodayPlanDto) {
    return this.plansService.syncToday(request.user.sub, dto.tasks);
  }

  @Post('today/tasks')
  addTask(@Req() request: AuthRequest, @Body() dto: CreateTaskDto) {
    return this.plansService.addTask(request.user.sub, dto);
  }

  @Put('today/tasks/:taskId')
  updateTask(
    @Req() request: AuthRequest,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.plansService.updateTask(request.user.sub, taskId, dto);
  }

  @Delete('today/tasks/:taskId')
  deleteTask(@Req() request: AuthRequest, @Param('taskId') taskId: string) {
    return this.plansService.deleteTask(request.user.sub, taskId);
  }
}
