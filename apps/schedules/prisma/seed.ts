import { PrismaClient, DeviceType, Frequency, MaintenanceBasis } from '@prisma/client-Schedule';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Delete all existing data
  console.log('Deleting existing data...');
  await prisma.scheduleJob.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.maintenanceCycle.deleteMany();
  console.log('Existing data deleted successfully');

  const maintenanceCycles = [
    {
      device_type: DeviceType.Elevator,
      frequency: Frequency.Monthly,
      basis: MaintenanceBasis.ManufacturerRecommendation,
    },
    {
      device_type: DeviceType.FireProtection,
      frequency: Frequency.Yearly,
      basis: MaintenanceBasis.LegalStandard,
    },
    {
      device_type: DeviceType.Electrical,
      frequency: Frequency.Monthly,
      basis: MaintenanceBasis.OperationalExperience,
    },
    {
      device_type: DeviceType.Plumbing,
      frequency: Frequency.Monthly,
      basis: MaintenanceBasis.OperationalExperience,
    },
    {
      device_type: DeviceType.HVAC,
      frequency: Frequency.Monthly,
      basis: MaintenanceBasis.ManufacturerRecommendation,
    },
    {
      device_type: DeviceType.CCTV,
      frequency: Frequency.Monthly,
      basis: MaintenanceBasis.OperationalExperience,
    },
    {
      device_type: DeviceType.Generator,
      frequency: Frequency.Weekly,
      basis: MaintenanceBasis.OperationalExperience,
    },
    {
      device_type: DeviceType.Lighting,
      frequency: Frequency.Monthly,
      basis: MaintenanceBasis.OperationalExperience,
    },
    {
      device_type: DeviceType.AutomaticDoor,
      frequency: Frequency.Monthly,
      basis: MaintenanceBasis.ManufacturerRecommendation,
    },
    {
      device_type: DeviceType.FireExtinguisher,
      frequency: Frequency.Yearly,
      basis: MaintenanceBasis.LegalStandard,
    },
    {
      device_type: DeviceType.Other,
      frequency: Frequency.Specific,
      basis: MaintenanceBasis.Other,
    },
  ];

  for (const cycle of maintenanceCycles) {
    const createdCycle = await prisma.maintenanceCycle.create({
      data: cycle,
    });
    console.log(`Created maintenance cycle with id: ${createdCycle.cycle_id}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 