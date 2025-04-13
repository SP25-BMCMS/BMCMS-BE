import { PrismaClient } from '@prisma/client-cracks'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { withAccelerate } from '@prisma/extension-accelerate'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    const accelerateUrl = configService.get<string>('CRACK_PRISMA_ACCELERATE_URL')
    if (!accelerateUrl) {
      throw new Error('CRACK_PRISMA_ACCELERATE_URL is not defined')
    }

    super({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: accelerateUrl
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
}
