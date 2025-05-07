import { PrismaClient } from '@prisma/client-Task'
import { config } from 'dotenv';
import { join } from 'path';

// Load environment from root .env file
config({ path: join(__dirname, '../../../.env') });

const prisma = new PrismaClient()

const taskIds = [
  '0ec98a60-c65d-4270-ba21-b14533a92dce',
  'cf54bab6-ff3f-4512-b3b9-c3632200ca55',
  '82457403-5a33-40fc-8ecb-9aab954bf335',
  'f333a91d-b216-4565-bcfa-44b5d7994ae5',
  '9464bd9d-23c9-49fb-86e3-126b5cc26ca3',
  '98311964-36fd-4bdd-a93a-d6e149ee7688',
  '28007b84-69c6-4053-a4f7-06ef925582bb',
  'f5524dfa-197e-497d-b5ef-12edb6750d57',
  '6a863cc0-8ec6-4100-abbf-e1728c5fde7a',
  '30b8fb6e-85d1-4cb6-9dba-d2f823701dc8'
];

const comments = [
  'Nhân viên làm việc rất chuyên nghiệp và tận tâm. Thời gian xử lý nhanh chóng, chất lượng công việc tốt!',
  'Rất hài lòng với dịch vụ sửa chữa. Nhân viên thân thiện và giải thích chi tiết về vấn đề cần sửa chữa.',
  'Đội ngũ kỹ thuật làm việc nhanh nhẹn và hiệu quả. Vết nứt được xử lý hoàn hảo.',
  'Thời gian đáp ứng nhanh, nhân viên nhiệt tình và có trách nhiệm. Chất lượng công việc rất tốt!',
  'Ấn tượng với tốc độ xử lý và thái độ chuyên nghiệp của nhân viên. Sẽ tiếp tục sử dụng dịch vụ.',
  'Nhân viên rất tận tâm và chu đáo, giải quyết vấn đề nhanh chóng và hiệu quả.',
  'Dịch vụ sửa chữa chuyên nghiệp, nhân viên làm việc cẩn thận và tỉ mỉ.',
  'Rất hài lòng với kết quả sửa chữa. Nhân viên làm việc nhanh và gọn gàng.',
  'Thái độ phục vụ chuyên nghiệp, thời gian xử lý nhanh, kết quả công việc tốt.',
  'Đội ngũ nhân viên nhiệt tình, thân thiện. Công việc được hoàn thành nhanh chóng và đạt chất lượng.'
];

async function main() {
  console.log('Start seeding feedbacks...');

  const feedbacks = [];
  
  // Create feedback for each task
  for (let i = 0; i < taskIds.length; i++) {
    const feedback = {
      task_id: taskIds[i],
      feedback_by: 'e38bdc9c-62c5-456c-a76a-051f899da318',
      comments: comments[i],
      rating: Math.floor(Math.random() * 3) + 3, // Random rating from 3 to 5
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      updated_at: new Date(),
      status: 'ACTIVE'
    };

    feedbacks.push(feedback);
  }

  // Sort feedbacks by created_at
  feedbacks.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

  // Create feedbacks in database
  for (const feedback of feedbacks) {
    const createdFeedback = await prisma.feedback.create({
      data: feedback
    });
    console.log(`Created feedback for task ${createdFeedback.task_id} with rating ${createdFeedback.rating}`);
  }

  console.log('✅ Seeding feedbacks completed');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }); 