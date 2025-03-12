import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { SchedulesModule } from '../Schedules/Schedules.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientConfigModule,
    SchedulesModule
  ],
  controllers: [
  ],
  providers: [],
})
export class ScheduleModule {}
