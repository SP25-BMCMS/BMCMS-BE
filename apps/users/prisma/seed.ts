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
  // 1. Seed Departments for Rainbow Area
  const departmentRainbowPrimary = await prisma.department.create({
    data: {
      departmentName: 'Primary Technicians',
      area: 'The Rainbow',
      description: 'Manage primary maintenance for The Rainbow area'
    }
  });

  const departmentRainbowHVAC = await prisma.department.create({
    data: {
      departmentName: 'HVAC Technicians',
      area: 'The Rainbow',
      description: 'Specialized in HVAC systems for The Rainbow area'
    }
  });

  const departmentRainbowElectrical = await prisma.department.create({
    data: {
      departmentName: 'Electrical Technicians',
      area: 'The Rainbow',
      description: 'Specialized in electrical systems for The Rainbow area'
    }
  });

  // Departments for Origami Area
  const departmentOrigamiPrimary = await prisma.department.create({
    data: {
      departmentName: 'Primary Technicians',
      area: 'The Origami',
      description: 'Manage primary maintenance for The Origami area'
    }
  });

  const departmentOrigamiHVAC = await prisma.department.create({
    data: {
      departmentName: 'HVAC Technicians',
      area: 'The Origami',
      description: 'Specialized in HVAC systems for The Origami area'
    }
  });

  const departmentOrigamiPlumbing = await prisma.department.create({
    data: {
      departmentName: 'Plumbing Technicians',
      area: 'The Origami',
      description: 'Specialized in plumbing systems for The Origami area'
    }
  });

  console.log('Seeding positions...');
  const positionLeader = await prisma.workingPosition.create({
    data: {
      positionName: 'Leader',
      description: 'Trưởng nhóm',
    },
  })

  const positionTechnician = await prisma.workingPosition.create({
    data: {
      positionName: 'Technician',
      description: 'Kỹ thuật viên',
    },
  })


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

  const rainbowManager = await prisma.user.create({
    data: {
      username: 'rainbow_manager',
      password: hashedPassword,
      email: 'rainbow_manager@example.com',
      phone: '0908888888',
      role: 'Manager',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Male',
      accountStatus: 'Active'
    }
  });

  const origamiManager = await prisma.user.create({
    data: {
      username: 'origami_manager',
      password: hashedPassword,
      email: 'origami_manager@example.com',
      phone: '0909876543',
      role: 'Manager',
      dateOfBirth: new Date('1985-05-12'),
      gender: 'Female',
      accountStatus: 'Active'
    }
  });

  const resident1 = await prisma.user.create({
    data: {
      username: 'resident1',
      password: hashedPassword,
      email: 'resident1@example.com',
      phone: '0911628211',
      role: 'Resident',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Male',
      accountStatus: 'Active'
    }
  });

  const resident2 = await prisma.user.create({
    data: {
      username: 'resident2',
      password: hashedPassword,
      email: 'resident2@example.com',
      phone: '0911628212',
      role: 'Resident',
      dateOfBirth: new Date('1992-05-15'),
      gender: 'Female',
      accountStatus: 'Active'
    }
  });

  // Staff for Rainbow Area
  const rainbowLeader = await prisma.user.create({
    data: {
      username: 'rainbow_leader',
      password: hashedPassword,
      email: 'rainbow_leader@example.com',
      phone: '0901111111',
      role: 'Staff',
      dateOfBirth: new Date('1985-03-10'),
      gender: 'Male',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff_rainbow_leader.jpg',
          positionId: positionLeader.positionId,
          departmentId: departmentRainbowPrimary.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  const rainbowHVAC = await prisma.user.create({
    data: {
      username: 'rainbow_hvac',
      password: hashedPassword,
      email: 'rainbow_hvac@example.com',
      phone: '0902222222',
      role: 'Staff',
      dateOfBirth: new Date('1988-07-22'),
      gender: 'Male',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff_rainbow_hvac.jpg',
          positionId: positionTechnician.positionId,
          departmentId: departmentRainbowHVAC.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  const rainbowElectrical = await prisma.user.create({
    data: {
      username: 'rainbow_electrical',
      password: hashedPassword,
      email: 'rainbow_electrical@example.com',
      phone: '0904444444',
      role: 'Staff',
      dateOfBirth: new Date('1987-04-30'),
      gender: 'Male',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff_rainbow_electrical.jpg',
          positionId: positionTechnician.positionId,
          departmentId: departmentRainbowElectrical.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  // Staff for Origami Area
  const origamiLeader = await prisma.user.create({
    data: {
      username: 'origami_leader',
      password: hashedPassword,
      email: 'origami_leader@example.com',
      phone: '0905555555',
      role: 'Staff',
      dateOfBirth: new Date('1986-06-20'),
      gender: 'Female',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff_origami_leader.jpg',
          positionId: positionLeader.positionId,
          departmentId: departmentOrigamiPrimary.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  const origamiHVAC = await prisma.user.create({
    data: {
      username: 'origami_hvac',
      password: hashedPassword,
      email: 'origami_hvac@example.com',
      phone: '0906666666',
      role: 'Staff',
      dateOfBirth: new Date('1989-09-25'),
      gender: 'Male',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff_origami_hvac.jpg',
          positionId: positionTechnician.positionId,
          departmentId: departmentOrigamiHVAC.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  const origamiPlumbing = await prisma.user.create({
    data: {
      username: 'origami_plumbing',
      password: hashedPassword,
      email: 'origami_plumbing@example.com',
      phone: '0908888889',
      role: 'Staff',
      dateOfBirth: new Date('1988-02-15'),
      gender: 'Male',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff_origami_plumbing.jpg',
          positionId: positionTechnician.positionId,
          departmentId: departmentOrigamiPlumbing.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  // Supervisor roles for both areas
  const rainbowSupervisor = await prisma.user.create({
    data: {
      username: 'rainbow_supervisor',
      password: hashedPassword,
      email: 'rainbow_supervisor@example.com',
      phone: '0909999991',
      role: 'Staff',
      dateOfBirth: new Date('1982-08-10'),
      gender: 'Male',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff_rainbow_supervisor.jpg',
          positionId: positionTechnician.positionId,
          departmentId: departmentRainbowPrimary.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  const origamiSupervisor = await prisma.user.create({
    data: {
      username: 'origami_supervisor',
      password: hashedPassword,
      email: 'origami_supervisor@example.com',
      phone: '0909999992',
      role: 'Staff',
      dateOfBirth: new Date('1983-10-05'),
      gender: 'Female',
      accountStatus: 'Active',
      userDetails: {
        create: {
          image: 'staff_origami_supervisor.jpg',
          positionId: positionTechnician.positionId,
          departmentId: departmentOrigamiPrimary.departmentId,
          staffStatus: 'Active'
        }
      }
    }
  });

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => console.error('❌ Seed error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
