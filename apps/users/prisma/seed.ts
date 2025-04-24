import { PrismaClient } from '@prisma/client-users';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  // Clear existing data to avoid unique constraint errors
  console.log('Cleaning up existing data...');
  await prisma.apartment.deleteMany({});
  await prisma.userDetails.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.workingPosition.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('Seeding departments...');
  // 1. Seed Departments
  const department1 = await prisma.department.create({
    data: {
      departmentName: 'Primary Technicians',
      area: 'The Rainbow',
      description: 'Manage maintenance for the entire area'
    }
  });
  const department2 = await prisma.department.create({
    data: {
      departmentName: 'HVAC Technicians',
      area: 'The Rainbow',
      description: 'Manage crack maintenance'
    }
  });
  const department3 = await prisma.department.create({
    data: {
      departmentName: 'Cleaning Technicians',
      area: 'The Rainbow',
      description: 'Responsible for cleaning the entire area'
    }
  });
  const department4 = await prisma.department.create({
    data: {
      departmentName: 'Maintenance Technicians',
      area: 'The Rainbow',
      description: 'Responsible for maintaining technical equipment'
    }
  });

  console.log('Seeding positions...');
  const position1 = await prisma.workingPosition.create({
    data: {
      positionName: 'Leader',
      description: 'Lead Engineer'
    }
  });
  const position2 = await prisma.workingPosition.create({
    data: {
      positionName: 'Technician',
      description: 'HVAC Technician'
    }
  });
  const position3 = await prisma.workingPosition.create({
    data: {
      positionName: 'Janitor',
      description: 'Common area cleaning staff'
    }
  });
  const position4 = await prisma.workingPosition.create({
    data: {
      positionName: 'Maintenance_Technician',
      description: 'General maintenance technician'
    }
  });

  // Hash passwords for security
  const hashedPassword = await hashPassword('123456');

  // 3. Seed Users (Admin, Manager, Resident, Staff)
  console.log('Seeding users...');
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      phone: '0909999999',
      role: 'Admin',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Male',
      accountStatus: 'Active'
    }
  });

  const manager = await prisma.user.create({
    data: {
      username: 'manager',
      password: hashedPassword,
      email: 'manager@example.com',
      phone: '0908888888',
      role: 'Manager',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Male',
      accountStatus: 'Active'
    }
  });

  const resident = await prisma.user.create({
    data: {
      username: 'resident1',
      password: hashedPassword,
      email: 'huyflamingo1@gmail.com',
      phone: '0911628211',
      role: 'Resident',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Male',
      accountStatus: 'Active'
    }
  });

  const leader = await prisma.user.create({
    data: {
      username: 'leader',
      password: hashedPassword,
      email: 'leader@example.com',
      phone: '0906666666',
      role: 'Staff',
      dateOfBirth: new Date('1995-05-10'),
      gender: 'Female',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff1.jpg',
          positionId: position1.positionId,
          departmentId: department1.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  const technician = await prisma.user.create({
    data: {
      username: 'technician',
      password: hashedPassword,
      email: 'technician@example.com',
      phone: '0906666661',
      role: 'Staff',
      dateOfBirth: new Date('1995-05-10'),
      gender: 'Female',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff2.jpg',
          positionId: position2.positionId,
          departmentId: department2.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  const janitor = await prisma.user.create({
    data: {
      username: 'janitor',
      password: hashedPassword,
      email: 'janitor@example.com',
      phone: '0906666662',
      role: 'Staff',
      dateOfBirth: new Date('1995-05-10'),
      gender: 'Female',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff3.jpg',
          positionId: position3.positionId,
          departmentId: department3.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  const maintenance_technician = await prisma.user.create({
    data: {
      username: 'maintenance_technician',
      password: hashedPassword,
      email: 'maintenance_technician@example.com',
      phone: '0906666663',
      role: 'Staff',
      dateOfBirth: new Date('1995-05-10'),
      gender: 'Female',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff4.jpg',
          positionId: position4.positionId,
          departmentId: department4.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  // 4. Seed Apartments for Resident
  console.log('Seeding apartments...');
  await prisma.apartment.createMany({
    data: [
      {
        apartmentName: 'S107.15152',
        buildingDetailId: 'cdc621f5-795c-4769-a7ec-34cb2b7cca72',
        ownerId: resident.userId,
        warrantyDate: '2035-04-11T00:00:00.000Z'
      },
      {
        apartmentName: 'S106.12122',
        buildingDetailId: 'a1ccc92a-05e2-4739-9afa-0e619e8c1551',
        ownerId: resident.userId,
        warrantyDate: '2035-04-11T00:00:00.000Z'
      }
    ]
  });

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => console.error('❌ Seed error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
