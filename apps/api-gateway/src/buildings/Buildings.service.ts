import { BUILDINGS_PATTERN  } from '@app/contracts/buildings/buildings.patterns'
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
 import { BUILDING_CLIENT } from '../constraints'
// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'

@Injectable()
export class BuildingsService {
  constructor(@Inject(BUILDING_CLIENT) private BuildingsClient: ClientProxy) { 
  }
    async GetBuilding() {

      const buildings= await this.BuildingsClient.send(BUILDINGS_PATTERN.GET, {})
      return buildings
    }

}
