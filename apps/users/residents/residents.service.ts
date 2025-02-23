import { ResidentDto } from '@app/contracts/residents/resident.dto'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ResidentsService {
  constructor(private prisma: PrismaService) { }

  async getAllResidents()
    : Promise<{ residents: ResidentDto[] }> {
    const residents = await this.prisma.resident.findMany()
    return { residents: residents }
  }
}
