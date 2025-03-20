import { Observable } from 'rxjs';
import { createUserDto } from '../../../../../libs/contracts/src/users/create-user.dto';
import { ApiResponse } from '../../../../../libs/contracts/src/ApiReponse/api-response';
import { CreateWorkingPositionDto } from '../../../../../libs/contracts/src/users/create-working-position.dto';
import { CreateDepartmentDto } from '@app/contracts/users/create-department.dto';

export interface UserInterface {
 
  getApartmentById(data: { apartmentId: string }): Observable<any>;

}
