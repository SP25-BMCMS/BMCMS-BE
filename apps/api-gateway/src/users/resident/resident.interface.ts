import { Observable } from 'rxjs';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';

export interface ResidentInterface {
  getAllResidents(paginationParams: PaginationParams): Observable<any>;
  getApartmentsByResidentId(data: { residentId: string }): Observable<any>;
  getApartmentByResidentAndApartmentId(data: { residentId: string, apartmentId: string }): Observable<any>;
}
