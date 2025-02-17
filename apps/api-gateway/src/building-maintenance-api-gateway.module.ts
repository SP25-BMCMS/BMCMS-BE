import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { UsersModule } from './users/users.module'
import { CracksModule } from './cracks/cracks.module';

@Module({
  imports: [UsersModule, CracksModule, ConfigModule.forRoot()],

})
export class BuildingMaintenanceApiGatewayModule { }
