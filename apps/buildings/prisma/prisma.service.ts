import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client-building'
import { withAccelerate } from '@prisma/extension-accelerate'
import { withOptimize } from "@prisma/extension-optimize"
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    // const accelerateUrl = configService.get<string>('BUILDING_PRISMA_ACCELERATE_URL')
    const url = configService.get<string>('DB_BUILDING_SERVICE')


    // if (!accelerateUrl) {
    //   throw new Error('BUILDING_PRISMA_ACCELERATE_URL is not defined')
    // }

    // if (!accelerateUrl.startsWith('prisma://')) {
    //   throw new Error('BUILDING_PRISMA_ACCELERATE_URL must start with prisma://')
    // }

    super({
      log: ['query', 'error', 'warn', 'info'],
      datasources: {
        db: {
          // url: accelerateUrl
          url: url
        }
      }
    })
  }

  async onModuleInit() {
    try {
      console.log('Initializing Prisma Client with Accelerate...')

      // Apply Accelerate extension first
      // this.$extends(withAccelerate())
      // this.$extends(withOptimize({ apiKey: this.configService.get<string>('BUILDING_PRISMA_OPTIMIZE_KEY') }))
      // console.log('Accelerate extension applied')

      // Then connect
      await this.$connect()
      console.log('Connected to database')

      // Test connection
      await this.$queryRaw`SELECT 1`
      console.log('Connection test successful')

      // console.log('Successfully connected to database with Accelerate')
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
    return Promise.all([this.building.deleteMany()])
  }
}
