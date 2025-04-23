import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-notifications';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(private configService: ConfigService) {
        const url = configService.get<string>('DB_NOTIFICATION_SERVICE');
        if (!url) {
            throw new Error('DB_NOTIFICATION_SERVICE environment variable is not set');
        }

        super({
            log: ['error', 'warn', 'info'],
            datasources: {
                db: { url }
            }
        });

        this.logger.log('PrismaService initialized');
    }

    async onModuleInit() {
        try {
            this.logger.log('Connecting to Notification database...');
            await this.$connect();
            this.logger.log('Successfully connected to Notification database');

            // Test the connection with a simple query
            await this.$queryRaw`SELECT 1 as check_connection`;
            this.logger.log('Database connection test completed successfully');
        } catch (error) {
            this.logger.error(`Failed to connect to database: ${error.message}`, error.stack);
            this.logger.error(`Database URL: ${this.configService.get<string>('DB_NOTIFICATION_SERVICE') ? 'is set' : 'is NOT set'}`);
            throw error;
        }
    }

    async onModuleDestroy() {
        try {
            this.logger.log('Disconnecting from database...');
            await this.$disconnect();
            this.logger.log('Disconnected from database');
        } catch (error) {
            this.logger.error(`Error disconnecting from database: ${error.message}`);
        }
    }
} 