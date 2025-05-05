import { PrismaClient, DeviceType, Frequency, MaintenanceBasis } from '@prisma/client-schedule'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Delete all existing data
  console.log('Deleting existing data...')
  await prisma.scheduleJob.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.maintenanceCycle.deleteMany()
  console.log('Existing data deleted successfully')

  const maintenanceCycles = [
    // Elevator maintenance
    {
      device_type: DeviceType.Elevator,
      frequency: Frequency.Monthly,
      basis: MaintenanceBasis.ManufacturerRecommendation,
    },
    {
      device_type: DeviceType.Elevator,
      frequency: 'Quarterly' as unknown as Frequency,
      basis: MaintenanceBasis.LegalStandard,
    },

    // Fire Protection systems
    {
      device_type: DeviceType.FireProtection,
      frequency: 'Quarterly' as unknown as Frequency,
      basis: MaintenanceBasis.LegalStandard,
    },
    {
      device_type: DeviceType.FireProtection,
      frequency: Frequency.Yearly,
      basis: MaintenanceBasis.LegalStandard,
    },

    // Electrical systems
    {
      device_type: DeviceType.Electrical,
      frequency: Frequency.Monthly,
      basis: MaintenanceBasis.OperationalExperience,
    },
    {
      device_type: DeviceType.Electrical,
      frequency: 'Quarterly' as unknown as Frequency,
      basis: MaintenanceBasis.LegalStandard,
    },

    // Plumbing systems
    {
      device_type: DeviceType.Plumbing,
      frequency: Frequency.Monthly,
      basis: MaintenanceBasis.OperationalExperience,
    },
    {
      device_type: DeviceType.Plumbing,
      frequency: 'Quarterly' as unknown as Frequency,
      basis: MaintenanceBasis.ManufacturerRecommendation,
    },

    // HVAC systems - seasonal maintenance makes quarterly appropriate
    {
      device_type: DeviceType.HVAC,
      frequency: 'Quarterly' as unknown as Frequency,
      basis: MaintenanceBasis.ManufacturerRecommendation,
    },
    {
      device_type: DeviceType.HVAC,
      frequency: Frequency.Yearly,
      basis: MaintenanceBasis.LegalStandard,
    },

    // CCTV systems
    {
      device_type: DeviceType.CCTV,
      frequency: Frequency.Monthly,
      basis: MaintenanceBasis.OperationalExperience,
    },
    {
      device_type: DeviceType.CCTV,
      frequency: 'Quarterly' as unknown as Frequency,
      basis: MaintenanceBasis.ManufacturerRecommendation,
    },

    // Generator
    {
      device_type: DeviceType.Generator,
      frequency: Frequency.Weekly,
      basis: MaintenanceBasis.OperationalExperience,
    },
    {
      device_type: DeviceType.Generator,
      frequency: 'Quarterly' as unknown as Frequency,
      basis: MaintenanceBasis.ManufacturerRecommendation,
    },

    // Lighting systems
    {
      device_type: DeviceType.Lighting,
      frequency: 'Quarterly' as unknown as Frequency,
      basis: MaintenanceBasis.OperationalExperience,
    },

    // Automatic doors
    {
      device_type: DeviceType.AutomaticDoor,
      frequency: 'Quarterly' as unknown as Frequency,
      basis: MaintenanceBasis.ManufacturerRecommendation,
    },

    // Fire extinguishers
    {
      device_type: DeviceType.FireExtinguisher,
      frequency: 'Quarterly' as unknown as Frequency,
      basis: MaintenanceBasis.OperationalExperience,
    },
    {
      device_type: DeviceType.FireExtinguisher,
      frequency: Frequency.Yearly,
      basis: MaintenanceBasis.LegalStandard,
    },

    // Building structure maintenance
    {
      device_type: 'BuildingStructure' as unknown as DeviceType,
      frequency: 'Quarterly' as unknown as Frequency,
      basis: MaintenanceBasis.LegalStandard,
    },
    {
      device_type: 'BuildingStructure' as unknown as DeviceType,
      frequency: Frequency.Yearly,
      basis: MaintenanceBasis.ManufacturerRecommendation,
    },

    // Other equipment
    {
      device_type: DeviceType.Other,
      frequency: Frequency.Specific,
      basis: MaintenanceBasis.Other,
    },
  ]

  for (const cycle of maintenanceCycles) {
    const createdCycle = await prisma.maintenanceCycle.create({
      data: cycle,
    })
    console.log(`Created maintenance cycle with id: ${createdCycle.cycle_id}`)
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 