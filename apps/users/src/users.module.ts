import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { UsersController } from '../users/users.controller';
import { UsersService } from '../users/users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ResidentsModule } from '../residents/residents.module';
import { AuthModule } from '../auth/auth.module';
import { OtpModule } from '../otp/otp.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
                RABBITMQ_USER: Joi.string().required(),
                RABBITMQ_PASSWORD: Joi.string().required(),
                RABBITMQ_HOST: Joi.string().required(),
                DB_USER_SERVICE: Joi.string().required(),
            }),
        }),
        PrismaModule,
        ResidentsModule,
        AuthModule,
        OtpModule,
        EmailModule
    ],
    controllers: [UsersController],
    providers: [UsersService],
})
export class UsersModule { } 