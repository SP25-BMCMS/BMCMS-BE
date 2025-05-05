import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import { NotificationsModule } from './notifications/notifications.module';
import { MaterialModule } from './Material/Material.module';
import { EnumLabelInterceptor } from './common/interceptors/enum-label.interceptor';
// ...other imports

@Module({
    imports: [
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
        {
            provide: APP_INTERCEPTOR,
            useClass: EnumLabelInterceptor,
        },
        // ...other providers
    ],
})
export class AppModule { } 