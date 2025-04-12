import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-Task';
import { ConfigService } from '@nestjs/config';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private configService: ConfigService) {
    const url = configService.get<string>('DB_TASKS_SERVICE');
    if (!url) {
      throw new Error('DATABASE_URL is not defined');
    }

    // Create a connection pool
    const pool = new Pool({ connectionString: url });

    // Initialize PrismaClient with database URL only
    super({
      datasourceUrl: url,
    });

    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to database');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    // teardown logic
    //   return Promise.all([this.user.deleteMany()])
  }
}
