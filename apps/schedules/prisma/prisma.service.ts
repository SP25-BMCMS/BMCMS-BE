import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client-schedule'
import { withAccelerate } from '@prisma/extension-accelerate'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    const accelerateUrl = configService.get<string>('SCHEDULE_PRISMA_ACCELERATE_URL')
    if (!accelerateUrl) {
      throw new Error('SCHEDULE_PRISMA_ACCELERATE_URL is not defined')
    }

    super({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: accelerateUrl,
        },
      },
    })
  }

  async onModuleInit() {
    try {
      await this.$connect()
      // Apply Accelerate extension
      this.$extends(withAccelerate())
      console.log('Successfully connected to database with Accelerate')
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
    //   return Promise.all([this.user.deleteMany()])
  }
}
