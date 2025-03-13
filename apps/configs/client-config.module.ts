import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import * as joi from "joi"
import { ClientConfigService } from "./client-confit.service"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: joi.object({
                USERS_CLIENT_PORT: joi.number().default(3001),
                BUILDINGS_CLIENT_PORT: joi.number().default(3002),
                TASKS_CLIENT_PORT: joi.number().default(3003),
                SCHEDULES_CLIENT_PORT: joi.number().default(3004),

            })
        }
        )
    ],
    providers: [ClientConfigService],
    exports: [ClientConfigService]
})

export class ClientConfigModule { }