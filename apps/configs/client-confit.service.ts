import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { ClientOptions, Transport } from "@nestjs/microservices"

@Injectable()
export class ClientConfigService {
    constructor(private config: ConfigService) { }

    getUsersClientPort(): number {
        return this.config.get<number>('USERS_CLIENT_PORT')
    }

    getBuildingsClientPort(): number {
        return this.config.get<number>('BUILDINGS_CLIENT_PORT')
    }

    get usersClientOptions(): ClientOptions {
        return {
            transport: Transport.GRPC,
            options: {
                package: 'users',
                protoPath: "libs/contracts/src/users/users.proto",
                url: `localhost:3001`
            }
        }
    }

    get cracksClientOptions(): ClientOptions {
        return {
            transport: Transport.RMQ,
            options: {
                urls: ['amqp://localhost:5672'],
                queue: 'building-maintenance',
            },
        }
    }



    get buildingsClientOptions(): ClientOptions {
        return {
            transport: Transport.TCP,
            options: {
                port: this.getBuildingsClientPort()
            }
        }
    }
}