// import { PrismaClient } from '@prisma/client-Task'

// const prisma = new PrismaClient()

// async function main() {
//   // Delete all existing data in correct order
//   // console.log('🗑️  Deleting existing data...')

//   // // First delete from RepairMaterial (child table)
//   // await prisma.repairMaterial.deleteMany()
//   // console.log('✅ Existing repair materials deleted successfully!')

//   // // Then delete from Material (parent table)
//   // await prisma.material.deleteMany()
//   // console.log('✅ Existing materials deleted successfully!')

//   const materials = [
//     {
//       name: "Vữa trát tường",
//       description: "Dùng để trám các vết nứt nhỏ hoặc vết nứt tóc trên tường bê tông hoặc gạch",
//       unit_price: 50000.00,
//       stock_quantity: 1000
//     },
//     {
//       name: "Bột bả tường",
//       description: "Bột mịn dùng trước khi sơn để làm phẳng bề mặt tường",
//       unit_price: 45000.00,
//       stock_quantity: 1000
//     },
//     {
//       name: "Sơn chống thấm",
//       description: "Dùng cho các khu vực thường xuyên tiếp xúc với nước như tường ngoài, phòng tắm",
//       unit_price: 120000.00,
//       stock_quantity: 800
//     },
//     {
//       name: "Ván MDF chống ẩm",
//       description: "Ván gỗ công nghiệp dùng cho cửa, vách ngăn, có khả năng chống ẩm",
//       unit_price: 250000.00,
//       stock_quantity: 500
//     },
//     {
//       name: "Bản lề cửa inox",
//       description: "Phụ kiện dùng để lắp đặt cửa gỗ và cửa kim loại trong căn hộ",
//       unit_price: 20000.00,
//       stock_quantity: 2000
//     },
//     {
//       name: "Cáp thang máy",
//       description: "Cáp thép dùng để kéo cabin thang máy",
//       unit_price: 500000.00,
//       stock_quantity: 200
//     },
//     {
//       name: "Keo silicon",
//       description: "Keo dùng để trám các khe hở giữa tường, kính, gỗ hoặc trong khu vực ẩm ướt",
//       unit_price: 35000.00,
//       stock_quantity: 1500
//     },
//     {
//       name: "Cảm biến cửa thang máy",
//       description: "Thiết bị cảm biến để đóng mở cửa thang máy tự động",
//       unit_price: 900000.00,
//       stock_quantity: 100
//     },
//     {
//       name: "Tay nắm cửa gỗ",
//       description: "Tay nắm cửa gỗ bằng inox hoặc hợp kim",
//       unit_price: 75000.00,
//       stock_quantity: 1000
//     },
//     {
//       name: "Tấm thạch cao chống ẩm",
//       description: "Tấm dùng cho trần hoặc vách ngăn có khả năng chống ẩm, thường dùng trong phòng tắm",
//       unit_price: 180000.00,
//       stock_quantity: 800
//     },
//     {
//       name: "Ống nước PPR",
//       description: "Ống nhựa chịu nhiệt và áp lực dùng trong hệ thống cấp nước của tòa nhà",
//       unit_price: 65000.00,
//       stock_quantity: 1500
//     },
//     {
//       name: "Công tắc đèn cảm biến",
//       description: "Thiết bị điều khiển đèn tự động dựa trên chuyển động, dùng cho hành lang hoặc phòng tắm",
//       unit_price: 220000.00,
//       stock_quantity: 500
//     },
//     {
//       name: "Sơn sàn epoxy",
//       description: "Sơn sàn chuyên dụng tạo bề mặt cứng, dễ vệ sinh và chống trơn trượt",
//       unit_price: 180000.00,
//       stock_quantity: 800
//     },
//     {
//       name: "Vít tự khoan",
//       description: "Phụ kiện lắp đặt nhanh chóng và tiện lợi cho tấm thạch cao, gỗ hoặc kim loại",
//       unit_price: 150.00,
//       stock_quantity: 100000
//     },
//     {
//       name: "Thanh nhôm định hình",
//       description: "Thanh nhôm dùng cho khung cửa, khung trần hoặc trang trí nội thất",
//       unit_price: 75000.00,
//       stock_quantity: 1000
//     },
//     {
//       name: "Tấm cách âm PE foam",
//       description: "Vật liệu giảm tiếng ồn dùng cho vách ngăn giữa các căn hộ",
//       unit_price: 55000.00,
//       stock_quantity: 1000
//     },
//     {
//       name: "Khóa cửa từ",
//       description: "Thiết bị khóa hiện đại sử dụng thẻ từ hoặc mã số, thường lắp đặt ở cửa chính",
//       unit_price: 1500000.00,
//       stock_quantity: 200
//     },
//     {
//       name: "Bảng mạch điều khiển thang máy",
//       description: "Thiết bị điều khiển trung tâm cho hoạt động của thang máy",
//       unit_price: 3200000.00,
//       stock_quantity: 50
//     },
//     {
//       name: "Tay vịn cầu thang inox",
//       description: "Tay vịn an toàn cho cầu thang tòa nhà, làm bằng inox chống gỉ",
//       unit_price: 130000.00,
//       stock_quantity: 500
//     },
//     {
//       name: "Gạch ceramic",
//       description: "Gạch bền, chống trơn trượt dùng cho sàn hoặc ốp tường trong phòng tắm và nhà bếp",
//       unit_price: 110000.00,
//       stock_quantity: 2000
//     }
//   ]

