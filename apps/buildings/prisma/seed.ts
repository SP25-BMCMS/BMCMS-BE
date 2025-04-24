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
            description: 'Rainbow area consists of 4 buildings'
        }
    });

    const origamiArea = await prisma.area.create({
        data: {
            name: 'The Origami',
            description: 'Origami area consists of 5 buildings'
        }
    });

    const beverlyArea = await prisma.area.create({
        data: {
            name: 'The Beverly',
            description: 'Beverly area consists of 3 buildings'
        }
    });

    const gloryHeightsArea = await prisma.area.create({
        data: {
            name: 'Glory Heights',
            description: 'Glory Heights area consists of 3 buildings'
        }
    });

    const masteriCentrePointArea = await prisma.area.create({
        data: {
            name: 'Masteri Centre Point',
            description: 'Masteri Centre Point area consists of 3 buildings'
        }
    });

    const lumièreBoulevardArea = await prisma.area.create({
        data: {
            name: 'Lumière Boulevard',
            description: 'Lumière Boulevard area consists of 3 buildings'
        }
    });


    console.log('Seeding buildings...');
    // Seed Buildings in Rainbow Area
    const buildingS1 = await prisma.building.create({
        data: {
            name: 'S1',
            description: 'Building S1 - Rainbow Area',
            numberFloor: 25,
            imageCover: 'https://th.bing.com/th/id/OIP.x16cxXtPkaps_wRoVQvSVwHaHa?rs=1&pid=ImgDetMain',
            areaId: rainbowArea.areaId,
            Status: 'operational',
            construction_date: new Date('2018-01-01'),
            completion_date: new Date('2020-06-30'),
            Warranty_date: new Date('2025-06-30')
        }
    });

    const buildingS2 = await prisma.building.create({
        data: {
            name: 'S2',
            description: 'Building S2 - Rainbow Area',
            numberFloor: 30,
            imageCover: 'https://th.bing.com/th/id/OIP.x16cxXtPkaps_wRoVQvSVwHaHa?rs=1&pid=ImgDetMain',
            areaId: rainbowArea.areaId,
            Status: 'operational',
            construction_date: new Date('2018-02-01'),
            completion_date: new Date('2020-09-15'),
            Warranty_date: new Date('2025-09-15')
        }
    });

    const buildingS3 = await prisma.building.create({
        data: {
            name: 'S3',
            description: 'Building S3 - Rainbow Area',
            numberFloor: 28,
            imageCover: 'https://th.bing.com/th/id/OIP.x16cxXtPkaps_wRoVQvSVwHaHa?rs=1&pid=ImgDetMain',
            areaId: rainbowArea.areaId,
            Status: 'operational',
            construction_date: new Date('2018-03-15'),
            completion_date: new Date('2020-10-30'),
            Warranty_date: new Date('2025-10-30')
        }
    });

    const buildingS4 = await prisma.building.create({
        data: {
            name: 'S4',
            description: 'Building S4 - Rainbow Area',
            numberFloor: 27,
            imageCover: 'https://th.bing.com/th/id/OIP.x16cxXtPkaps_wRoVQvSVwHaHa?rs=1&pid=ImgDetMain',
            areaId: rainbowArea.areaId,
            Status: 'operational',
            construction_date: new Date('2018-04-20'),
            completion_date: new Date('2020-11-15'),
            Warranty_date: new Date('2025-11-15')
        }
    });

    // Seed Buildings in Origami Area
    const buildingS5 = await prisma.building.create({
        data: {
            name: 'S5',
            description: 'Building S5 - Origami Area',
            numberFloor: 22,
            imageCover: 'https://www.vinhomeland.com.vn/wp-content/uploads/2020/04/the-origami-vinhomes-grand-park-48.jpg',
            areaId: origamiArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-01-10'),
            completion_date: new Date('2021-05-20'),
            Warranty_date: new Date('2026-05-20')
        }
    });

    const buildingS6 = await prisma.building.create({
        data: {
            name: 'S6',
            description: 'Building S6 - Origami Area',
            numberFloor: 20,
            imageCover: 'https://www.vinhomeland.com.vn/wp-content/uploads/2020/04/the-origami-vinhomes-grand-park-48.jpg',
            areaId: origamiArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-05-01'),
            completion_date: new Date('2021-08-30'),
            Warranty_date: new Date('2026-08-30')
        }
    });

    const buildingS7 = await prisma.building.create({
        data: {
            name: 'S7',
            description: 'Building S7 - Origami Area',
            numberFloor: 24,
            imageCover: 'https://www.vinhomeland.com.vn/wp-content/uploads/2020/04/the-origami-vinhomes-grand-park-48.jpg',
            areaId: origamiArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-06-15'),
            completion_date: new Date('2021-10-10'),
            Warranty_date: new Date('2026-10-10')
        }
    });

    // Seed Buildings in Beverly Area
    const buildingB1 = await prisma.building.create({
        data: {
            name: 'B1',
            description: 'Building B1 - Beverly Area',
            numberFloor: 35,
            imageCover: 'https://th.bing.com/th/id/OIP.QE9QeI_VhS_f1vSWQKFEwQHaDb?rs=1&pid=ImgDetMain',
            areaId: beverlyArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-02-01'),
            completion_date: new Date('2021-07-15'),
            Warranty_date: new Date('2026-07-15')
        }
    });

    const buildingB2 = await prisma.building.create({
        data: {
            name: 'B2',
            description: 'Building B2 - Beverly Area',
            numberFloor: 33,
            imageCover: 'https://th.bing.com/th/id/OIP.QE9QeI_VhS_f1vSWQKFEwQHaDb?rs=1&pid=ImgDetMain',
            areaId: beverlyArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-04-10'),
            completion_date: new Date('2021-09-20'),
            Warranty_date: new Date('2026-09-20')
        }
    });

    // Seed Buildings in Glory Heights Area
    const buildingG1 = await prisma.building.create({
        data: {
            name: 'G1',
            description: 'Building G1 - Glory Heights Area',
            numberFloor: 40,
            imageCover: 'https://th.bing.com/th/id/OIP.KY4OZ1jxkEbi074AP4kU0AHaEK?rs=1&pid=ImgDetMain',
            areaId: gloryHeightsArea.areaId,
            Status: 'operational',
            construction_date: new Date('2020-01-05'),
            completion_date: new Date('2022-05-10'),
            Warranty_date: new Date('2027-05-10')
        }
    });

    const buildingG2 = await prisma.building.create({
        data: {
            name: 'G2',
            description: 'Building G2 - Glory Heights Area',
            numberFloor: 38,
            imageCover: 'https://th.bing.com/th/id/OIP.KY4OZ1jxkEbi074AP4kU0AHaEK?rs=1&pid=ImgDetMain',
            areaId: gloryHeightsArea.areaId,
            Status: 'operational',
            construction_date: new Date('2020-03-15'),
            completion_date: new Date('2022-08-20'),
            Warranty_date: new Date('2027-08-20')
        }
    });

    // Seed Buildings in Masteri Centre Point Area
    const buildingM1 = await prisma.building.create({
        data: {
            name: 'M1',
            description: 'Building M1 - Masteri Centre Point Area',
            numberFloor: 45,
            imageCover: 'https://th.bing.com/th/id/OIP.MkvRKAvG2KWAEYaexd3vgQHaFj?rs=1&pid=ImgDetMain',
            areaId: masteriCentrePointArea.areaId,
            Status: 'operational',
            construction_date: new Date('2020-05-10'),
            completion_date: new Date('2022-10-15'),
            Warranty_date: new Date('2027-10-15')
        }
    });

    const buildingM2 = await prisma.building.create({
        data: {
            name: 'M2',
            description: 'Building M2 - Masteri Centre Point Area',
            numberFloor: 42,
            imageCover: 'https://th.bing.com/th/id/OIP.MkvRKAvG2KWAEYaexd3vgQHaFj?rs=1&pid=ImgDetMain',
            areaId: masteriCentrePointArea.areaId,
            Status: 'operational',
            construction_date: new Date('2020-07-20'),
            completion_date: new Date('2022-12-10'),
            Warranty_date: new Date('2027-12-10')
        }
    });

    // Seed Buildings in Lumière Boulevard Area
    const buildingL1 = await prisma.building.create({
        data: {
            name: 'L1',
            description: 'Building L1 - Lumière Boulevard Area',
            numberFloor: 32,
            imageCover: 'https://th.bing.com/th/id/OIP.8nogDElvifhFSCLR3HtSfgHaEu?rs=1&pid=ImgDetMain',
            areaId: lumièreBoulevardArea.areaId,
            Status: 'operational',
            construction_date: new Date('2021-01-15'),
            completion_date: new Date('2023-06-20'),
            Warranty_date: new Date('2028-06-20')
        }
    });

    const buildingL2 = await prisma.building.create({
        data: {
            name: 'L2',
            description: 'Building L2 - Lumière Boulevard Area',
            numberFloor: 30,
            imageCover: 'https://th.bing.com/th/id/OIP.8nogDElvifhFSCLR3HtSfgHaEu?rs=1&pid=ImgDetMain',
            areaId: lumièreBoulevardArea.areaId,
            Status: 'operational',
            construction_date: new Date('2021-03-25'),
            completion_date: new Date('2023-08-15'),
            Warranty_date: new Date('2028-08-15')
        }
    });

    console.log('Seeding building details...');
    // Seed BuildingDetails for S1
    const buildingDetailS1A = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS1.buildingId,
            name: 'S1-A',
            total_apartments: 100
        }
    });

    const buildingDetailS1B = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS1.buildingId,
            name: 'S1-B',
            total_apartments: 120
        }
    });

    // Seed BuildingDetails for S2
    const buildingDetailS2A = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS2.buildingId,
            name: 'S2-A',
            total_apartments: 150
        }
    });

    // Seed BuildingDetails for S3
    const buildingDetailS3A = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS3.buildingId,
            name: 'S3-A',
            total_apartments: 130
        }
    });

    // Seed BuildingDetails for S5
    const buildingDetailS5A = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS5.buildingId,
            name: 'S5-A',
            total_apartments: 90
        }
    });

    // Seed BuildingDetails for B1
    const buildingDetailB1A = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingB1.buildingId,
            name: 'B1-A',
            total_apartments: 160
        }
    });

    // Seed BuildingDetails for G1
    const buildingDetailG1A = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingG1.buildingId,
            name: 'G1-A',
            total_apartments: 180
        }
    });

    // Seed BuildingDetails for M1
    const buildingDetailM1A = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingM1.buildingId,
            name: 'M1-A',
            total_apartments: 200
        }
    });

    // Seed BuildingDetails for L1
    const buildingDetailL1A = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingL1.buildingId,
            name: 'L1-A',
            total_apartments: 150
        }
    });

    // Seed BuildingDetails for S6
    const buildingDetailS6A = await prisma.buildingDetail.create({
        data: {
            buildingId: buildingS6.buildingId,
            name: 'S6-A',
            total_apartments: 80
        }
    });

    console.log('Seeding location details...');
    // Seed LocationDetails for S1-A
    const locationS1A1 = await prisma.locationDetail.create({
        data: {
            buildingDetailId: buildingDetailS1A.buildingDetailId,
            inspection_id: 'INS-S1A-001',
            floorNumber: 1,
            roomNumber: 'Lobby',
            areaType: 'Floor',
            description: 'Ground floor lobby area'
        }
    });

    const locationS1A2 = await prisma.locationDetail.create({
        data: {
            buildingDetailId: buildingDetailS1A.buildingDetailId,
            inspection_id: 'INS-S1A-002',
            floorNumber: 2,
            roomNumber: 'S1A-201',
            areaType: 'Wall',
            description: 'Wall of apartment 201'
        }
    });

    // Seed LocationDetails for S2-A
    const locationS2A1 = await prisma.locationDetail.create({
        data: {
            buildingDetailId: buildingDetailS2A.buildingDetailId,
            inspection_id: 'INS-S2A-001',
            floorNumber: 5,
            roomNumber: 'S2A-501',
            areaType: 'Ceiling',
            description: 'Ceiling of apartment 501'
        }
    });

    // Seed LocationDetails for S6
    const locationS6A1 = await prisma.locationDetail.create({
        data: {
            buildingDetailId: buildingDetailS6A.buildingDetailId,
            inspection_id: 'INS-S6A-001',
            floorNumber: 10,
            roomNumber: 'S6A-1001',
            areaType: 'Wall',
            description: 'Wall of apartment 1001'
        }
    });

    // Seed LocationDetails for B1
    const locationB1A1 = await prisma.locationDetail.create({
        data: {
            buildingDetailId: buildingDetailB1A.buildingDetailId,
            inspection_id: 'INS-B1A-001',
            floorNumber: 15,
            roomNumber: 'B1A-1501',
            areaType: 'Floor',
            description: 'Floor of apartment 1501'
        }
    });

    // Seed LocationDetails for G1
    const locationG1A1 = await prisma.locationDetail.create({
        data: {
            buildingDetailId: buildingDetailG1A.buildingDetailId,
            inspection_id: 'INS-G1A-001',
            floorNumber: 20,
            roomNumber: 'G1A-2001',
            areaType: 'column',
            description: 'Main support column of apartment 2001'
        }
    });

    // Seed LocationDetails for M1
    const locationM1A1 = await prisma.locationDetail.create({
        data: {
            buildingDetailId: buildingDetailM1A.buildingDetailId,
            inspection_id: 'INS-M1A-001',
            floorNumber: 25,
            roomNumber: 'M1A-2501',
            areaType: 'Wall',
            description: 'Living room wall of apartment 2501'
        }
    });

    // Seed LocationDetails for L1
    const locationL1A1 = await prisma.locationDetail.create({
        data: {
            buildingDetailId: buildingDetailL1A.buildingDetailId,
            inspection_id: 'INS-L1A-001',
            floorNumber: 15,
            roomNumber: 'L1A-1501',
            areaType: 'Ceiling',
            description: 'Bedroom ceiling of apartment 1501'
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

    console.log('Seeding devices...');
    // Seed Devices for S1-A
    const elevator1 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S1A',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS1A.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvac1 = await prisma.device.create({
        data: {
            name: 'HVAC System - S1A',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV-X Series',
            buildingDetailId: buildingDetailS1A.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // Seed Devices for S2-A
    const elevator2 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S2A',
            type: 'Elevator',
            manufacturer: 'Otis',
            model: 'GeN2-MR',
            buildingDetailId: buildingDetailS2A.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    // Seed Devices for S6
    const elevator3 = await prisma.device.create({
        data: {
            name: 'Elevator 1 - S6A',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-6000',
            buildingDetailId: buildingDetailS6A.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    // Seed Devices for B1
    const electrical1 = await prisma.device.create({
        data: {
            name: 'Main Electrical Panel - B1A',
            type: 'Electrical',
            manufacturer: 'ABB',
            model: 'Power Distribution Panel XL',
            buildingDetailId: buildingDetailB1A.buildingDetailId,
            contract_id: electricalContract.contract_id
        }
    });

    // Seed Devices for G1
    const plumbing1 = await prisma.device.create({
        data: {
            name: 'Water Pump System - G1A',
            type: 'Plumbing',
            manufacturer: 'Grundfos',
            model: 'CR-64',
            buildingDetailId: buildingDetailG1A.buildingDetailId,
            contract_id: plumbingContract.contract_id
        }
    });

    // Seed Devices for M1
    const cctv1 = await prisma.device.create({
        data: {
            name: 'CCTV System - M1A',
            type: 'CCTV',
            manufacturer: 'Hikvision',
            model: 'DS-2CD2385G1',
            buildingDetailId: buildingDetailM1A.buildingDetailId,
            contract_id: cctvContract.contract_id
        }
    });

    // Seed Devices for L1
    const hvac2 = await prisma.device.create({
        data: {
            name: 'Central AC - L1A',
            type: 'HVAC',
            manufacturer: 'Carrier',
            model: 'Aquaforce 30XW',
            buildingDetailId: buildingDetailL1A.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    console.log('Seeding technical records...');
    // Seed Technical Records
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1.device_id,
            file_name: 'elevator1_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2021-07-10')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvac1.device_id,
            file_name: 'hvac_maintenance_guide.pdf',
            file_type: 'Maintenance Guide',
            upload_date: new Date('2021-08-15')
        }
    });

    // Additional technical records
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator3.device_id,
            file_name: 'elevator3_specifications.pdf',
            file_type: 'Technical Specifications',
            upload_date: new Date('2021-10-05')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: electrical1.device_id,
            file_name: 'electrical_panel_diagram.pdf',
            file_type: 'Circuit Diagram',
            upload_date: new Date('2022-01-15')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: plumbing1.device_id,
            file_name: 'water_pump_system_manual.pdf',
            file_type: 'User Manual',
            upload_date: new Date('2022-03-20')
        }
    });

    console.log('Seeding maintenance history...');
    // Seed Maintenance History
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1.device_id,
            date_performed: new Date('2022-01-15'),
            description: 'Quarterly maintenance check',
            cost: 1500.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvac1.device_id,
            date_performed: new Date('2022-02-20'),
            description: 'Filter replacement and system check',
            cost: 800.00
        }
    });

    // Additional maintenance history
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator3.device_id,
            date_performed: new Date('2022-04-10'),
            description: 'Annual safety inspection',
            cost: 2000.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: electrical1.device_id,
            date_performed: new Date('2022-05-25'),
            description: 'Circuit breaker replacement',
            cost: 1200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: plumbing1.device_id,
            date_performed: new Date('2022-06-15'),
            description: 'Pump maintenance and pressure test',
            cost: 950.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: cctv1.device_id,
            date_performed: new Date('2022-07-20'),
            description: 'Software update and camera alignment',
            cost: 600.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvac2.device_id,
            date_performed: new Date('2022-08-05'),
            description: 'Refrigerant recharge and compressor inspection',
            cost: 1800.00
        }
    });

    console.log('Seeding crack records...');
    // Seed Crack Records
    await prisma.crackRecord.create({
        data: {
            locationDetailId: locationS1A2.locationDetailId,
            crackType: 'Vertical',
            length: 0.5, // 50cm
            width: 0.002, // 2mm
            depth: 0.01, // 1cm
            description: 'Small vertical crack on wall'
        }
    });

    await prisma.crackRecord.create({
        data: {
            locationDetailId: locationS2A1.locationDetailId,
            crackType: 'Diagonal',
            length: 0.8, // 80cm
            width: 0.003, // 3mm
            depth: 0.015, // 1.5cm
            description: 'Diagonal crack on ceiling, likely due to settling'
        }
    });

    // Additional crack records
    await prisma.crackRecord.create({
        data: {
            locationDetailId: locationS6A1.locationDetailId,
            crackType: 'Horizontal',
            length: 0.6, // 60cm
            width: 0.0025, // 2.5mm
            depth: 0.012, // 1.2cm
            description: 'Horizontal crack on wall, possibly from thermal expansion'
        }
    });

    await prisma.crackRecord.create({
        data: {
            locationDetailId: locationB1A1.locationDetailId,
            crackType: 'NonStructural',
            length: 0.3, // 30cm
            width: 0.001, // 1mm
            depth: 0.005, // 0.5cm
            description: 'Surface crack on floor tile'
        }
    });

    await prisma.crackRecord.create({
        data: {
            locationDetailId: locationG1A1.locationDetailId,
            crackType: 'Structural',
            length: 1.2, // 120cm
            width: 0.004, // 4mm
            depth: 0.02, // 2cm
            description: 'Structural crack on support column, needs immediate attention'
        }
    });

    await prisma.crackRecord.create({
        data: {
            locationDetailId: locationM1A1.locationDetailId,
            crackType: 'Vertical',
            length: 0.7, // 70cm
            width: 0.0015, // 1.5mm
            depth: 0.008, // 0.8cm
            description: 'Vertical crack on living room wall'
        }
    });

    await prisma.crackRecord.create({
        data: {
            locationDetailId: locationL1A1.locationDetailId,
            crackType: 'Diagonal',
            length: 0.9, // 90cm
            width: 0.0035, // 3.5mm
            depth: 0.018, // 1.8cm
            description: 'Diagonal crack on bedroom ceiling near window'
        }
    });

    console.log('✅ Seed complete');
}

main()
    .catch((e) => console.error('❌ Seed error:', e))
    .finally(async () => {
        await prisma.$disconnect();
    });
