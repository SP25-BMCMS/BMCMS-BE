import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {BuildingsService} from './buildings.service';
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns';
import { UUID } from 'crypto';
@Controller('buildings')
export class BuildingsController {

  constructor(private BuildingsService: BuildingsService) { }

    @MessagePattern(BUILDINGS_PATTERN.CREATE)
    async createBuilding(@Payload() data: any) {
// try {
  //const createdBuilding= this.BuildingsService.createBuilding(data);
   return await this.BuildingsService.createBuilding(data);

// } catch (error) {
//   throw new RpcException({
//     statusCode: 401,
//     message: 'Builsding creation failed. Please try again later.',
//   });
// }
    }
  
    // @MessagePattern(BUILDINGS_PATTERN.GET)
    // readBuilding() {
    //   return this.BuildingsService.readBuilding();
    // }
    @MessagePattern(BUILDINGS_PATTERN.GET)
    async getAllBuildings(@Payload() data: any) {
      console.log('Getting all buildings...');
      // Replace with actual logic to fetch buildings
      // const buildings = [
      //   { buildingId: '1', name: 'Building One', description: 'Description One' },
      //   { buildingId: '2', name: 'Building Two', description: 'Description Two' },
      // ];
  return await this.BuildingsService.readBuilding();
}

  
    @MessagePattern(BUILDINGS_PATTERN.UPDATE)
    updateBuilding(@Payload() data: any) {
      return this.BuildingsService.updateBuilding(data);
    }
  
    @MessagePattern(BUILDINGS_PATTERN.DELELTE)
    deleteBuilding(@Payload() data: any) {
      return this.BuildingsService.deleteBuilding(data);
    }
    @MessagePattern(BUILDINGS_PATTERN.GET_BY_ID)
    async getBuildingById(buildingId: string) {
      return this.BuildingsService.getBuildingById(buildingId);
    }
}
