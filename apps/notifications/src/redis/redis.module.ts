// redis.module.ts
import { Global, Module } from '@nestjs/common'
import { createClient } from 'redis'

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async () => {
                const isLocal = process.env.NODE_ENV !== 'production'
                const client = createClient({
                    url: isLocal ? 'redis://localhost:6379' : 'redis://redis:6379'
                })
                await client.connect()
                return client
            }
        }
    ],
    exports: ['REDIS_CLIENT']
})
export class RedisModule { }
