import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client-chatbot'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // constructor(private configService: ConfigService) {
  //   const url = configService.get<string>('DB_CHATBOT_SERVICE')
  //   if (!url) {
  //     throw new Error('DB_CHATBOT_URL is not defined')
  //   }

  //   super({
  //     datasources: {
  //       db: {
  //         url: url
  //       }
  //     },
  //     log: ['error', 'warn']
  //   })
  // }

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
      console.error('Failed to connect to database:', error)
      throw error
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return
    return Promise.all([this.chat.deleteMany()])
  }
} 