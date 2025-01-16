import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskAssignmentDto } from './create-task-assignment.dto';

export class UpdateTaskAssignmentDto extends PartialType(CreateTaskAssignmentDto) {}
