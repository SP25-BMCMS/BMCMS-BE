import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';
import { Observable } from 'rxjs';

export interface ResidentInterface {
  getAllResidents(paginationParams: PaginationParams): Observable<any>;
}
