import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client-Task';
import { log } from 'console';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    console.log('task Initialized'); // Add a debug log to ensure service is being initialized

    const url = config.get<string>('DB_TASKS_SERVICE');
    // console.log("database: ", process.env.DATABASE_URL);

    super({
      datasources: {
        db: {
          url,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    // teardown logic
    //   return Promise.all([this.user.deleteMany()])
  }
}
