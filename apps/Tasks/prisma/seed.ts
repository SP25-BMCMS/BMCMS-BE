import { PrismaClient } from '@prisma/client-Task'

const prisma = new PrismaClient()

async function main() {
  const materials = [
    {
      name: "Vữa trét tường",
      description: "Dùng để vá các vết nứt nhỏ, nứt chân chim trên tường bê tông hoặc tường gạch.",
      unit_price: 50000.00,
      stock_quantity: 100
    },
    {
      name: "Bột bả tường",
      description: "Bột mịn dùng trước khi sơn để làm phẳng bề mặt tường.",
      unit_price: 45000.00,
      stock_quantity: 80
    },
    {
      name: "Sơn chống thấm",
      description: "Dùng cho các vị trí thường xuyên tiếp xúc với nước như tường ngoài, nhà vệ sinh.",
      unit_price: 120000.00,
      stock_quantity: 60
    },
    {
      name: "Thanh gỗ MDF chống ẩm",
      description: "Gỗ công nghiệp MDF dùng cho cửa, vách ngăn, có khả năng chống ẩm.",
      unit_price: 250000.00,
      stock_quantity: 30
    },
    {
      name: "Bản lề cửa inox",
      description: "Phụ kiện dùng để lắp cửa gỗ, cửa sắt trong căn hộ.",
      unit_price: 20000.00,
      stock_quantity: 200
    },
    {
      name: "Dây cáp thang máy",
      description: "Dây cáp thép dùng để kéo cabin thang máy.",
      unit_price: 500000.00,
      stock_quantity: 10
    },
    {
      name: "Keo trám silicon",
      description: "Keo dùng để trám kín khe hở giữa tường, kính, gỗ hoặc khu vực ẩm ướt.",
      unit_price: 35000.00,
      stock_quantity: 150
    },
    {
      name: "Cảm biến cửa thang máy",
      description: "Thiết bị cảm biến đóng mở cửa thang máy tự động.",
      unit_price: 900000.00,
      stock_quantity: 5
    },
    {
      name: "Tay nắm cửa gỗ",
      description: "Tay cầm cửa bằng inox hoặc hợp kim dùng cho cửa gỗ.",
      unit_price: 75000.00,
      stock_quantity: 50
    },
    {
      name: "Tấm thạch cao chịu nước",
      description: "Tấm dùng làm trần hoặc vách ngăn có khả năng chịu nước, thường dùng ở nhà tắm.",
      unit_price: 180000.00,
      stock_quantity: 40
    },
    {
      name: "Ống dẫn nước PPR",
      description: "Ống nhựa chịu nhiệt, chịu áp lực, dùng trong hệ thống cấp nước chung cư.",
      unit_price: 65000.00,
      stock_quantity: 120
    },
    {
      name: "Công tắc cảm ứng đèn",
      description: "Thiết bị điều khiển đèn tự động theo chuyển động, dùng ở hành lang hoặc WC.",
      unit_price: 220000.00,
      stock_quantity: 30
    },
    {
      name: "Sơn epoxy sàn",
      description: "Sơn chuyên dụng cho sàn nhà để tạo bề mặt cứng, dễ lau chùi và chống trơn trượt.",
      unit_price: 180000.00,
      stock_quantity: 40
    },
    {
      name: "Đinh vít tự khoan",
      description: "Phụ kiện lắp đặt nhanh, tiện lợi cho vách thạch cao, gỗ hoặc kim loại.",
      unit_price: 150.00,
      stock_quantity: 10000
    },
    {
      name: "Thanh nhôm định hình",
      description: "Thanh nhôm làm khung cửa, khung trần, hoặc trang trí nội thất.",
      unit_price: 75000.00,
      stock_quantity: 70
    },
    {
      name: "Tấm cách âm xốp PE",
      description: "Vật liệu giảm tiếng ồn, dùng cho vách ngăn giữa các căn hộ.",
      unit_price: 55000.00,
      stock_quantity: 90
    },
    {
      name: "Ổ khóa cửa từ",
      description: "Thiết bị khóa hiện đại dùng thẻ từ hoặc mã số, thường lắp ở cửa chính.",
      unit_price: 1500000.00,
      stock_quantity: 15
    },
    {
      name: "Bản mạch điều khiển thang máy",
      description: "Thiết bị trung tâm điều khiển vận hành thang máy.",
      unit_price: 3200000.00,
      stock_quantity: 3
    },
    {
      name: "Tay vịn cầu thang inox",
      description: "Tay vịn an toàn cho thang bộ chung cư, làm từ inox chống gỉ.",
      unit_price: 130000.00,
      stock_quantity: 25
    },
    {
      name: "Gạch ceramic ốp lát",
      description: "Gạch bền, chống trơn dùng để lát nền hoặc ốp tường nhà tắm, bếp.",
      unit_price: 110000.00,
      stock_quantity: 100
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