//   for (const material of materials) {
//     await prisma.material.create({ data: material })
//   }

//   console.log("🌱 Seeded materials successfully!")
// }

// main()
//   .catch((e) => {
//     console.error(e)
//     process.exit(1)
//   })
//   .finally(async () => {
//     await prisma.$disconnect()
//   }) 
import { PrismaClient } from '@prisma/client-Task'
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment from root .env file
config({ path: join(__dirname, '../../../.env') });

const prisma = new PrismaClient()

// Using the crack IDs that were generated from crack seeding
const crackIds = [
  '82cc5ac6-1ade-47c7-91e1-fad0a2447a55',
  '1e990b71-3079-4e44-97d8-b0b3a9db3775',
  '3cc61d16-187b-4586-bb06-e997196e31dd',
  'c22df2f6-50ed-47a0-a2de-f5de4dac2deb',
  'aa002817-5058-4580-be54-79909fd7c09a',
  '2d89fa25-ffed-4b78-a48d-f20ffbdde95a',
  '3e862d86-cb94-473d-b5d7-88e470036885',
  '939aa0d2-03b2-4f62-8412-28021267ce75',
  '4cd9197c-8157-473b-9b67-54bf3bc83d0c',
  'c53ef79c-90e7-47dd-9939-3f81bb375f23'
];

const locations = [
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

const buildings = {
  'S101': '193a6294-89c1-4126-a571-28c0d7c32fba',
  'S201': 'e01df9d0-2709-4ec5-b47d-d3ab506f1be4'
};

const employees = [
  '89c7d8d0-79c4-409d-ad7e-12e24d2abcc5',
  'ee994c00-66d3-451c-b3f3-d19b3867267c',
  '7ac21d9a-bada-4253-9b8d-c8242f538da8'
];

async function main() {
  console.log('Start seeding tasks and assignments...');

  const tasks = [];
  const taskAssignments = [];
  
  // Create 10 tasks with corresponding assignments
  for (let i = 0; i < 10; i++) {
    const taskId = uuidv4();
    const building = locations[i].split('/')[2]?.startsWith('S') ? locations[i].split('/')[2].split('.')[0] : 'S101';
    
    const task = {
      task_id: taskId,
      description: `Nhiệm vụ kiểm tra và sửa chữa vết nứt. Chi tiết vị trí: ${locations[i]} - Tòa nhà: ${building}. Ngày báo cáo: ${new Date().toLocaleDateString('en-GB')}`,
      status: 'Completed',
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      updated_at: new Date(),
      crack_id: crackIds[i],
      schedule_job_id: '',
      title: `Sửa chữa vết nứt tại ${locations[i]}`
    };

    const assignment = {
      assignment_id: uuidv4(),
      task_id: taskId,
      employee_id: employees[i % employees.length],
      description: `Phân công xử lý báo cáo vết nứt tại ${locations[i]}`,
      status: 'Confirmed',
      created_at: new Date(task.created_at.getTime() + 1000), // 1 second after task creation
      updated_at: new Date()
    };

    tasks.push(task);
    taskAssignments.push(assignment);
  }

  // Sort by created_at
  tasks.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  taskAssignments.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

  // Create tasks in database
  for (const task of tasks) {
    const createdTask = await prisma.task.create({
      data: task
    });
    console.log(`Created task with ID: ${createdTask.task_id}`);
  }

  // Create task assignments in database
  for (const assignment of taskAssignments) {
    const createdAssignment = await prisma.taskAssignment.create({
      data: assignment
    });
    console.log(`Created task assignment with ID: ${createdAssignment.assignment_id}`);
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