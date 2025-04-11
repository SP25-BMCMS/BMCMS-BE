// redis.module.ts
import { Global, Module } from '@nestjs/common'
import { createClient } from 'redis'
import { ConfigService } from '@nestjs/config'

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async (configService: ConfigService) => {
                const redisUrl = configService.get<string>('REDIS_URL')
                if (!redisUrl) {
                    throw new Error('REDIS_URL environment variable is not set')
                }

                const client = createClient({
                    url: redisUrl,
                    socket: {
                        tls: true,
                        rejectUnauthorized: false,
                        reconnectStrategy: (retries) => {
                            if (retries > 10) {
                                return new Error('Max retries reached')
                            }
                            return Math.min(retries * 100, 3000)
                        }
                    }
                })

                client.on('error', (err) => console.error('Redis Client Error', err))
                client.on('connect', () => console.log('Redis Client Connected'))

                await client.connect()
                return client
            },
            inject: [ConfigService]
        }
    ],
    exports: ['REDIS_CLIENT']
})
export class RedisModule { }
