import { PrismaClient } from '@prisma/client-cracks';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment from root .env file
config({ path: join(__dirname, '../../../.env') });

const prisma = new PrismaClient();

// Store new crack IDs for future reference
const newCrackIds = [
  uuidv4(), // crack1
  uuidv4(), // crack2
  uuidv4(), // crack3
  uuidv4(), // crack4
  uuidv4(), // crack5
  uuidv4(), // crack6
  uuidv4(), // crack7
  uuidv4(), // crack8
  uuidv4(), // crack9
  uuidv4()  // crack10
];

// Log the new crack IDs for reference
console.log('New Crack IDs for future reference:');
newCrackIds.forEach((id, index) => {
  console.log(`Crack ${index + 1}: ${id}`);
});

const positions = [
  'kitchen/S101/S101.14.14/wall',
  'commonarea/S201/1/corridor',
  'kitchen/S101/S192/wall',
  'bedroom/S101/S192/wall',
  'other/building/1/undefined',
  'other/S1007/1/other',
  'kitchen/S101/S192/wall',
  'commonarea/S201/2/corridor',
  'bedroom/S101/S193/wall',
  'other/building/2/undefined'
];

const descriptions = [
  'Fix crack inside house',
  'Found crack in s201',
  'Found crack in kitchen',
  'Found crack in my bedroom',
  'Found crack in s101',
  'Crack in s1007',
  'Kitchen wall damage',
  'Corridor crack inspection',
  'Bedroom wall repair needed',
  'Building structure inspection'
];

async function main() {
  console.log('Start seeding cracks...');

  const cracks = [];
  
  // Create 10 cracks with different positions and descriptions
  for (let i = 0; i < 10; i++) {
    const crack = {
      status: 'Completed',
      reportedBy: 'e38bdc9c-62c5-456c-a76a-051f899da318',
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      crackReportId: newCrackIds[i],
      description: descriptions[i],
      verifiedBy: '0b802cbb-e058-4426-a302-24d5f37f6dcd',
      isPrivatesAsset: i % 2 === 0 ? false : true,
      position: positions[i],
      buildingDetailId: i < 5 ? '193a6294-89c1-4126-a571-28c0d7c32fba' : 'e01df9d0-2709-4ec5-b47d-d3ab506f1be4'
    };

    cracks.push(crack);
  }

  // Sort cracks by createdAt
  cracks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Create cracks in database
  for (const crack of cracks) {
    const createdCrack = await prisma.crackReport.create({
      data: crack
    });
    console.log(`Created crack with ID: ${createdCrack.crackReportId}`);
  }

  console.log('✅ Seeding completed');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }); 