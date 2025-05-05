import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { CONTRACTS_PATTERN } from 'libs/contracts/src/contracts/contracts.patterns';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from 'libs/contracts/src/contracts/create-contract.dto';
import { UpdateContractDto } from 'libs/contracts/src/contracts/update-contract.dto';
import { ContractQueryDto } from 'libs/contracts/src/contracts/contract-query.dto';

@Controller('contracts')
export class ContractsController {
    constructor(private contractsService: ContractsService) { }

    @MessagePattern(CONTRACTS_PATTERN.CREATE)
    async createContract(@Payload() payload: { dto: CreateContractDto, file: any }) {
        try {
            return await this.contractsService.createContract(payload.dto, payload.file);
        } catch (error) {
            console.error('Error in createContract:', error);
            throw error;
        }
    }

    @MessagePattern(CONTRACTS_PATTERN.GET_ALL)
    async getAllContracts(@Payload() queryDto: ContractQueryDto) {
        try {
            return await this.contractsService.getAllContracts(queryDto);
        } catch (error) {
            console.error('Error in getAllContracts:', error);
            throw error;
        }
    }

    @MessagePattern(CONTRACTS_PATTERN.GET_BY_ID)
    async getContractById(@Payload() payload: { contractId: string }) {
        try {
            console.log('Retrieving contract with ID:', payload.contractId);
            return await this.contractsService.getContractById(payload.contractId);
        } catch (error) {
            console.error('Error in getContractById:', error);
            throw error;
        }
    }

    @MessagePattern(CONTRACTS_PATTERN.UPDATE)
    async updateContract(@Payload() payload: { contractId: string; data: UpdateContractDto }) {
        try {
            return await this.contractsService.updateContract(
                payload.contractId,
                payload.data,
            );
        } catch (error) {
            console.error('Error in updateContract:', error);
            throw error;
        }
    }

    @MessagePattern(CONTRACTS_PATTERN.UPDATE_WITH_FILE)
    async updateContractWithFile(@Payload() payload: { contractId: string; data: UpdateContractDto, file: any }) {
        try {
            return await this.contractsService.updateContractWithFile(
                payload.contractId,
                payload.data,
                payload.file,
            );
        } catch (error) {
            console.error('Error in updateContractWithFile:', error);
            throw error;
        }
    }

    @MessagePattern(CONTRACTS_PATTERN.DELETE)
    async deleteContract(@Payload() payload: { contractId: string }) {
        try {
            return await this.contractsService.deleteContract(payload.contractId);
        } catch (error) {
            console.error('Error in deleteContract:', error);
            throw error;
        }
    }
}
