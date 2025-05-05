import { PrismaClient } from '@prisma/client-Task'

const prisma = new PrismaClient()

async function main() {
  // Delete all existing data in correct order
  console.log('🗑️  Deleting existing data...')

  // First delete from RepairMaterial (child table)
  await prisma.repairMaterial.deleteMany()
  console.log('✅ Existing repair materials deleted successfully!')

  // Then delete from Material (parent table)
  await prisma.material.deleteMany()
  console.log('✅ Existing materials deleted successfully!')

  const materials = [
    {
      name: "Vữa trát tường",
      description: "Dùng để trám các vết nứt nhỏ hoặc vết nứt tóc trên tường bê tông hoặc gạch",
      unit_price: 50000.00,
      stock_quantity: 1000
    },
    {
      name: "Bột bả tường",
      description: "Bột mịn dùng trước khi sơn để làm phẳng bề mặt tường",
      unit_price: 45000.00,
      stock_quantity: 1000
    },
    {
      name: "Sơn chống thấm",
      description: "Dùng cho các khu vực thường xuyên tiếp xúc với nước như tường ngoài, phòng tắm",
      unit_price: 120000.00,
      stock_quantity: 800
    },
    {
      name: "Ván MDF chống ẩm",
      description: "Ván gỗ công nghiệp dùng cho cửa, vách ngăn, có khả năng chống ẩm",
      unit_price: 250000.00,
      stock_quantity: 500
    },
    {
      name: "Bản lề cửa inox",
      description: "Phụ kiện dùng để lắp đặt cửa gỗ và cửa kim loại trong căn hộ",
      unit_price: 20000.00,
      stock_quantity: 2000
    },
    {
      name: "Cáp thang máy",
      description: "Cáp thép dùng để kéo cabin thang máy",
      unit_price: 500000.00,
      stock_quantity: 200
    },
    {
      name: "Keo silicon",
      description: "Keo dùng để trám các khe hở giữa tường, kính, gỗ hoặc trong khu vực ẩm ướt",
      unit_price: 35000.00,
      stock_quantity: 1500
    },
    {
      name: "Cảm biến cửa thang máy",
      description: "Thiết bị cảm biến để đóng mở cửa thang máy tự động",
      unit_price: 900000.00,
      stock_quantity: 100
    },
    {
      name: "Tay nắm cửa gỗ",
      description: "Tay nắm cửa gỗ bằng inox hoặc hợp kim",
      unit_price: 75000.00,
      stock_quantity: 1000
    },
    {
      name: "Tấm thạch cao chống ẩm",
      description: "Tấm dùng cho trần hoặc vách ngăn có khả năng chống ẩm, thường dùng trong phòng tắm",
      unit_price: 180000.00,
      stock_quantity: 800
    },
    {
      name: "Ống nước PPR",
      description: "Ống nhựa chịu nhiệt và áp lực dùng trong hệ thống cấp nước của tòa nhà",
      unit_price: 65000.00,
      stock_quantity: 1500
    },
    {
      name: "Công tắc đèn cảm biến",
      description: "Thiết bị điều khiển đèn tự động dựa trên chuyển động, dùng cho hành lang hoặc phòng tắm",
      unit_price: 220000.00,
      stock_quantity: 500
    },
    {
      name: "Sơn sàn epoxy",
      description: "Sơn sàn chuyên dụng tạo bề mặt cứng, dễ vệ sinh và chống trơn trượt",
      unit_price: 180000.00,
      stock_quantity: 800
    },
    {
      name: "Vít tự khoan",
      description: "Phụ kiện lắp đặt nhanh chóng và tiện lợi cho tấm thạch cao, gỗ hoặc kim loại",
      unit_price: 150.00,
      stock_quantity: 100000
    },
    {
      name: "Thanh nhôm định hình",
      description: "Thanh nhôm dùng cho khung cửa, khung trần hoặc trang trí nội thất",
      unit_price: 75000.00,
      stock_quantity: 1000
    },
    {
      name: "Tấm cách âm PE foam",
      description: "Vật liệu giảm tiếng ồn dùng cho vách ngăn giữa các căn hộ",
      unit_price: 55000.00,
      stock_quantity: 1000
    },
    {
      name: "Khóa cửa từ",
      description: "Thiết bị khóa hiện đại sử dụng thẻ từ hoặc mã số, thường lắp đặt ở cửa chính",
      unit_price: 1500000.00,
      stock_quantity: 200
    },
    {
      name: "Bảng mạch điều khiển thang máy",
      description: "Thiết bị điều khiển trung tâm cho hoạt động của thang máy",
      unit_price: 3200000.00,
      stock_quantity: 50
    },
    {
      name: "Tay vịn cầu thang inox",
      description: "Tay vịn an toàn cho cầu thang tòa nhà, làm bằng inox chống gỉ",
      unit_price: 130000.00,
      stock_quantity: 500
    },
    {
      name: "Gạch ceramic",
      description: "Gạch bền, chống trơn trượt dùng cho sàn hoặc ốp tường trong phòng tắm và nhà bếp",
      unit_price: 110000.00,
      stock_quantity: 2000
    }
  ]

  for (const material of materials) {
    await prisma.material.create({ data: material })
  }

  console.log("🌱 Seeded materials successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 