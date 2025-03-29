import { Observable } from 'rxjs';

export interface ResidentInterface {
  getAllResidents({}): Observable<any>;
}
