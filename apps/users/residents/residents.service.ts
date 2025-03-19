import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ResidentDto } from '../../../libs/contracts/src/residents/resident.dto';

@Injectable()
export class ResidentsService {
  constructor(private prisma: PrismaService) { }

  async getAllResidents() {
    try {
      const residents = await this.prisma.user.findMany({
        where: {
          role: 'Resident'
        },
        select: {
          userId: true,
          username: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          userDetails: true,
          apartments: true
        }
      });

      return { success: true, data: residents };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getApartmentsByResidentId(residentId: string) {
    try {
      const apartments = await this.prisma.apartment.findMany({
        where: {
          ownerId: residentId
        }
      });

      return { success: true, data: apartments };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
