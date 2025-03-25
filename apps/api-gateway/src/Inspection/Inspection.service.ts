import {
  Body,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_CLIENT } from '../constraints'
import { catchError, firstValueFrom } from 'rxjs';
import { INSPECTIONS_PATTERN } from 'libs/contracts/src/inspections/inspection.patterns';
import { UpdateInspectionDto } from 'libs/contracts/src/inspections/update-inspection.dto';

@Injectable()
export class InspectionService {
  constructor(@Inject(TASK_CLIENT) private readonly inspectionClient: ClientProxy) { }

 
  async GetInspectionByTaskAssignmentId(task_assignment_id: string) {
    try {
      return this.inspectionClient.send(
        INSPECTIONS_PATTERN.GET_BY_ID_Task_Assignment,
        {
          task_assignment_id,
        },
      );
    } catch (error) {
      throw new HttpException(
        'Inspection not found with the given task assignment ID = ' +
        task_assignment_id,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async updateInspection(@Param('id') inspection_id: string, @Body() dto: UpdateInspectionDto) {
    return firstValueFrom(
      this.inspectionClient.send(INSPECTIONS_PATTERN.UPDATE, { inspection_id, dto }).pipe(
        catchError(err => {
          throw new NotFoundException(err.message);
        })
      )
    );
  }

  async GetInspectionByCrackId(crack_id: string) {
    try {
      return this.inspectionClient.send(
        INSPECTIONS_PATTERN.GET_BY_CRACK_ID,
        { crack_id }
      );
    } catch (error) {
      throw new HttpException(
        'Inspection not found with the given crack ID = ' + crack_id,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async GetAllInspections() {
    try {
      return this.inspectionClient.send(
        INSPECTIONS_PATTERN.GET,
        {}
      );
    } catch (error) {
      throw new HttpException(
        'Error retrieving all inspections',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }



  // async GetInspectionByTaskAssignmentId(task_assignment_id: string) {
  //   try {
  //     return this.inspectionClient.send(
  //       INSPECTIONS_PATTERN.GET_BY_ID_Task_Assignment,
  //       {
  //         task_assignment_id,
  //       },
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       'Inspection not found with the given task assignment ID = ' +
  //       task_assignment_id,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  // }

  // async updateInspection(@Param('id') inspection_id: string, @Body() dto: UpdateInspectionDto) {
  //   return firstValueFrom(
  //     this.inspectionClient.send(INSPECTIONS_PATTERN.UPDATE, { inspection_id, dto }).pipe(
  //       catchError(err => {
  //         throw new NotFoundException(err.message);
  //       })
  //     )
  //   );
  // }

  // async GetInspectionByCrackId(crack_id: string) {
  //   try {
  //     return this.inspectionClient.send(
  //       INSPECTIONS_PATTERN.GET_BY_CRACK_ID,
  //       { crack_id }
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       'Inspection not found with the given crack ID = ' + crack_id,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  // }

  // async GetAllInspections() {
  //   try {
  //     return this.inspectionClient.send(
  //       INSPECTIONS_PATTERN.GET,
  //       {}
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       'Error retrieving all inspections',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
} 