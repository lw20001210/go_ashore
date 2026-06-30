import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const email = process.argv[2]?.toLowerCase();
const password = process.argv[3];

if (!email || !password) {
  console.error('用法: node reset-user-password.mjs <邮箱> <新密码>');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`已重置: ${user.email}`);
} catch {
  console.error(`未找到用户: ${email}`);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
