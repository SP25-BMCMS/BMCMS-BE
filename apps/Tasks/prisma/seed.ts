import { PrismaClient } from '@prisma/client-Task'

const prisma = new PrismaClient()

async function main() {
  const materials = [
    {
      name: "Wall plastering mortar",
      description: "Used to patch small cracks or hairline cracks on concrete or brick walls.",
      unit_price: 50000.00,
      stock_quantity: 100
    },
    {
      name: "Wall putty powder",
      description: "Fine powder used before painting to smooth wall surfaces.",
      unit_price: 45000.00,
      stock_quantity: 80
    },
    {
      name: "Waterproof paint",
      description: "Used for areas frequently exposed to water such as exterior walls, bathrooms.",
      unit_price: 120000.00,
      stock_quantity: 60
    },
    {
      name: "Moisture-resistant MDF board",
      description: "Engineered MDF wood used for doors, partitions, with moisture resistance capabilities.",
      unit_price: 250000.00,
      stock_quantity: 30
    },
    {
      name: "Stainless steel door hinges",
      description: "Accessories used for installing wooden and metal doors in apartments.",
      unit_price: 20000.00,
      stock_quantity: 200
    },
    {
      name: "Elevator cable",
      description: "Steel cable used to pull elevator cabins.",
      unit_price: 500000.00,
      stock_quantity: 10
    },
    {
      name: "Silicone sealant",
      description: "Sealant used to fill gaps between walls, glass, wood, or in humid areas.",
      unit_price: 35000.00,
      stock_quantity: 150
    },
    {
      name: "Elevator door sensor",
      description: "Sensor device for automatic elevator door opening and closing.",
      unit_price: 900000.00,
      stock_quantity: 5
    },
    {
      name: "Wooden door handle",
      description: "Stainless steel or alloy door handles for wooden doors.",
      unit_price: 75000.00,
      stock_quantity: 50
    },
    {
      name: "Water-resistant gypsum board",
      description: "Board used for ceilings or partitions with water resistance, commonly used in bathrooms.",
      unit_price: 180000.00,
      stock_quantity: 40
    },
    {
      name: "PPR water pipe",
      description: "Heat and pressure resistant plastic pipes used in apartment building water supply systems.",
      unit_price: 65000.00,
      stock_quantity: 120
    },
    {
      name: "Motion sensor light switch",
      description: "Automatic light control device based on movement, used in hallways or bathrooms.",
      unit_price: 220000.00,
      stock_quantity: 30
    },
    {
      name: "Epoxy floor paint",
      description: "Specialized floor paint to create a hard, easy-to-clean, and non-slip surface.",
      unit_price: 180000.00,
      stock_quantity: 40
    },
    {
      name: "Self-drilling screws",
      description: "Quick and convenient installation accessories for gypsum boards, wood, or metal.",
      unit_price: 150.00,
      stock_quantity: 10000
    },
    {
      name: "Aluminum profile strip",
      description: "Aluminum strips for door frames, ceiling frames, or interior decoration.",
      unit_price: 75000.00,
      stock_quantity: 70
    },
    {
      name: "PE foam soundproofing panel",
      description: "Noise reduction material used for partitions between apartments.",
      unit_price: 55000.00,
      stock_quantity: 90
    },
    {
      name: "Magnetic door lock",
      description: "Modern locking device using key cards or passcodes, typically installed on main doors.",
      unit_price: 1500000.00,
      stock_quantity: 15
    },
    {
      name: "Elevator control circuit board",
      description: "Central control device for elevator operation.",
      unit_price: 3200000.00,
      stock_quantity: 3
    },
    {
      name: "Stainless steel stair handrail",
      description: "Safety handrail for apartment building staircases, made of rust-resistant stainless steel.",
      unit_price: 130000.00,
      stock_quantity: 25
    },
    {
      name: "Ceramic tiles",
      description: "Durable, non-slip tiles used for flooring or wall tiling in bathrooms and kitchens.",
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