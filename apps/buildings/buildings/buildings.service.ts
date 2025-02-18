import { CreateBuildingDto } from '@app/contracts/buildings/create-buildings.dto';
import { UpdateBuildingDto } from '@app/contracts/buildings/update-buildings.dto';
import { Injectable } from '@nestjs/common';
import { Payload, RpcException } from '@nestjs/microservices';
import { PrismaClient  } from '@prisma/client-building';
import { UUID } from 'crypto';

@Injectable()
export class BuildingsService {
    private prisma = new PrismaClient();

    // Create a new building
    async createBuilding(@Payload() CreateBuildingDto : CreateBuildingDto) {
      try {
        const newBuilding= await this.prisma.building.create({
          data: {
            name: CreateBuildingDto.name,
            description: CreateBuildingDto.description,
            numberFloor: CreateBuildingDto.numberFloor,
            imageCover: CreateBuildingDto.imageCover,
            areaId: CreateBuildingDto.areaId,
          },
        });
        // return new RpcException({
        //   statusCode: 200,
        //   message: "Building created fail"
        // })
        return newBuilding;
      } catch (error) {
      throw  new RpcException({
    statusCode: 400,
    message: "Building created fail"
      })
      }
  
    }
  
    // Read a building by buildingId
    async readBuilding() {
      const getBuilding= await this.prisma.building.findMany({
      });
if(getBuilding == null){
  throw new RpcException({ statusCode: 400, message: 'no buillding!' })

}

    }
  
    // Update an existing building
    async updateBuilding(UpdateBuildingDto: UpdateBuildingDto) {
      return await this.prisma.building.update({
        where: {
          buildingId: UpdateBuildingDto.buildingId,
        },
        data: {
          name: UpdateBuildingDto.name,
          description: UpdateBuildingDto.description,
          numberFloor: UpdateBuildingDto.numberFloor,
          imageCover: UpdateBuildingDto.imageCover,
          areaId: UpdateBuildingDto.areaId,
        },
      });
    }
  
    // Delete a building by buildingId
    async deleteBuilding(buildingId: UUID) {
      return await this.prisma.building.delete({
        where: {
          buildingId 
        },
      });
    }



}
