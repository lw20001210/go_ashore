import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(
      this.config.get('SMTP_HOST') &&
        this.config.get('SMTP_USER') &&
        this.config.get('SMTP_PASS'),
    );
  }

  async sendPasswordReset(to: string, code: string) {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        '邮件服务未配置，请联系管理员在服务器配置 SMTP，或使用 scripts/reset-user-password.sh 重置',
      );
    }

    const from = this.config.get<string>('SMTP_FROM') ?? this.config.get<string>('SMTP_USER');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? '465');
    const secure =
      this.config.get<string>('SMTP_SECURE') === 'true' ||
      (this.config.get('SMTP_SECURE') !== 'false' && port === 465);

    try {
      const transporter = nodemailer.createTransport({
        host: this.config.getOrThrow<string>('SMTP_HOST'),
        port,
        secure,
        auth: {
          user: this.config.getOrThrow<string>('SMTP_USER'),
          pass: this.config.getOrThrow<string>('SMTP_PASS'),
        },
      });

      await transporter.sendMail({
        from,
        to,
        subject: '上岸日程 - 重置密码验证码',
        html: `<p>你好，</p><p>你正在重置上岸日程密码。验证码：</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>15 分钟内有效。请在网站的「忘记密码」页面输入此验证码和新密码，<strong>无需登录，也无需记得旧密码</strong>。</p><p>如非本人操作，请忽略此邮件。</p>`,
      });
    } catch (error) {
      this.logger.error(`发送邮件失败：${error instanceof Error ? error.message : error}`);
      throw new ServiceUnavailableException('邮件发送失败，请稍后再试');
    }
  }
}
