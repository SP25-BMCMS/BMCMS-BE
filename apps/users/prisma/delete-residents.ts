import { PrismaClient } from '@prisma/client-users';

const prisma = new PrismaClient();

async function main() {
  console.log('Start deleting extra residents...');

  // Delete residents from number 51 and above
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      AND: [
        { username: { startsWith: 'resident' } },
        {
          username: {
            gt: 'resident50' // This will match resident51 and above
          }
        }
      ]
    }
  });

  console.log(`✅ Deleted ${deletedUsers.count} residents`);
}

main()
  .catch((e) => console.error('❌ Delete error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  }); 