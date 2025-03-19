import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USERS_CLIENT } from '../../constraints';
import { join } from 'path';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: USERS_CLIENT,
                transport: Transport.GRPC,
                options: {
                    package: 'users',
                    protoPath: join(process.cwd(), 'libs/contracts/src/users/users.proto'),
                },
            },
        ]),
    ],
    controllers: [EmployeeController],
    providers: [EmployeeService],
})
export class EmployeeModule { }
