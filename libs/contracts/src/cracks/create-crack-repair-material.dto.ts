import { IsUUID, IsNumber } from 'class-validator';

export class CreateCrackRepairMaterialDto {
  @IsUUID()
  crackDetailsId: string;

  @IsUUID()
  materialId: string;

  @IsNumber()
  quantity: number;
}
