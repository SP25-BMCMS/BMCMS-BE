import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { NotificationsModule } from './notifications/notifications.module';
// ...other imports

@Module({
    imports: [
        // ...other imports
    ],
    controllers: [],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                whitelist: true,
                transform: true,
                transformOptions: { enableImplicitConversion: true }
            }),
        },
        // ...other providers
    ],
})
export class AppModule { } 