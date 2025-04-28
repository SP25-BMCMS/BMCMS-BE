import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client-users'
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {

    const url = configService.get<string>('DB_USER_SERVICE')
    super({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: url
        }
      }
    })
  }

  async onModuleInit() {
    try {
      // Pre-warm Prisma Client
      await Promise.all([
        this.$connect(),
        this.$queryRaw`SELECT 1` // Simple query to warm up connection
      ])

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

    // teardown logic
    return Promise.all([this.user.deleteMany()])
  }
}
