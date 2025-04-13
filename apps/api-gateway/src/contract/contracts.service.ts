import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom } from 'rxjs';
import { CONTRACTS_PATTERN } from 'libs/contracts/src/contracts/contracts.patterns';
import { CreateContractDto } from 'libs/contracts/src/contracts/create-contract.dto';
import { UpdateContractDto } from 'libs/contracts/src/contracts/update-contract.dto';
import { BUILDING_CLIENT } from '../constraints';
import { ContractQueryDto } from 'libs/contracts/src/contracts/contract-query.dto';

@Injectable()
export class ContractsService {
    constructor(
        @Inject(BUILDING_CLIENT) private readonly buildingsClient: ClientProxy,
    ) { }

    async createContract(createContractDto: CreateContractDto, file: any) {
        return await firstValueFrom(
            this.buildingsClient.send(CONTRACTS_PATTERN.CREATE, {
                dto: createContractDto,
                file
            }).pipe(
                catchError((error) => {
                    // Log toàn bộ cấu trúc lỗi để debug
                    console.error('Complete error object:', JSON.stringify(error, null, 2));

                    // Xử lý định dạng lỗi từ microservice
                    // Một số trường hợp phổ biến:
                    if (error.error?.statusCode) {
                        const statusCode = error.error.statusCode;
                        const message = error.error.message || 'Contract operation failed';

                        throw new HttpException({ statusCode, message, error: error.error.error }, statusCode);
                    }

                    // Một số microservice trả về lỗi được bọc trong property 'err'
                    if (error.err?.error?.statusCode) {
                        const statusCode = error.err.error.statusCode;
                        const message = error.err.error.message || 'Contract operation failed';

                        throw new HttpException({ statusCode, message, error: error.err.error.error }, statusCode);
                    }

                    // Lỗi được bọc trong message
                    if (typeof error === 'object' && error.message && error.message.includes('not found')) {
                        throw new HttpException({
                            statusCode: HttpStatus.NOT_FOUND,
                            message: error.message
                        }, HttpStatus.NOT_FOUND);
                    }

                    // Lỗi mặc định
                    throw new HttpException(
                        {
                            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                            message: 'An unexpected error occurred during contract operation',
                            error: error.message || error
                        },
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                })
            ),
        );
    }

    async getAllContracts(queryDto: ContractQueryDto) {
        return await firstValueFrom(
            this.buildingsClient.send(CONTRACTS_PATTERN.GET_ALL, queryDto),
        );
    }

    async getContractById(contractId: string) {
        return await firstValueFrom(
            this.buildingsClient.send(CONTRACTS_PATTERN.GET_BY_ID, { contractId }),
        );
    }

    async updateContract(contractId: string, updateContractDto: UpdateContractDto) {
        return await firstValueFrom(
            this.buildingsClient.send(CONTRACTS_PATTERN.UPDATE, {
                contractId,
                data: updateContractDto,
            }),
        );
    }

    async deleteContract(contractId: string) {
        return await firstValueFrom(
            this.buildingsClient.send(CONTRACTS_PATTERN.DELETE, { contractId }),
        );
    }
}
