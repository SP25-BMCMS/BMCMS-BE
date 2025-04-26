import { PrismaClient } from '@prisma/client-building';

const prisma = new PrismaClient();

async function main() {
    // Clean up existing data to avoid unique constraint errors
    console.log('Cleaning up existing data...');
    await prisma.maintenanceHistory.deleteMany({});
    await prisma.technicalRecord.deleteMany({});
    await prisma.device.deleteMany({});
    await prisma.crackRecord.deleteMany({});
    await prisma.locationDetail.deleteMany({});
    await prisma.buildingDetail.deleteMany({});
    await prisma.building.deleteMany({});
    await prisma.area.deleteMany({});
    await prisma.contract.deleteMany({});

    console.log('Seeding areas...');
    // Seed Areas
    const rainbowArea = await prisma.area.create({
        data: {
            name: 'The Rainbow',
            description: 'Rainbow area consists of 17 buildings in 4 clusters: S1, S2, S3, S5'
        }
    });

    const origamiArea = await prisma.area.create({
        data: {
            name: 'The Origami',
            description: 'Origami area consists of 21 buildings in 5 clusters: S6, S7, S8, S9, S10'
        }
    });

    console.log('Seeding buildings...');
    // Seed Buildings in Rainbow Area - 17 tòa

    // Cluster S1 (6 tòa: S1.01, S1.02, S1.03, S1.05, S1.06, S1.07)
    const buildingS1 = await prisma.building.create({
        data: {
            name: 'S1',
            description: 'Building S1 - 6 towers - Rainbow Area',
            numberFloor: 25,
            imageCover: 'https://th.bing.com/th/id/OIP.x16cxXtPkaps_wRoVQvSVwHaHa?rs=1&pid=ImgDetMain',
            areaId: rainbowArea.areaId,
            Status: 'operational',
            construction_date: new Date('2018-01-01'),
            completion_date: new Date('2020-06-30'),
            Warranty_date: new Date('2025-06-30')
        }
    });

    // Cluster S2 (4 tòa: S2.01, S2.02, S2.03, S2.05)
    const buildingS2 = await prisma.building.create({
        data: {
            name: 'S2',
            description: 'Building S2 - 4 towers - Rainbow Area',
            numberFloor: 30,
            imageCover: 'https://th.bing.com/th/id/OIP.x16cxXtPkaps_wRoVQvSVwHaHa?rs=1&pid=ImgDetMain',
            areaId: rainbowArea.areaId,
            Status: 'operational',
            construction_date: new Date('2018-02-01'),
            completion_date: new Date('2020-09-15'),
            Warranty_date: new Date('2025-09-15')
        }
    });

    // Cluster S3 (4 tòa: S3.01, S3.02, S3.03, S3.05)
    const buildingS3 = await prisma.building.create({
        data: {
            name: 'S3',
            description: 'Building S3 - 4 towers - Rainbow Area',
            numberFloor: 28,
            imageCover: 'https://th.bing.com/th/id/OIP.x16cxXtPkaps_wRoVQvSVwHaHa?rs=1&pid=ImgDetMain',
            areaId: rainbowArea.areaId,
            Status: 'operational',
            construction_date: new Date('2018-03-15'),
            completion_date: new Date('2020-10-30'),
            Warranty_date: new Date('2025-10-30')
        }
    });

    // Cluster S5 (3 tòa: S5.01, S5.02, S5.03)
    const buildingS5 = await prisma.building.create({
        data: {
            name: 'S5',
            description: 'Building S5 - 3 towers - Rainbow Area',
            numberFloor: 22,
            imageCover: 'https://th.bing.com/th/id/OIP.x16cxXtPkaps_wRoVQvSVwHaHa?rs=1&pid=ImgDetMain',
            areaId: rainbowArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-01-10'),
            completion_date: new Date('2021-05-20'),
            Warranty_date: new Date('2026-05-20')
        }
    });

    // Seed Buildings in Origami Area - 21 tòa

    // Cluster S6 (5 tòa: S6.01, S6.02, S6.03, S6.05, S6.06)
    const buildingS6 = await prisma.building.create({
        data: {
            name: 'S6',
            description: 'Building S6 - 5 towers - Origami Area',
            numberFloor: 20,
            imageCover: 'https://www.vinhomeland.com.vn/wp-content/uploads/2020/04/the-origami-vinhomes-grand-park-48.jpg',
            areaId: origamiArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-05-01'),
            completion_date: new Date('2021-08-30'),
            Warranty_date: new Date('2026-08-30')
        }
    });

    // Cluster S7 (4 tòa: S7.01, S7.02, S7.03, S7.05)
    const buildingS7 = await prisma.building.create({
        data: {
            name: 'S7',
            description: 'Building S7 - 4 towers - Origami Area',
            numberFloor: 24,
            imageCover: 'https://www.vinhomeland.com.vn/wp-content/uploads/2020/04/the-origami-vinhomes-grand-park-48.jpg',
            areaId: origamiArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-06-15'),
            completion_date: new Date('2021-10-10'),
            Warranty_date: new Date('2026-10-10')
        }
    });

    // Cluster S8 (3 tòa: S8.01, S8.02, S8.03)
    const buildingS8 = await prisma.building.create({
        data: {
            name: 'S8',
            description: 'Building S8 - 3 towers - Origami Area',
            numberFloor: 23,
            imageCover: 'https://www.vinhomeland.com.vn/wp-content/uploads/2020/04/the-origami-vinhomes-grand-park-48.jpg',
            areaId: origamiArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-07-01'),
            completion_date: new Date('2021-11-01'),
            Warranty_date: new Date('2026-11-01')
        }
    });

    // Cluster S9 (3 tòa: S9.01, S9.02, S9.03)
    const buildingS9 = await prisma.building.create({
        data: {
            name: 'S9',
            description: 'Building S9 - 3 towers - Origami Area',
            numberFloor: 22,
            imageCover: 'https://www.vinhomeland.com.vn/wp-content/uploads/2020/04/the-origami-vinhomes-grand-park-48.jpg',
            areaId: origamiArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-07-15'),
            completion_date: new Date('2021-11-15'),
            Warranty_date: new Date('2026-11-15')
        }
    });

    // Cluster S10 (6 tòa: S10.01, S10.02, S10.03, S10.05, S10.06, S10.07)
    const buildingS10 = await prisma.building.create({
        data: {
            name: 'S10',
            description: 'Building S10 - 6 towers - Origami Area',
            numberFloor: 21,
            imageCover: 'https://www.vinhomeland.com.vn/wp-content/uploads/2020/04/the-origami-vinhomes-grand-park-48.jpg',
            areaId: origamiArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-08-01'),
            completion_date: new Date('2021-12-01'),
            Warranty_date: new Date('2026-12-01')
        }
    });


    console.log('Seeding building details...');
    // Seed BuildingDetails for Rainbow Area

    // Cluster S1 details
    const buildingDetailS101 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS1.buildingId,
            name: 'S101',
            total_apartments: 100
        }
    });

    const buildingDetailS102 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS1.buildingId,
            name: 'S102',
            total_apartments: 120
        }
    });

    const buildingDetailS103 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS1.buildingId,
            name: 'S103',
            total_apartments: 110
        }
    });

    const buildingDetailS105 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS1.buildingId,
            name: 'S105',
            total_apartments: 105
        }
    });

    const buildingDetailS106 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS1.buildingId,
            name: 'S106',
            total_apartments: 115
        }
    });

    const buildingDetailS107 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS1.buildingId,
            name: 'S107',
            total_apartments: 125
        }
    });

    // Cluster S2 details
    const buildingDetailS201 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS2.buildingId,
            name: 'S201',
            total_apartments: 150
        }
    });

    const buildingDetailS202 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS2.buildingId,
            name: 'S202',
            total_apartments: 140
        }
    });

    const buildingDetailS203 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS2.buildingId,
            name: 'S203',
            total_apartments: 130
        }
    });

    const buildingDetailS205 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS2.buildingId,
            name: 'S205',
            total_apartments: 145
        }
    });

    // Cluster S3 details
    const buildingDetailS301 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS3.buildingId,
            name: 'S301',
            total_apartments: 120
        }
    });

    const buildingDetailS302 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS3.buildingId,
            name: 'S302',
            total_apartments: 135
        }
    });

    const buildingDetailS303 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS3.buildingId,
            name: 'S303',
            total_apartments: 125
        }
    });

    const buildingDetailS305 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS3.buildingId,
            name: 'S305',
            total_apartments: 130
        }
    });

    // Cluster S5 details
    const buildingDetailS501 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS5.buildingId,
            name: 'S501',
            total_apartments: 90
        }
    });

    const buildingDetailS502 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS5.buildingId,
            name: 'S502',
            total_apartments: 95
        }
    });

    const buildingDetailS503 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS5.buildingId,
            name: 'S503',
            total_apartments: 100
        }
    });

    // Seed BuildingDetails for Origami Area

    // Cluster S6 details
    const buildingDetailS601 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS6.buildingId,
            name: 'S601',
            total_apartments: 80
        }
    });

    const buildingDetailS602 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS6.buildingId,
            name: 'S602',
            total_apartments: 85
        }
    });

    const buildingDetailS603 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS6.buildingId,
            name: 'S603',
            total_apartments: 90
        }
    });

    const buildingDetailS605 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS6.buildingId,
            name: 'S605',
            total_apartments: 95
        }
    });

    const buildingDetailS606 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS6.buildingId,
            name: 'S606',
            total_apartments: 100
        }
    });

    // Cluster S7 details
    const buildingDetailS701 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS7.buildingId,
            name: 'S701',
            total_apartments: 85
        }
    });

    const buildingDetailS702 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS7.buildingId,
            name: 'S702',
            total_apartments: 90
        }
    });

    const buildingDetailS703 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS7.buildingId,
            name: 'S703',
            total_apartments: 95
        }
    });

    const buildingDetailS705 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS7.buildingId,
            name: 'S705',
            total_apartments: 100
        }
    });

    // Cluster S8 details
    const buildingDetailS801 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS8.buildingId,
            name: 'S801',
            total_apartments: 95
        }
    });

    const buildingDetailS802 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS8.buildingId,
            name: 'S802',
            total_apartments: 90
        }
    });

    const buildingDetailS803 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS8.buildingId,
            name: 'S803',
            total_apartments: 85
        }
    });

    // Cluster S9 details
    const buildingDetailS901 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS9.buildingId,
            name: 'S901',
            total_apartments: 90
        }
    });

    const buildingDetailS902 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS9.buildingId,
            name: 'S902',
            total_apartments: 95
        }
    });

    const buildingDetailS903 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS9.buildingId,
            name: 'S903',
            total_apartments: 100
        }
    });

    // Cluster S10 details
    const buildingDetailS1001 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS10.buildingId,
            name: 'S1001',
            total_apartments: 85
        }
    });

    const buildingDetailS1002 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS10.buildingId,
            name: 'S1002',
            total_apartments: 90
        }
    });

    const buildingDetailS1003 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS10.buildingId,
            name: 'S1003',
            total_apartments: 95
        }
    });

    const buildingDetailS1005 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS10.buildingId,
            name: 'S1005',
            total_apartments: 80
        }
    });

    const buildingDetailS1006 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS10.buildingId,
            name: 'S1006',
            total_apartments: 85
        }
    });

    const buildingDetailS1007 = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS10.buildingId,
            name: 'S1007',
            total_apartments: 90
        }
    });

    console.log('Seeding contracts...');
    // Seed Contract for devices
    const elevatorContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-01-01'),
            end_date: new Date('2026-01-01'),
            vendor: 'Schindler Elevator Co.',
            file_name: 'schindler_contract.pdf'
        }
    });

    const hvacContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-03-15'),
            end_date: new Date('2026-03-15'),
            vendor: 'Daikin HVAC Solutions',
            file_name: 'daikin_contract.pdf'
        }
    });

    const electricalContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-05-10'),
            end_date: new Date('2026-05-10'),
            vendor: 'ABB Electrical Systems',
            file_name: 'abb_contract.pdf'
        }
    });

    const plumbingContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-07-20'),
            end_date: new Date('2026-07-20'),
            vendor: 'Modern Plumbing Solutions',
            file_name: 'plumbing_contract.pdf'
        }
    });

    const cctvContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-09-05'),
            end_date: new Date('2026-09-05'),
            vendor: 'Security Vision Inc.',
            file_name: 'cctv_contract.pdf'
        }
    });

    const fireProtectionContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-04-01'),
            end_date: new Date('2026-04-01'),
            vendor: 'Johnson Controls Fire Protection',
            file_name: 'johnson_fire_contract.pdf'
        }
    });

    const generatorContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-06-15'),
            end_date: new Date('2026-06-15'),
            vendor: 'Caterpillar Power Systems',
            file_name: 'caterpillar_contract.pdf'
        }
    });

    const lightingContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-08-01'),
            end_date: new Date('2026-08-01'),
            vendor: 'Signify Lighting (Philips)',
            file_name: 'signify_contract.pdf'
        }
    });

    const automaticDoorContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-10-10'),
            end_date: new Date('2026-10-10'),
            vendor: 'ASSA ABLOY Entrance Systems',
            file_name: 'assaabloy_contract.pdf'
        }
    });

    const fireExtinguisherContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-11-15'),
            end_date: new Date('2026-11-15'),
            vendor: 'Minimax Fire Protection',
            file_name: 'minimax_contract.pdf'
        }
    });

    // Additional contract for other type devices
    const otherEquipmentContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-12-01'),
            end_date: new Date('2026-12-01'),
            vendor: 'General Equipment Services',
            file_name: 'general_equipment_contract.pdf'
        }
    });

    console.log('Seeding devices...');
    // Seed Devices for Rainbow Area - S1 Cluster
    const elevator1S101 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S101',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const elevator2S101 = await prisma.device.create({
        data: {
            name: 'Elevator 2 - S101',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS101 = await prisma.device.create({
        data: {
            name: 'HVAC System - S101',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV-X Series',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const fireAlarmS101 = await prisma.device.create({
        data: {
            name: 'Fire Alarm System - S101',
            type: 'Electrical',
            manufacturer: 'Honeywell',
            model: 'Notifier NFS2-3030',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: electricalContract.contract_id
        }
    });

    const waterPumpS101 = await prisma.device.create({
        data: {
            name: 'Water Pump System - S101',
            type: 'Plumbing',
            manufacturer: 'Grundfos',
            model: 'CR-95-2',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: plumbingContract.contract_id
        }
    });

    const cctvS101 = await prisma.device.create({
        data: {
            name: 'CCTV System - S101',
            type: 'CCTV',
            manufacturer: 'Hikvision',
            model: 'DS-7716NI-K4',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: cctvContract.contract_id
        }
    });

    // Devices for S102
    const elevator1S102 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S102',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS102.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const elevator2S102 = await prisma.device.create({
        data: {
            name: 'Elevator 2 - S102',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS102.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS102 = await prisma.device.create({
        data: {
            name: 'HVAC System - S102',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV-X Series',
            buildingDetailId: buildingDetailS102.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const fireAlarmS102 = await prisma.device.create({
        data: {
            name: 'Fire Alarm System - S102',
            type: 'Electrical',
            manufacturer: 'Honeywell',
            model: 'Notifier NFS2-3030',
            buildingDetailId: buildingDetailS102.buildingDetailId,
            contract_id: electricalContract.contract_id
        }
    });

    // Devices for S201
    const elevator1S201 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S201',
            type: 'Elevator',
            manufacturer: 'Otis',
            model: 'GeN2-MR',
            buildingDetailId: buildingDetailS201.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const elevator2S201 = await prisma.device.create({
        data: {
            name: 'Elevator 2 - S201',
            type: 'Elevator',
            manufacturer: 'Otis',
            model: 'GeN2-MR',
            buildingDetailId: buildingDetailS201.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS201 = await prisma.device.create({
        data: {
            name: 'HVAC System - S201',
            type: 'HVAC',
            manufacturer: 'Carrier',
            model: 'AquaEdge 19DV',
            buildingDetailId: buildingDetailS201.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const electricalS201 = await prisma.device.create({
        data: {
            name: 'Main Electrical Panel - S201',
            type: 'Electrical',
            manufacturer: 'ABB',
            model: 'Power Distribution Panel XL',
            buildingDetailId: buildingDetailS201.buildingDetailId,
            contract_id: electricalContract.contract_id
        }
    });

    // Devices for S301
    const elevator1S301 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S301',
            type: 'Elevator',
            manufacturer: 'Mitsubishi',
            model: 'NexWay',
            buildingDetailId: buildingDetailS301.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS301 = await prisma.device.create({
        data: {
            name: 'HVAC System - S301',
            type: 'HVAC',
            manufacturer: 'Trane',
            model: 'Series R',
            buildingDetailId: buildingDetailS301.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const waterTankS301 = await prisma.device.create({
        data: {
            name: 'Water Storage Tank - S301',
            type: 'Plumbing',
            manufacturer: 'Pentair',
            model: 'Commercial Grade',
            buildingDetailId: buildingDetailS301.buildingDetailId,
            contract_id: plumbingContract.contract_id
        }
    });

    // Devices for S501
    const elevator1S501 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S501',
            type: 'Elevator',
            manufacturer: 'KONE',
            model: 'MonoSpace 700',
            buildingDetailId: buildingDetailS501.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS501 = await prisma.device.create({
        data: {
            name: 'HVAC System - S501',
            type: 'HVAC',
            manufacturer: 'York',
            model: 'YZ Magnetic Bearing Centrifugal',
            buildingDetailId: buildingDetailS501.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const generatorS501 = await prisma.device.create({
        data: {
            name: 'Backup Generator - S501',
            type: 'Electrical',
            manufacturer: 'Cummins',
            model: 'C150D6R',
            buildingDetailId: buildingDetailS501.buildingDetailId,
            contract_id: electricalContract.contract_id
        }
    });

    // Seed Devices for Origami Area
    // Devices for S601
    const elevator1S601 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S601',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-6000',
            buildingDetailId: buildingDetailS601.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const elevator2S601 = await prisma.device.create({
        data: {
            name: 'Elevator 2 - S601',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-6000',
            buildingDetailId: buildingDetailS601.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS601 = await prisma.device.create({
        data: {
            name: 'HVAC System - S601',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV IV',
            buildingDetailId: buildingDetailS601.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const securityGateS601 = await prisma.device.create({
        data: {
            name: 'Security Gate System - S601',
            type: 'CCTV',
            manufacturer: 'HID Global',
            model: 'iCLASS SE',
            buildingDetailId: buildingDetailS601.buildingDetailId,
            contract_id: cctvContract.contract_id
        }
    });

    // Devices for S701
    const elevator1S701 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S701',
            type: 'Elevator',
            manufacturer: 'ThyssenKrupp',
            model: 'Evolution',
            buildingDetailId: buildingDetailS701.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS701 = await prisma.device.create({
        data: {
            name: 'HVAC System - S701',
            type: 'HVAC',
            manufacturer: 'Mitsubishi Electric',
            model: 'City Multi',
            buildingDetailId: buildingDetailS701.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const plumbingS701 = await prisma.device.create({
        data: {
            name: 'Main Water System - S701',
            type: 'Plumbing',
            manufacturer: 'Wilo',
            model: 'Stratos GIGA',
            buildingDetailId: buildingDetailS701.buildingDetailId,
            contract_id: plumbingContract.contract_id
        }
    });

    // Devices for S801
    const elevator1S801 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S801',
            type: 'Elevator',
            manufacturer: 'Fujitec',
            model: 'GLVF-II',
            buildingDetailId: buildingDetailS801.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS801 = await prisma.device.create({
        data: {
            name: 'HVAC System - S801',
            type: 'HVAC',
            manufacturer: 'Hitachi',
            model: 'Set-Free',
            buildingDetailId: buildingDetailS801.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const electricalS801 = await prisma.device.create({
        data: {
            name: 'Electrical Distribution - S801',
            type: 'Electrical',
            manufacturer: 'Schneider Electric',
            model: 'Prisma Plus',
            buildingDetailId: buildingDetailS801.buildingDetailId,
            contract_id: electricalContract.contract_id
        }
    });

    // Devices for S901
    const elevator1S901 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S901',
            type: 'Elevator',
            manufacturer: 'Hyundai',
            model: 'LUXEN',
            buildingDetailId: buildingDetailS901.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS901 = await prisma.device.create({
        data: {
            name: 'HVAC System - S901',
            type: 'HVAC',
            manufacturer: 'LG',
            model: 'Multi V 5',
            buildingDetailId: buildingDetailS901.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const securityS901 = await prisma.device.create({
        data: {
            name: 'Security System - S901',
            type: 'CCTV',
            manufacturer: 'Bosch',
            model: 'B Series',
            buildingDetailId: buildingDetailS901.buildingDetailId,
            contract_id: cctvContract.contract_id
        }
    });

    // Devices for S1001
    const elevator1S1001 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S1001',
            type: 'Elevator',
            manufacturer: 'Toshiba',
            model: 'SPACEL-UNI',
            buildingDetailId: buildingDetailS1001.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS1001 = await prisma.device.create({
        data: {
            name: 'HVAC System - S1001',
            type: 'HVAC',
            manufacturer: 'Gree',
            model: 'GMV6',
            buildingDetailId: buildingDetailS1001.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // Devices for S1006
    const elevator1S1006 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S1006',
            type: 'Elevator',
            manufacturer: 'Sigma',
            model: 'IRIS',
            buildingDetailId: buildingDetailS1006.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS1006 = await prisma.device.create({
        data: {
            name: 'HVAC System - S1006',
            type: 'HVAC',
            manufacturer: 'Mitsubishi',
            model: 'VRF System',
            buildingDetailId: buildingDetailS1006.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const fireSprinklerS1006 = await prisma.device.create({
        data: {
            name: 'Fire Sprinkler System - S1006',
            type: 'Plumbing',
            manufacturer: 'Tyco',
            model: 'LFII Residential',
            buildingDetailId: buildingDetailS1006.buildingDetailId,
            contract_id: plumbingContract.contract_id
        }
    });

    // Add devices for remaining buildings (each building should have at least basic systems)
    // S103
    const elevator1S103 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S103',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS103.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS103 = await prisma.device.create({
        data: {
            name: 'HVAC System - S103',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV-X Series',
            buildingDetailId: buildingDetailS103.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S105
    const elevator1S105 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S105',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS105.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS105 = await prisma.device.create({
        data: {
            name: 'HVAC System - S105',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV-X Series',
            buildingDetailId: buildingDetailS105.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S106
    const elevator1S106 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S106',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS106.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS106 = await prisma.device.create({
        data: {
            name: 'HVAC System - S106',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV-X Series',
            buildingDetailId: buildingDetailS106.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S107
    const elevator1S107 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S107',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS107.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS107 = await prisma.device.create({
        data: {
            name: 'HVAC System - S107',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV-X Series',
            buildingDetailId: buildingDetailS107.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const waterPumpS107 = await prisma.device.create({
        data: {
            name: 'Water Pump System - S107',
            type: 'Plumbing',
            manufacturer: 'Grundfos',
            model: 'CR-95-2',
            buildingDetailId: buildingDetailS107.buildingDetailId,
            contract_id: plumbingContract.contract_id
        }
    });

    // Additional devices with different types to cover all DeviceType enum values

    // FireProtection devices
    const fireSystemS101 = await prisma.device.create({
        data: {
            name: 'Fire Protection System - S101',
            type: 'FireProtection',
            manufacturer: 'Johnson Controls',
            model: 'FireClass Series',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: fireProtectionContract.contract_id
        }
    });

    const fireSystemS201 = await prisma.device.create({
        data: {
            name: 'Fire Protection System - S201',
            type: 'FireProtection',
            manufacturer: 'Siemens',
            model: 'Cerberus PRO',
            buildingDetailId: buildingDetailS201.buildingDetailId,
            contract_id: fireProtectionContract.contract_id
        }
    });

    // Generator devices
    const generatorS301 = await prisma.device.create({
        data: {
            name: 'Emergency Generator - S301',
            type: 'Generator',
            manufacturer: 'Caterpillar',
            model: 'C15 ACERT',
            buildingDetailId: buildingDetailS301.buildingDetailId,
            contract_id: generatorContract.contract_id
        }
    });

    const generatorS601 = await prisma.device.create({
        data: {
            name: 'Backup Generator - S601',
            type: 'Generator',
            manufacturer: 'Cummins',
            model: 'QSX15-G9',
            buildingDetailId: buildingDetailS601.buildingDetailId,
            contract_id: generatorContract.contract_id
        }
    });

    // Lighting devices
    const lightingS701 = await prisma.device.create({
        data: {
            name: 'Common Area Lighting - S701',
            type: 'Lighting',
            manufacturer: 'Philips',
            model: 'LED SmartControl',
            buildingDetailId: buildingDetailS701.buildingDetailId,
            contract_id: lightingContract.contract_id
        }
    });

    const lightingS801 = await prisma.device.create({
        data: {
            name: 'Emergency Lighting - S801',
            type: 'Lighting',
            manufacturer: 'Eaton',
            model: 'Safety Series',
            buildingDetailId: buildingDetailS801.buildingDetailId,
            contract_id: lightingContract.contract_id
        }
    });

    // AutomaticDoor devices
    const autoGateS901 = await prisma.device.create({
        data: {
            name: 'Parking Gate - S901',
            type: 'AutomaticDoor',
            manufacturer: 'FAAC',
            model: '640 Barrier',
            buildingDetailId: buildingDetailS901.buildingDetailId,
            contract_id: automaticDoorContract.contract_id
        }
    });

    const autoDoorsS1001 = await prisma.device.create({
        data: {
            name: 'Lobby Automatic Doors - S1001',
            type: 'AutomaticDoor',
            manufacturer: 'ASSA ABLOY',
            model: 'Besam SL500',
            buildingDetailId: buildingDetailS1001.buildingDetailId,
            contract_id: automaticDoorContract.contract_id
        }
    });

    // FireExtinguisher devices
    const fireExtS102 = await prisma.device.create({
        data: {
            name: 'Portable Fire Extinguishers - S102',
            type: 'FireExtinguisher',
            manufacturer: 'Amerex',
            model: 'B456 ABC Dry Chemical',
            buildingDetailId: buildingDetailS102.buildingDetailId,
            contract_id: fireExtinguisherContract.contract_id
        }
    });

    const fireExtS202 = await prisma.device.create({
        data: {
            name: 'Fixed Fire Extinguisher System - S202',
            type: 'FireExtinguisher',
            manufacturer: 'Kidde',
            model: 'FM-200 Clean Agent',
            buildingDetailId: buildingDetailS202.buildingDetailId,
            contract_id: fireExtinguisherContract.contract_id
        }
    });

    // Other type devices
    const solarPanelS302 = await prisma.device.create({
        data: {
            name: 'Rooftop Solar Panels - S302',
            type: 'Other',
            manufacturer: 'SunPower',
            model: 'Maxeon 5 AC',
            buildingDetailId: buildingDetailS302.buildingDetailId,
            contract_id: otherEquipmentContract.contract_id
        }
    });

    const irrigationS503 = await prisma.device.create({
        data: {
            name: 'Landscape Irrigation System - S503',
            type: 'Other',
            manufacturer: 'Rain Bird',
            model: 'ESP-LXME Controller',
            buildingDetailId: buildingDetailS503.buildingDetailId,
            contract_id: otherEquipmentContract.contract_id
        }
    });

    console.log('Seeding technical records...');
    // Seed Technical Records for S1 cluster devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S101.device_id,
            file_name: 'elevator1_S101_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-07-10')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator2S101.device_id,
            file_name: 'elevator2_S101_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-07-11')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS101.device_id,
            file_name: 'hvac_S101_maintenance_guide.pdf',
            file_type: 'Maintenance Guide',
            upload_date: new Date('2021-07-12')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireAlarmS101.device_id,
            file_name: 'fire_alarm_S101_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-07-13')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: waterPumpS101.device_id,
            file_name: 'water_pump_S101_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-07-14')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: cctvS101.device_id,
            file_name: 'cctv_S101_installation_guide.pdf',
            file_type: 'Installation Guide',
            upload_date: new Date('2021-07-15')
        }
    });

    // S102 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S102.device_id,
            file_name: 'elevator1_S102_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-07-16')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator2S102.device_id,
            file_name: 'elevator2_S102_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-07-17')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS102.device_id,
            file_name: 'hvac_S102_maintenance_guide.pdf',
            file_type: 'Maintenance Guide',
            upload_date: new Date('2021-08-15')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireAlarmS102.device_id,
            file_name: 'fire_alarm_S102_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-08-16')
        }
    });

    // S201 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S201.device_id,
            file_name: 'elevator1_S201_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-08-17')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator2S201.device_id,
            file_name: 'elevator2_S201_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-08-18')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS201.device_id,
            file_name: 'hvac_S201_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-08-19')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: electricalS201.device_id,
            file_name: 'electrical_S201_wiring_diagram.pdf',
            file_type: 'Wiring Diagram',
            upload_date: new Date('2021-08-20')
        }
    });

    // S301 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S301.device_id,
            file_name: 'elevator1_S301_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-08-21')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS301.device_id,
            file_name: 'hvac_S301_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-08-22')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: waterTankS301.device_id,
            file_name: 'water_tank_S301_installation_guide.pdf',
            file_type: 'Installation Guide',
            upload_date: new Date('2021-08-23')
        }
    });

    // S501 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S501.device_id,
            file_name: 'elevator1_S501_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-08-24')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS501.device_id,
            file_name: 'hvac_S501_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-08-25')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: generatorS501.device_id,
            file_name: 'generator_S501_service_manual.pdf',
            file_type: 'Service Manual',
            upload_date: new Date('2021-08-26')
        }
    });

    // S601 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S601.device_id,
            file_name: 'elevator1_S601_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-10-05')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator2S601.device_id,
            file_name: 'elevator2_S601_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-09-01')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS601.device_id,
            file_name: 'hvac_S601_installation_guide.pdf',
            file_type: 'Installation Guide',
            upload_date: new Date('2021-09-02')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: securityGateS601.device_id,
            file_name: 'security_gate_S601_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-09-03')
        }
    });

    // S701 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S701.device_id,
            file_name: 'elevator1_S701_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-09-04')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS701.device_id,
            file_name: 'hvac_S701_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-09-05')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: plumbingS701.device_id,
            file_name: 'plumbing_S701_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-09-06')
        }
    });

    // S801 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S801.device_id,
            file_name: 'elevator1_S801_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-09-07')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS801.device_id,
            file_name: 'hvac_S801_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-09-08')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: electricalS801.device_id,
            file_name: 'electrical_S801_circuit_diagram.pdf',
            file_type: 'Circuit Diagram',
            upload_date: new Date('2021-09-09')
        }
    });

    // S901 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S901.device_id,
            file_name: 'elevator1_S901_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-09-10')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS901.device_id,
            file_name: 'hvac_S901_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-09-11')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: securityS901.device_id,
            file_name: 'security_S901_installation_guide.pdf',
            file_type: 'Installation Guide',
            upload_date: new Date('2021-09-12')
        }
    });

    // S1001 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S1001.device_id,
            file_name: 'elevator1_S1001_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-09-13')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS1001.device_id,
            file_name: 'hvac_S1001_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-09-14')
        }
    });

    // S1006 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S1006.device_id,
            file_name: 'elevator1_S1006_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-09-15')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS1006.device_id,
            file_name: 'hvac_S1006_maintenance_guide.pdf',
            file_type: 'Maintenance Guide',
            upload_date: new Date('2021-09-16')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireSprinklerS1006.device_id,
            file_name: 'fire_sprinkler_S1006_installation_diagram.pdf',
            file_type: 'Installation Diagram',
            upload_date: new Date('2021-09-17')
        }
    });

    // Technical records for remaining buildings
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S103.device_id,
            file_name: 'elevator1_S103_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-09-18')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS103.device_id,
            file_name: 'hvac_S103_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-09-19')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S105.device_id,
            file_name: 'elevator1_S105_maintenance_guide.pdf',
            file_type: 'Maintenance Guide',
            upload_date: new Date('2021-09-20')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS105.device_id,
            file_name: 'hvac_S105_commissioning_report.pdf',
            file_type: 'Commissioning Report',
            upload_date: new Date('2021-09-21')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S106.device_id,
            file_name: 'elevator1_S106_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-09-22')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS106.device_id,
            file_name: 'hvac_S106_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-09-23')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S107.device_id,
            file_name: 'elevator1_S107_safety_compliance.pdf',
            file_type: 'Safety Compliance',
            upload_date: new Date('2021-09-24')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS107.device_id,
            file_name: 'hvac_S107_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-09-25')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: waterPumpS107.device_id,
            file_name: 'water_pump_S107_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-09-26')
        }
    });

    // Technical records for additional device types
    await prisma.technicalRecord.create({
        data: {
            device_id: fireSystemS101.device_id,
            file_name: 'fire_system_S101_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-09-27')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireSystemS201.device_id,
            file_name: 'fire_system_S201_installation_guide.pdf',
            file_type: 'Installation Guide',
            upload_date: new Date('2021-09-28')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: generatorS301.device_id,
            file_name: 'generator_S301_operation_manual.pdf',
            file_type: 'Operation Manual',
            upload_date: new Date('2021-09-29')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: generatorS601.device_id,
            file_name: 'generator_S601_maintenance_schedule.pdf',
            file_type: 'Maintenance Schedule',
            upload_date: new Date('2021-09-30')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: lightingS701.device_id,
            file_name: 'lighting_S701_specification_sheet.pdf',
            file_type: 'Specification Sheet',
            upload_date: new Date('2021-10-01')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: lightingS801.device_id,
            file_name: 'lighting_S801_emergency_compliance.pdf',
            file_type: 'Compliance Certificate',
            upload_date: new Date('2021-10-02')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: autoGateS901.device_id,
            file_name: 'gate_S901_user_guide.pdf',
            file_type: 'User Guide',
            upload_date: new Date('2021-10-03')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: autoDoorsS1001.device_id,
            file_name: 'doors_S1001_installation_manual.pdf',
            file_type: 'Installation Manual',
            upload_date: new Date('2021-10-04')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireExtS102.device_id,
            file_name: 'fire_ext_S102_inspection_requirements.pdf',
            file_type: 'Inspection Requirements',
            upload_date: new Date('2021-10-05')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireExtS202.device_id,
            file_name: 'fire_ext_S202_technical_manual.pdf',
            file_type: 'Technical Manual',
            upload_date: new Date('2021-10-06')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: solarPanelS302.device_id,
            file_name: 'solar_S302_installation_manual.pdf',
            file_type: 'Installation Manual',
            upload_date: new Date('2021-10-07')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: irrigationS503.device_id,
            file_name: 'irrigation_S503_operator_manual.pdf',
            file_type: 'Operator Manual',
            upload_date: new Date('2021-10-08')
        }
    });

    console.log('Seeding maintenance history...');
    // Seed Maintenance History for S1 cluster devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S101.device_id,
            date_performed: new Date('2022-01-15'),
            description: 'Quarterly maintenance check',
            cost: 1500.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator2S101.device_id,
            date_performed: new Date('2022-01-20'),
            description: 'Monthly safety inspection',
            cost: 800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS101.device_id,
            date_performed: new Date('2022-01-25'),
            description: 'Filter cleaning and system check',
            cost: 600.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireAlarmS101.device_id,
            date_performed: new Date('2022-02-01'),
            description: 'Annual fire safety certification',
            cost: 1200.00
        }
    });

    // S102 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS102.device_id,
            date_performed: new Date('2022-02-20'),
            description: 'Filter replacement and system check',
            cost: 800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S102.device_id,
            date_performed: new Date('2022-02-22'),
            description: 'Cable inspection and lubrication',
            cost: 950.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator2S102.device_id,
            date_performed: new Date('2022-02-25'),
            description: 'Door mechanism adjustment',
            cost: 650.00
        }
    });

    // S201 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S201.device_id,
            date_performed: new Date('2022-03-05'),
            description: 'Emergency brake testing',
            cost: 1100.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS201.device_id,
            date_performed: new Date('2022-03-10'),
            description: 'Condenser cleaning and refrigerant check',
            cost: 750.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: electricalS201.device_id,
            date_performed: new Date('2022-03-15'),
            description: 'Circuit breaker testing and panel inspection',
            cost: 900.00
        }
    });

    // S601 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S601.device_id,
            date_performed: new Date('2022-04-10'),
            description: 'Annual safety inspection',
            cost: 2000.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator2S601.device_id,
            date_performed: new Date('2022-04-12'),
            description: 'Motor and pulley system maintenance',
            cost: 1800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS601.device_id,
            date_performed: new Date('2022-04-15'),
            description: 'Quarterly performance check and cleaning',
            cost: 700.00
        }
    });

    // S701 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S701.device_id,
            date_performed: new Date('2022-04-20'),
            description: 'Control system firmware update',
            cost: 1500.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS701.device_id,
            date_performed: new Date('2022-04-25'),
            description: 'Compressor inspection and fan belt replacement',
            cost: 900.00
        }
    });

    // S801 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S801.device_id,
            date_performed: new Date('2022-05-05'),
            description: 'Bi-annual comprehensive maintenance',
            cost: 2500.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: electricalS801.device_id,
            date_performed: new Date('2022-05-10'),
            description: 'Main switchboard cleaning and testing',
            cost: 1200.00
        }
    });

    // S901 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S901.device_id,
            date_performed: new Date('2022-05-15'),
            description: 'Door sensor calibration and safety edge testing',
            cost: 850.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: securityS901.device_id,
            date_performed: new Date('2022-05-20'),
            description: 'Security system software update and camera alignment',
            cost: 650.00
        }
    });

    // S1001 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S1001.device_id,
            date_performed: new Date('2022-06-05'),
            description: 'Speed governor testing and adjustment',
            cost: 1150.00
        }
    });

    // S1006 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS1006.device_id,
            date_performed: new Date('2022-06-10'),
            description: 'Annual maintenance and performance optimization',
            cost: 1300.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireSprinklerS1006.device_id,
            date_performed: new Date('2022-06-15'),
            description: 'Sprinkler head inspection and water flow testing',
            cost: 950.00
        }
    });

    // S103, S105, S106, S107 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S103.device_id,
            date_performed: new Date('2022-06-20'),
            description: 'Monthly preventive maintenance',
            cost: 750.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS105.device_id,
            date_performed: new Date('2022-06-25'),
            description: 'Seasonal service and filter replacement',
            cost: 800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S106.device_id,
            date_performed: new Date('2022-07-05'),
            description: 'Traction machine maintenance',
            cost: 1350.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: waterPumpS107.device_id,
            date_performed: new Date('2022-07-10'),
            description: 'Pump system pressure testing and seal replacement',
            cost: 900.00
        }
    });

    // Maintenance history for additional device types
    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireSystemS101.device_id,
            date_performed: new Date('2022-07-15'),
            description: 'Annual fire system certification and testing',
            cost: 2200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireSystemS201.device_id,
            date_performed: new Date('2022-07-20'),
            description: 'Fire detection sensors calibration',
            cost: 1800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: generatorS301.device_id,
            date_performed: new Date('2022-07-25'),
            description: 'Generator load testing and oil change',
            cost: 1500.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: generatorS601.device_id,
            date_performed: new Date('2022-08-01'),
            description: 'Fuel system cleaning and inspection',
            cost: 1200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: lightingS701.device_id,
            date_performed: new Date('2022-08-05'),
            description: 'LED driver replacement and fixture cleaning',
            cost: 850.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: lightingS801.device_id,
            date_performed: new Date('2022-08-10'),
            description: 'Emergency lighting battery replacement',
            cost: 950.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: autoGateS901.device_id,
            date_performed: new Date('2022-08-15'),
            description: 'Gate motor and sensor adjustment',
            cost: 750.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: autoDoorsS1001.device_id,
            date_performed: new Date('2022-08-20'),
            description: 'Door mechanism lubrication and track cleaning',
            cost: 600.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireExtS102.device_id,
            date_performed: new Date('2022-08-25'),
            description: 'Fire extinguisher annual inspection and certification',
            cost: 1200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireExtS202.device_id,
            date_performed: new Date('2022-09-01'),
            description: 'Clean agent system pressure testing',
            cost: 1600.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: solarPanelS302.device_id,
            date_performed: new Date('2022-09-05'),
            description: 'Solar panel cleaning and connection inspection',
            cost: 900.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: irrigationS503.device_id,
            date_performed: new Date('2022-09-10'),
            description: 'Irrigation system winterization',
            cost: 750.00
        }
    });

    console.log('✅ Seed complete');
}

main()
    .catch((e) => console.error('❌ Seed error:', e))
    .finally(async () => {
        await prisma.$disconnect();
    });
