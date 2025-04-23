import { ApiProperty } from '@nestjs/swagger';

export class ContractDto {
    @ApiProperty({
        description: 'The ID of the contract',
        example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
    })
    contract_id: string;

    @ApiProperty({
        description: 'The start date of the contract',
        example: '2023-01-01',
        required: false,
        type: Date
    })
    start_date?: Date;

    @ApiProperty({
        description: 'The end date of the contract',
        example: '2024-01-01',
        required: false,
        type: Date
    })
    end_date?: Date;

    @ApiProperty({
        description: 'The vendor of the contract',
        example: 'ABC Company',
        required: false
    })
    vendor?: string;

    @ApiProperty({
        description: 'Devices associated with the contract',
        type: [Object],
        required: false
    })
    devices?: any[];
} 