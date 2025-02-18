import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {BuildingsService} from './buildings.service';
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns';
@Controller('buildings')
export class BuildingsController {

  constructor(private BuildingsService: BuildingsService) { }

    @MessagePattern(BUILDINGS_PATTERN.CREATE)
    createBuilding(@Payload() data: any) {
try {
  const createdBuilding= this.BuildingsService.createBuilding(data);

} catch (error) {
  
}
    }
  
    // @MessagePattern(BUILDINGS_PATTERN.GET)
    // readBuilding() {
    //   return this.BuildingsService.readBuilding();
    // }
    @MessagePattern(BUILDINGS_PATTERN.GET)
    async getAllBuildings(@Payload() data: any) {
      console.log('Getting all buildings...');
      // Replace with actual logic to fetch buildings
      const buildings = [
        { buildingId: '1', name: 'Building One', description: 'Description One' },
        { buildingId: '2', name: 'Building Two', description: 'Description Two' },
      ];
      return buildings;
    }
  
    @MessagePattern(BUILDINGS_PATTERN.UPDATE)
    updateBuilding(@Payload() data: any) {
      return this.BuildingsService.updateBuilding(data);
    }
  
    @MessagePattern(BUILDINGS_PATTERN.DELELTE)
    deleteBuilding(@Payload() data: any) {
      return this.BuildingsService.deleteBuilding(data);
    }

}
