import { IsEnum } from 'class-validator';
import { $Enums } from '@prisma/client-Task';

export class ChangeTaskStatusDto {
  status: $Enums.Status;
}