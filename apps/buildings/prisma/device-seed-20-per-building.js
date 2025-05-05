// Script để thêm thiết bị vào mỗi tòa nhà để đạt đủ 20 thiết bị mỗi tòa
const { PrismaClient } = require('@prisma/client-building');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
    // Danh sách loại thiết bị theo enum DeviceType
    const deviceTypes = [
        'Elevator',
        'HVAC',
        'Plumbing',
        'Electrical',
        'FireProtection',
        'FireExtinguisher',
        'CCTV',
        'AutomaticDoor',
        'Generator',
        'Lighting',
        'Other'
    ];

    // Map để hiển thị nhãn tiếng Việt (chỉ để đặt tên, không lưu vào DB)
    const deviceTypeLabels = {
        'Elevator': 'Thang máy',
        'HVAC': 'Điều hòa thông gió',
        'Plumbing': 'Cấp thoát nước',
        'Electrical': 'Điện',
        'FireProtection': 'Phòng cháy chữa cháy',
        'FireExtinguisher': 'Bình chữa cháy',
        'CCTV': 'Camera giám sát',
        'AutomaticDoor': 'Cửa tự động',
        'Generator': 'Máy phát điện',
        'Lighting': 'Chiếu sáng',
        'Other': 'Khác'
    };

    // Danh sách nhà sản xuất và mẫu thiết bị theo loại
    const manufacturersAndModels = {
        'Elevator': [
            { manufacturer: 'Sigma', model: 'IRIS' },
            { manufacturer: 'Toshiba', model: 'SPACEL-UNI' },
            { manufacturer: 'Hyundai', model: 'LUXEN' },
            { manufacturer: 'Fujitec', model: 'GLVF-II' },
            { manufacturer: 'ThyssenKrupp', model: 'Evolution' },
            { manufacturer: 'Schindler', model: 'SV-6000' },
            { manufacturer: 'KONE', model: 'MonoSpace 700' },
            { manufacturer: 'Mitsubishi', model: 'NexWay' },
            { manufacturer: 'Otis', model: 'GeN2-MR' }
        ],
        'HVAC': [
            { manufacturer: 'Mitsubishi', model: 'VRF System' },
            { manufacturer: 'Gree', model: 'GMV6' },
            { manufacturer: 'LG', model: 'Multi V 5' },
            { manufacturer: 'Hitachi', model: 'Set-Free' },
            { manufacturer: 'Mitsubishi Electric', model: 'City Multi' },
            { manufacturer: 'Daikin', model: 'VRV IV' },
            { manufacturer: 'York', model: 'YZ Magnetic Bearing Centrifugal' },
            { manufacturer: 'Trane', model: 'Series R' },
            { manufacturer: 'Carrier', model: 'AquaEdge 19DV' },
            { manufacturer: 'Daikin', model: 'VRV-X Series' }
        ],
        'Plumbing': [
            { manufacturer: 'Tyco', model: 'LFII Residential' },
            { manufacturer: 'Wilo', model: 'Stratos GIGA' },
            { manufacturer: 'Pentair', model: 'Commercial Grade' },
            { manufacturer: 'Grundfos', model: 'CR-95-2' },
            { manufacturer: 'Xylem', model: 'Flygt Concertor' },
            { manufacturer: 'Goulds', model: 'e-SV Series' }
        ],
        'Electrical': [
            { manufacturer: 'Schneider Electric', model: 'Prisma Plus' },
            { manufacturer: 'ABB', model: 'Power Distribution Panel XL' },
            { manufacturer: 'Siemens', model: 'SIVACON S8' },
            { manufacturer: 'Eaton', model: 'PowerXpert 9395P UPS' },
            { manufacturer: 'GE', model: 'TLE Series UPS' }
        ],
        'FireProtection': [
            { manufacturer: 'Siemens', model: 'Cerberus PRO' },
            { manufacturer: 'Johnson Controls', model: 'FireClass Series' },
            { manufacturer: 'Honeywell', model: 'VESDA-E VEP' },
            { manufacturer: 'Fike', model: 'ECARO-25' },
            { manufacturer: 'Viking', model: 'VK5022' }
        ],
        'FireExtinguisher': [
            { manufacturer: 'Kidde', model: 'FM-200 Clean Agent' },
            { manufacturer: 'Amerex', model: 'B456 ABC Dry Chemical' },
            { manufacturer: 'Ansul', model: 'CLEANGUARD' },
            { manufacturer: 'Buckeye', model: 'Halotron I' }
        ],
        'CCTV': [
            { manufacturer: 'Bosch', model: 'B Series' },
            { manufacturer: 'HID Global', model: 'iCLASS SE' },
            { manufacturer: 'Hikvision', model: 'DS-7716NI-K4' },
            { manufacturer: 'Axis', model: 'P3225-LV' },
            { manufacturer: 'Hanwha Techwin', model: 'QNV-8080R' }
        ],
        'AutomaticDoor': [
            { manufacturer: 'ASSA ABLOY', model: 'Besam SL500' },
            { manufacturer: 'FAAC', model: '640 Barrier' },
            { manufacturer: 'Dorma', model: 'ES200' },
            { manufacturer: 'Stanley', model: 'Dura-Glide 2000' }
        ],
        'Generator': [
            { manufacturer: 'Cummins', model: 'QSX15-G9' },
            { manufacturer: 'Caterpillar', model: 'C15 ACERT' },
            { manufacturer: 'Generac', model: 'SG130' },
            { manufacturer: 'MTU', model: '16V2000 DS1000' }
        ],
        'Lighting': [
            { manufacturer: 'Philips', model: 'LED SmartControl' },
            { manufacturer: 'Eaton', model: 'Safety Series' },
            { manufacturer: 'Osram', model: 'Lightify Pro' },
            { manufacturer: 'Acuity Brands', model: 'Lithonia' }
        ],
        'Other': [
            { manufacturer: 'Rain Bird', model: 'ESP-LXME Controller' },
            { manufacturer: 'SunPower', model: 'Maxeon 5 AC' },
            { manufacturer: 'LiftMaster', model: 'CAPXL Smart Control' },
            { manufacturer: 'Lenel', model: 'OnGuard Access Control' },
            { manufacturer: 'Lutron', model: 'Quantum Total Light Management' }
        ]
    };

    // Danh sách contracts
    const contracts = [
        'c89153e6-c706-4b14-b5d5-c98ee774be8a', // Elevator
        '54e7f1a2-10e1-4eac-bb50-0966a3cf8d98', // HVAC
        'fc6f3491-b7c0-42e2-80b2-43a5ab016bc5', // Plumbing
        '7d0850e9-5464-41c6-b739-601df65c772a', // Electrical
        '3df0083b-82fe-49d2-bffd-7a752d03bac2', // FireProtection
        '8ad7bb7f-e55c-4eab-abcb-c371813e984f', // FireExtinguisher
        'c4a105a9-ea96-4a6b-8d9e-d5005b37a1c8', // CCTV
        '9018c99b-01bc-4ecd-acb7-fa25f960a73f', // AutomaticDoor
        '9b635646-98b0-414f-aa8d-ab2bd8b2b615', // Generator
        '48427150-ba1e-4b0d-a206-d595bdaea444', // Lighting
        '7acab0d8-b872-4dac-abe5-448d73891a1e'  // Other
    ];

    // Chọn contract ID dựa trên loại thiết bị
    function getContractIdByType(type) {
        switch (type) {
            case 'Elevator': return contracts[0];
            case 'HVAC': return contracts[1];
            case 'Plumbing': return contracts[2];
            case 'Electrical': return contracts[3];
            case 'FireProtection': return contracts[4];
            case 'FireExtinguisher': return contracts[5];
            case 'CCTV': return contracts[6];
            case 'AutomaticDoor': return contracts[7];
            case 'Generator': return contracts[8];
            case 'Lighting': return contracts[9];
            case 'Other': return contracts[10];
            default: return contracts[0];
        }
    }

    // Lấy danh sách tất cả buildingDetail kèm theo số lượng thiết bị hiện tại
    const buildingDetails = await prisma.$queryRaw`
    SELECT bd."buildingDetailId", bd."name", COUNT(d."device_id") as device_count
    FROM "BuildingDetail" bd
    LEFT JOIN "Device" d ON bd."buildingDetailId" = d."buildingDetailId"
    GROUP BY bd."buildingDetailId", bd."name"
    ORDER BY bd."name"
  `;

    console.log(`Tìm thấy ${buildingDetails.length} buildingDetails để xử lý.`);

    // Xử lý từng buildingDetail và thêm thiết bị nếu cần
    for (const bd of buildingDetails) {
        const currentDeviceCount = parseInt(bd.device_count);
        const neededDevices = 20 - currentDeviceCount;

        console.log(`Tòa nhà ${bd.name} hiện có ${currentDeviceCount} thiết bị, cần thêm ${neededDevices} thiết bị.`);

        if (neededDevices <= 0) {
            console.log(`Tòa nhà ${bd.name} đã có đủ thiết bị.`);
            continue;
        }

        // Danh sách các thiết bị mới cần thêm
        const newDevices = [];

        // Tạo thiết bị mới cho từng buildingDetail
        for (let i = 0; i < neededDevices; i++) {
            // Chọn loại thiết bị ngẫu nhiên, bỏ qua 2 loại đầu tiên (đã có sẵn trong hầu hết các tòa)
            const randomTypeIndex = 2 + Math.floor(Math.random() * (deviceTypes.length - 2));
            const deviceType = deviceTypes[randomTypeIndex];

            // Chọn nhà sản xuất và mẫu ngẫu nhiên cho loại thiết bị
            const manufacturerOptions = manufacturersAndModels[deviceType];
            const randomManufacturerIndex = Math.floor(Math.random() * manufacturerOptions.length);
            const { manufacturer, model } = manufacturerOptions[randomManufacturerIndex];

            // Tạo tên thiết bị
            const deviceName = `${deviceTypeLabels[deviceType]} ${i + 3} - ${bd.name}`;

            // Thêm thiết bị mới vào danh sách
            newDevices.push({
                device_id: uuidv4(),
                name: deviceName,
                type: deviceType,
                manufacturer: manufacturer,
                model: model,
                buildingDetailId: bd.buildingDetailId,
                contract_id: getContractIdByType(deviceType)
            });
        }

        // Thêm các thiết bị mới vào cơ sở dữ liệu
        try {
            await prisma.device.createMany({
                data: newDevices
            });
            console.log(`Đã thêm ${newDevices.length} thiết bị mới vào tòa ${bd.name}.`);
        } catch (error) {
            console.error(`Lỗi khi thêm thiết bị vào tòa ${bd.name}:`, error);
        }
    }

    console.log('Hoàn tất việc thêm thiết bị.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 