import { PrismaClient } from '@prisma/client-users';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Start seeding residents...');
  
  // Hash password một lần để dùng chung
  const hashedPassword = await hashPassword('123456');

  // Tạo 50 resident ảo
  for (let i = 51; i <= 150; i++) {
    try {
      // Tạo thông tin ngẫu nhiên cho mỗi resident
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';
      const year = 1970 + Math.floor(Math.random() * 40); // Random year between 1970-2010
      const month = 1 + Math.floor(Math.random() * 12);
      const day = 1 + Math.floor(Math.random() * 28);
      const phone = `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

      await prisma.user.create({
        data: {
          username: `resident${i}`,
          password: hashedPassword,
          email: `resident${i}@example.com`,
          phone: phone,
          role: 'Resident',
          dateOfBirth: new Date(year, month - 1, day),
          gender: gender,
          accountStatus: 'Active'
        }
      });

      console.log(`Created resident${i}`);
    } catch (error) {
      // Nếu user đã tồn tại, bỏ qua và tiếp tục
      if (error.code === 'P2002') {
        console.log(`Resident${i} already exists, skipping...`);
        continue;
      }
      throw error;
    }
  }

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => console.error('❌ Seed error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
