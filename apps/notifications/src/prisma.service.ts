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
            log: ['query', 'info', 'warn', 'error'],
            errorFormat: 'pretty',
            datasources: {
                db: { url }
            }
        });

        this.logger.log(`Database URL format: ${url.substring(0, 10)}...${url.includes('@') ? url.substring(url.indexOf('@')) : '[no @ symbol found]'}`);
        this.logger.log('PrismaService initialized with detailed logging enabled');
    }

    async onModuleInit() {
        try {
            this.logger.log('Connecting to Notification database...');
            await this.$connect();
            this.logger.log('Successfully connected to Notification database');

            // Test the connection with a simple query
            const result = await this.$queryRaw`SELECT 1 as check_connection`;
            this.logger.log(`Database connection test completed successfully: ${JSON.stringify(result)}`);

            // Try a test query on the Notification table
            this.logger.log('Testing query on Notification table...');
            try {
                const notificationCount = await this.notification.count();
                this.logger.log(`Successfully queried Notification table. Current count: ${notificationCount}`);
            } catch (tableError) {
                this.logger.error(`Failed to query Notification table: ${tableError.message}`);
                this.logger.error('This might indicate a schema mismatch or migration issue');
            }
        } catch (error) {
            this.logger.error(`Failed to connect to database: ${error.message}`, error.stack);
            this.logger.error(`Database URL: ${this.configService.get<string>('DB_NOTIFICATION_SERVICE') ? 'is set' : 'is NOT set'}`);
            this.logger.error(`Full error details: ${JSON.stringify(error)}`);
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