import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
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

    async createContract(createContractDto: CreateContractDto) {
        return await firstValueFrom(
            this.buildingsClient.send(CONTRACTS_PATTERN.CREATE, createContractDto),
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
