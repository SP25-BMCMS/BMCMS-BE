import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-chatbot';
import { withAccelerate } from '@prisma/extension-accelerate';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    // const accelerateUrl = configService.get<string>('CHATBOT_PRISMA_ACCELERATE_URL');
    // if (!accelerateUrl) {
    //   throw new Error('CHATBOT_PRISMA_ACCELERATE_URL is not defined');
    // }
    const url = configService.get<string>('DB_CHATBOT_SERVICE')

    super({
      log: ['error', 'warn'],
      datasources: {
        db: {
          // url: accelerateUrl
          url: url
        }
      }
    });
  }

  async onModuleInit() {
    try {
      // Pre-warm Prisma Client
      await Promise.all([
        this.$connect(),
        this.$queryRaw`SELECT 1` // Simple query to warm up connection
      ]);
      
      // Apply Accelerate extension
      // this.$extends(withAccelerate());
      // console.log('Successfully connected to database with Accelerate');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    // teardown logic
    return Promise.all([this.chat.deleteMany()]);
  }
} 