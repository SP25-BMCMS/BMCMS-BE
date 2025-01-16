import { Injectable } from '@nestjs/common';
import { CreateTaskAssignmentDto } from './dto/create-task-assignment.dto';
import { UpdateTaskAssignmentDto } from './dto/update-task-assignment.dto';

@Injectable()
export class TaskAssignmentsService {
  create(createTaskAssignmentDto: CreateTaskAssignmentDto) {
    return 'This action adds a new taskAssignment';
  }

  findAll() {
    return `This action returns all taskAssignments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} taskAssignment`;
  }

  update(id: number, updateTaskAssignmentDto: UpdateTaskAssignmentDto) {
    return `This action updates a #${id} taskAssignment`;
  }

  remove(id: number) {
    return `This action removes a #${id} taskAssignment`;
  }
}
