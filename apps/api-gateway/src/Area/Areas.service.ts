import {  AREAS_PATTERN } from '@app/contracts/Areas/Areas.patterns'
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { BUILDING_CLIENT } from '../constraints'
// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'

@Injectable()
export class AreasService {
  constructor(@Inject(BUILDING_CLIENT) private readonly areasClient: ClientProxy) {}

  async getAreas() {
    try {
      return await this.areasClient.send(AREAS_PATTERN.GET, {});
    } catch (error) {
      throw new HttpException('Error occurred while fetching areas.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createArea(createAreaDto: any) {
    try {
      return await this.areasClient.send(AREAS_PATTERN.CREATE, createAreaDto);
    } catch (error) {
      throw new HttpException('Error occurred while creating area.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAreaById(areaId: string) {
    try {
      return await this.areasClient.send(AREAS_PATTERN.GET_BY_ID, { areaId });
    } catch (error) {
      throw new HttpException('Error occurred while fetching area by ID.', HttpStatus.NOT_FOUND);
    }
  }

  async updateArea(updateAreaDto: any) {
    try {
      return await this.areasClient.send(AREAS_PATTERN.UPDATE, updateAreaDto);
    } catch (error) {
      throw new HttpException('Error occurred while updating area.', HttpStatus.BAD_REQUEST);
    }
  }

  async deleteArea(areaId: string) {
    try {
      return await this.areasClient.send(AREAS_PATTERN.DELELTE, { areaId });
    } catch (error) {
      throw new HttpException('Error occurred while deleting area.', HttpStatus.NOT_FOUND);
    }
  }
}