import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { BUILDING_CLIENT } from '../constraints'
import { AREAS_PATTERN } from 'libs/contracts/src/Areas/Areas.patterns';
import { firstValueFrom } from 'rxjs';
import { PaginationParams } from '@app/contracts/Pagination/pagination.dto';
import { CreateAreaDto } from '@app/contracts/Areas/create-areas.dto';
import { UpdateAreaDto } from '@app/contracts/Areas/update.areas';
// import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto'
// import { buildingsDto } from '@app/contracts/buildings/buildings.dto'
// import { catchError, firstValueFrom } from 'rxjs'

@Injectable()
export class AreasService {
  constructor(@Inject(BUILDING_CLIENT) private readonly areasClient: ClientProxy) {}

  async getAllAreas(paginationParams: PaginationParams) {
    try {
      return await firstValueFrom(
        this.areasClient.send(AREAS_PATTERN.GET, paginationParams)
      );
    } catch (error) {
      console.error('Error in getAllAreas:', error);
      throw error;
    }
  }

  async createArea(createAreaDto: CreateAreaDto) {
    try {
      return await firstValueFrom(
        this.areasClient.send(AREAS_PATTERN.CREATE, createAreaDto)
      );
    } catch (error) {
      throw new HttpException('Error occurred while creating area.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAreaById(areaId: string) {
    try {
      return await firstValueFrom(
        this.areasClient.send(AREAS_PATTERN.GET_BY_ID, { area_id: areaId })
      );
    } catch (error) {
      throw new HttpException('Error occurred while fetching area by ID.', HttpStatus.NOT_FOUND);
    }
  }

  async updateArea(id: string, updateAreaDto: UpdateAreaDto) {
    try {
      return await firstValueFrom(
        this.areasClient.send(AREAS_PATTERN.UPDATE, { id, ...updateAreaDto })
      );
    } catch (error) {
      throw new HttpException('Error occurred while updating area.', HttpStatus.BAD_REQUEST);
    }
  }

  async deleteArea(areaId: string) {
    try {
      return await firstValueFrom(
        this.areasClient.send(AREAS_PATTERN.DELELTE, { area_id: areaId })
      );
    } catch (error) {
      throw new HttpException('Error occurred while deleting area.', HttpStatus.NOT_FOUND);
    }
  }
}