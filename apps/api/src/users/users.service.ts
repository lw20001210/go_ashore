import { Injectable, NotFoundException } from '@nestjs/common';
import { UserProfile } from '@shangan/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProfileDto } from './dto/profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      examDate: profile.examDate.toISOString().slice(0, 10),
      examType: profile.examType as UserProfile['examType'],
      weekdayMinutes: profile.weekdayMinutes,
      weekendMinutes: profile.weekendMinutes,
      focusSubjects: profile.focusSubjects as UserProfile['focusSubjects'],
      phase: 'written',
    };
  }

  async upsertProfile(userId: string, dto: UpsertProfileDto): Promise<UserProfile> {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        examDate: new Date(dto.examDate),
        examType: dto.examType,
        weekdayMinutes: dto.weekdayMinutes,
        weekendMinutes: dto.weekendMinutes,
        focusSubjects: dto.focusSubjects,
        phase: 'written',
      },
      update: {
        examDate: new Date(dto.examDate),
        examType: dto.examType,
        weekdayMinutes: dto.weekdayMinutes,
        weekendMinutes: dto.weekendMinutes,
        focusSubjects: dto.focusSubjects,
        phase: 'written',
      },
    });

    return {
      examDate: profile.examDate.toISOString().slice(0, 10),
      examType: profile.examType as UserProfile['examType'],
      weekdayMinutes: profile.weekdayMinutes,
      weekendMinutes: profile.weekendMinutes,
      focusSubjects: profile.focusSubjects as UserProfile['focusSubjects'],
      phase: 'written',
    };
  }
}
