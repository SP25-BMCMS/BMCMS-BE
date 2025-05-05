import { PrismaClient } from '@prisma/client-building';

const prisma = new PrismaClient();

async function main() {
    // Clean up existing data to avoid unique constraint errors
    console.log('Đang xóa dữ liệu hiện có...');
    await prisma.maintenanceHistory.deleteMany({});
    await prisma.technicalRecord.deleteMany({});
    await prisma.device.deleteMany({});
    await prisma.crackRecord.deleteMany({});
    await prisma.locationDetail.deleteMany({});
    await prisma.buildingDetail.deleteMany({});
    await prisma.building.deleteMany({});
    await prisma.area.deleteMany({});
    await prisma.contract.deleteMany({});

    console.log('Đang tạo dữ liệu khu vực...');
    // Seed Areas
    const rainbowArea = await prisma.area.create({
        data: {
            name: 'The Rainbow',
            description: 'Khu vực Rainbow bao gồm 17 tòa nhà trong 4 cụm: S1, S2, S3, S5'
        }
    });

    const origamiArea = await prisma.area.create({
        data: {
            name: 'The Origami',
            description: 'Khu vực Origami bao gồm 21 tòa nhà trong 5 cụm: S6, S7, S8, S9, S10'
        }
    });

    console.log('Đang tạo dữ liệu tòa nhà...');
    // Seed Buildings in Rainbow Area - 17 tòa

    // Cluster S1 (6 tòa: S1.01, S1.02, S1.03, S1.05, S1.06, S1.07)
    const buildingS1 = await prisma.building.create({
        data: {
            name: 'S1',
            description: 'Tòa nhà S1 - 6 tòa - Khu vực Rainbow',
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
            description: 'Tòa nhà S2 - 4 tòa - Khu vực Rainbow',
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
            description: 'Tòa nhà S3 - 4 tòa - Khu vực Rainbow',
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
            description: 'Tòa nhà S5 - 3 tòa - Khu vực Rainbow',
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
            description: 'Tòa nhà S6 - 5 tòa - Khu vực Origami',
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
            description: 'Tòa nhà S7 - 4 tòa - Khu vực Origami',
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
            description: 'Tòa nhà S8 - 3 tòa - Khu vực Origami',
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
            description: 'Tòa nhà S9 - 3 tòa - Khu vực Origami',
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
            description: 'Tòa nhà S10 - 6 tòa - Khu vực Origami',
            numberFloor: 21,
            imageCover: 'https://www.vinhomeland.com.vn/wp-content/uploads/2020/04/the-origami-vinhomes-grand-park-48.jpg',
            areaId: origamiArea.areaId,
            Status: 'operational',
            construction_date: new Date('2019-08-01'),
            completion_date: new Date('2021-12-01'),
            Warranty_date: new Date('2026-12-01')
        }
    });

    console.log('Đang tạo dữ liệu chi tiết tòa nhà...');
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

    console.log('Đang tạo dữ liệu hợp đồng...');
    // Seed Contract for devices
    const elevatorContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-01-01'),
            end_date: new Date('2026-01-01'),
            vendor: 'Công ty Thang máy Schindler',
            file_name: 'hop_dong_thang_may.pdf'
        }
    });

    const hvacContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-03-15'),
            end_date: new Date('2026-03-15'),
            vendor: 'Công ty Điều hòa Daikin',
            file_name: 'hop_dong_dieu_hoa.pdf'
        }
    });

    const electricalContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-05-10'),
            end_date: new Date('2026-05-10'),
            vendor: 'Công ty Điện ABB',
            file_name: 'hop_dong_dien.pdf'
        }
    });

    const plumbingContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-07-20'),
            end_date: new Date('2026-07-20'),
            vendor: 'Công ty Cấp thoát nước',
            file_name: 'hop_dong_cap_thoat_nuoc.pdf'
        }
    });

    const cctvContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-09-05'),
            end_date: new Date('2026-09-05'),
            vendor: 'Công ty An ninh Security Vision',
            file_name: 'hop_dong_camera.pdf'
        }
    });

    const fireProtectionContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-04-01'),
            end_date: new Date('2026-04-01'),
            vendor: 'Công ty PCCC Johnson Controls',
            file_name: 'hop_dong_pccc.pdf'
        }
    });

    const generatorContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-06-15'),
            end_date: new Date('2026-06-15'),
            vendor: 'Công ty Máy phát điện Caterpillar',
            file_name: 'hop_dong_may_phat_dien.pdf'
        }
    });

    const lightingContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-08-01'),
            end_date: new Date('2026-08-01'),
            vendor: 'Công ty Chiếu sáng Signify (Philips)',
            file_name: 'hop_dong_chieu_sang.pdf'
        }
    });

    const automaticDoorContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-10-10'),
            end_date: new Date('2026-10-10'),
            vendor: 'Công ty Cửa tự động ASSA ABLOY',
            file_name: 'hop_dong_cua_tu_dong.pdf'
        }
    });

    const fireExtinguisherContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-11-15'),
            end_date: new Date('2026-11-15'),
            vendor: 'Công ty PCCC Minimax',
            file_name: 'hop_dong_binh_chua_chay.pdf'
        }
    });

    // Additional contract for other type devices
    const otherEquipmentContract = await prisma.contract.create({
        data: {
            start_date: new Date('2021-12-01'),
            end_date: new Date('2026-12-01'),
            vendor: 'Công ty Dịch vụ Thiết bị Tổng hợp',
            file_name: 'hop_dong_thiet_bi_khac.pdf'
        }
    });

    console.log('Seeding devices...');
    // Seed Devices for Rainbow Area - S1 Cluster
    const elevator1S101 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S101',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const elevator2S101 = await prisma.device.create({
        data: {
            name: 'Thang máy 2 - S101',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS101 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S101',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV-X Series',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const fireAlarmS101 = await prisma.device.create({
        data: {
            name: 'Hệ thống báo cháy - S101',
            type: 'FireProtection',
            manufacturer: 'Honeywell',
            model: 'Notifier NFS2-3030',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: electricalContract.contract_id
        }
    });

    const waterPumpS101 = await prisma.device.create({
        data: {
            name: 'Hệ thống bơm nước - S101',
            type: 'Plumbing',
            manufacturer: 'Grundfos',
            model: 'CR-95-2',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: plumbingContract.contract_id
        }
    });

    const cctvS101 = await prisma.device.create({
        data: {
            name: 'Hệ thống camera - S101',
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
            name: 'Thang máy 1 - S102',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS102.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const elevator2S102 = await prisma.device.create({
        data: {
            name: 'Thang máy 2 - S102',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS102.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS102 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S102',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV-X Series',
            buildingDetailId: buildingDetailS102.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const fireAlarmS102 = await prisma.device.create({
        data: {
            name: 'Hệ thống báo cháy - S102',
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
            name: 'Thang máy 1 - S201',
            type: 'Elevator',
            manufacturer: 'Otis',
            model: 'GeN2-MR',
            buildingDetailId: buildingDetailS201.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const elevator2S201 = await prisma.device.create({
        data: {
            name: 'Thang máy 2 - S201',
            type: 'Elevator',
            manufacturer: 'Otis',
            model: 'GeN2-MR',
            buildingDetailId: buildingDetailS201.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS201 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S201',
            type: 'HVAC',
            manufacturer: 'Carrier',
            model: 'AquaEdge 19DV',
            buildingDetailId: buildingDetailS201.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const electricalS201 = await prisma.device.create({
        data: {
            name: 'Tủ điện chính - S201',
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
            name: 'Thang máy 1 - S301',
            type: 'Elevator',
            manufacturer: 'Mitsubishi',
            model: 'NexWay',
            buildingDetailId: buildingDetailS301.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS301 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S301',
            type: 'HVAC',
            manufacturer: 'Trane',
            model: 'Series R',
            buildingDetailId: buildingDetailS301.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const waterTankS301 = await prisma.device.create({
        data: {
            name: 'Bể chứa nước - S301',
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
            name: 'Thang máy 1 - S501',
            type: 'Elevator',
            manufacturer: 'KONE',
            model: 'MonoSpace 700',
            buildingDetailId: buildingDetailS501.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS501 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S501',
            type: 'HVAC',
            manufacturer: 'York',
            model: 'YZ Magnetic Bearing Centrifugal',
            buildingDetailId: buildingDetailS501.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const generatorS501 = await prisma.device.create({
        data: {
            name: 'Máy phát điện dự phòng - S501',
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
            name: 'Thang máy 1 - S601',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-6000',
            buildingDetailId: buildingDetailS601.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const elevator2S601 = await prisma.device.create({
        data: {
            name: 'Thang máy 2 - S601',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-6000',
            buildingDetailId: buildingDetailS601.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS601 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S601',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV IV',
            buildingDetailId: buildingDetailS601.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const securityGateS601 = await prisma.device.create({
        data: {
            name: 'Hệ thống cổng an ninh - S601',
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
            name: 'Thang máy 1 - S701',
            type: 'Elevator',
            manufacturer: 'ThyssenKrupp',
            model: 'Evolution',
            buildingDetailId: buildingDetailS701.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS701 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S701',
            type: 'HVAC',
            manufacturer: 'Mitsubishi Electric',
            model: 'City Multi',
            buildingDetailId: buildingDetailS701.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const plumbingS701 = await prisma.device.create({
        data: {
            name: 'Hệ thống cấp nước chính - S701',
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
            name: 'Thang máy 1 - S801',
            type: 'Elevator',
            manufacturer: 'Fujitec',
            model: 'GLVF-II',
            buildingDetailId: buildingDetailS801.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS801 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S801',
            type: 'HVAC',
            manufacturer: 'Hitachi',
            model: 'Set-Free',
            buildingDetailId: buildingDetailS801.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const electricalS801 = await prisma.device.create({
        data: {
            name: 'Hệ thống phân phối điện - S801',
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
            name: 'Thang máy 1 - S901',
            type: 'Elevator',
            manufacturer: 'Hyundai',
            model: 'LUXEN',
            buildingDetailId: buildingDetailS901.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS901 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S901',
            type: 'HVAC',
            manufacturer: 'LG',
            model: 'Multi V 5',
            buildingDetailId: buildingDetailS901.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const securityS901 = await prisma.device.create({
        data: {
            name: 'Hệ thống an ninh - S901',
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
            name: 'Thang máy 1 - S1001',
            type: 'Elevator',
            manufacturer: 'Toshiba',
            model: 'SPACEL-UNI',
            buildingDetailId: buildingDetailS1001.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });
    const hvacS1001 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S1001',
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
            name: 'Thang máy 1 - S1006',
            type: 'Elevator',
            manufacturer: 'Sigma',
            model: 'IRIS',
            buildingDetailId: buildingDetailS1006.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS1006 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S1006',
            type: 'HVAC',
            manufacturer: 'Mitsubishi',
            model: 'VRF System',
            buildingDetailId: buildingDetailS1006.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const fireSprinklerS1006 = await prisma.device.create({
        data: {
            name: 'Hệ thống chữa cháy - S1006',
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
            name: 'Thang máy 1 - S103',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS103.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS103 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S103',
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
            name: 'Thang máy 1 - S105',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS105.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS105 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S105',
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
            name: 'Thang máy 1 - S106',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS106.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS106 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S106',
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
            name: 'Thang máy 1 - S107',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-5000',
            buildingDetailId: buildingDetailS107.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS107 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S107',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV-X Series',
            buildingDetailId: buildingDetailS107.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    const waterPumpS107 = await prisma.device.create({
        data: {
            name: 'Hệ thống bơm nước - S107',
            type: 'Plumbing',
            manufacturer: 'Grundfos',
            model: 'CR-95-2',
            buildingDetailId: buildingDetailS107.buildingDetailId,
            contract_id: plumbingContract.contract_id
        }
    });

    // S202
    const elevator1S202 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S202',
            type: 'Elevator',
            manufacturer: 'Otis',
            model: 'GeN2-MR',
            buildingDetailId: buildingDetailS202.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS202 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S202',
            type: 'HVAC',
            manufacturer: 'Carrier',
            model: 'AquaEdge 19DV',
            buildingDetailId: buildingDetailS202.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S203
    const elevator1S203 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S203',
            type: 'Elevator',
            manufacturer: 'Otis',
            model: 'GeN2-MR',
            buildingDetailId: buildingDetailS203.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS203 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S203',
            type: 'HVAC',
            manufacturer: 'Carrier',
            model: 'AquaEdge 19DV',
            buildingDetailId: buildingDetailS203.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S205
    const elevator1S205 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S205',
            type: 'Elevator',
            manufacturer: 'Otis',
            model: 'GeN2-MR',
            buildingDetailId: buildingDetailS205.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS205 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S205',
            type: 'HVAC',
            manufacturer: 'Carrier',
            model: 'AquaEdge 19DV',
            buildingDetailId: buildingDetailS205.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S302
    const elevator1S302 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S302',
            type: 'Elevator',
            manufacturer: 'Mitsubishi',
            model: 'NexWay',
            buildingDetailId: buildingDetailS302.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS302 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S302',
            type: 'HVAC',
            manufacturer: 'Trane',
            model: 'Series R',
            buildingDetailId: buildingDetailS302.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S303
    const elevator1S303 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S303',
            type: 'Elevator',
            manufacturer: 'Mitsubishi',
            model: 'NexWay',
            buildingDetailId: buildingDetailS303.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS303 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S303',
            type: 'HVAC',
            manufacturer: 'Trane',
            model: 'Series R',
            buildingDetailId: buildingDetailS303.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S305
    const elevator1S305 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S305',
            type: 'Elevator',
            manufacturer: 'Mitsubishi',
            model: 'NexWay',
            buildingDetailId: buildingDetailS305.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS305 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S305',
            type: 'HVAC',
            manufacturer: 'Trane',
            model: 'Series R',
            buildingDetailId: buildingDetailS305.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S502
    const elevator1S502 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S502',
            type: 'Elevator',
            manufacturer: 'KONE',
            model: 'MonoSpace 700',
            buildingDetailId: buildingDetailS502.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS502 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S502',
            type: 'HVAC',
            manufacturer: 'York',
            model: 'YZ Magnetic Bearing Centrifugal',
            buildingDetailId: buildingDetailS502.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S503
    const elevator1S503 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S503',
            type: 'Elevator',
            manufacturer: 'KONE',
            model: 'MonoSpace 700',
            buildingDetailId: buildingDetailS503.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS503 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S503',
            type: 'HVAC',
            manufacturer: 'York',
            model: 'YZ Magnetic Bearing Centrifugal',
            buildingDetailId: buildingDetailS503.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S602
    const elevator1S602 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S602',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-6000',
            buildingDetailId: buildingDetailS602.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS602 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S602',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV IV',
            buildingDetailId: buildingDetailS602.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S603
    const elevator1S603 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S603',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-6000',
            buildingDetailId: buildingDetailS603.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS603 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S603',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV IV',
            buildingDetailId: buildingDetailS603.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S605
    const elevator1S605 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S605',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-6000',
            buildingDetailId: buildingDetailS605.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS605 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S605',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV IV',
            buildingDetailId: buildingDetailS605.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S606
    const elevator1S606 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S606',
            type: 'Elevator',
            manufacturer: 'Schindler',
            model: 'SV-6000',
            buildingDetailId: buildingDetailS606.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS606 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S606',
            type: 'HVAC',
            manufacturer: 'Daikin',
            model: 'VRV IV',
            buildingDetailId: buildingDetailS606.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S702
    const elevator1S702 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S702',
            type: 'Elevator',
            manufacturer: 'ThyssenKrupp',
            model: 'Evolution',
            buildingDetailId: buildingDetailS702.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS702 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S702',
            type: 'HVAC',
            manufacturer: 'Mitsubishi Electric',
            model: 'City Multi',
            buildingDetailId: buildingDetailS702.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S703
    const elevator1S703 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S703',
            type: 'Elevator',
            manufacturer: 'ThyssenKrupp',
            model: 'Evolution',
            buildingDetailId: buildingDetailS703.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS703 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S703',
            type: 'HVAC',
            manufacturer: 'Mitsubishi Electric',
            model: 'City Multi',
            buildingDetailId: buildingDetailS703.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S705
    const elevator1S705 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S705',
            type: 'Elevator',
            manufacturer: 'ThyssenKrupp',
            model: 'Evolution',
            buildingDetailId: buildingDetailS705.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS705 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S705',
            type: 'HVAC',
            manufacturer: 'Mitsubishi Electric',
            model: 'City Multi',
            buildingDetailId: buildingDetailS705.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S802
    const elevator1S802 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S802',
            type: 'Elevator',
            manufacturer: 'Fujitec',
            model: 'GLVF-II',
            buildingDetailId: buildingDetailS802.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS802 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S802',
            type: 'HVAC',
            manufacturer: 'Hitachi',
            model: 'Set-Free',
            buildingDetailId: buildingDetailS802.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S803
    const elevator1S803 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S803',
            type: 'Elevator',
            manufacturer: 'Fujitec',
            model: 'GLVF-II',
            buildingDetailId: buildingDetailS803.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS803 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S803',
            type: 'HVAC',
            manufacturer: 'Hitachi',
            model: 'Set-Free',
            buildingDetailId: buildingDetailS803.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S902
    const elevator1S902 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S902',
            type: 'Elevator',
            manufacturer: 'Hyundai',
            model: 'LUXEN',
            buildingDetailId: buildingDetailS902.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS902 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S902',
            type: 'HVAC',
            manufacturer: 'LG',
            model: 'Multi V 5',
            buildingDetailId: buildingDetailS902.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S903
    const elevator1S903 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S903',
            type: 'Elevator',
            manufacturer: 'Hyundai',
            model: 'LUXEN',
            buildingDetailId: buildingDetailS903.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS903 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S903',
            type: 'HVAC',
            manufacturer: 'LG',
            model: 'Multi V 5',
            buildingDetailId: buildingDetailS903.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S1002
    const elevator1S1002 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S1002',
            type: 'Elevator',
            manufacturer: 'Toshiba',
            model: 'SPACEL-UNI',
            buildingDetailId: buildingDetailS1002.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS1002 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S1002',
            type: 'HVAC',
            manufacturer: 'Gree',
            model: 'GMV6',
            buildingDetailId: buildingDetailS1002.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S1003
    const elevator1S1003 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S1003',
            type: 'Elevator',
            manufacturer: 'Toshiba',
            model: 'SPACEL-UNI',
            buildingDetailId: buildingDetailS1003.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS1003 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S1003',
            type: 'HVAC',
            manufacturer: 'Gree',
            model: 'GMV6',
            buildingDetailId: buildingDetailS1003.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S1005
    const elevator1S1005 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S1005',
            type: 'Elevator',
            manufacturer: 'Sigma',
            model: 'IRIS',
            buildingDetailId: buildingDetailS1005.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS1005 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S1005',
            type: 'HVAC',
            manufacturer: 'Mitsubishi',
            model: 'VRF System',
            buildingDetailId: buildingDetailS1005.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // S1007
    const elevator1S1007 = await prisma.device.create({
        data: {
            name: 'Thang máy 1 - S1007',
            type: 'Elevator',
            manufacturer: 'Sigma',
            model: 'IRIS',
            buildingDetailId: buildingDetailS1007.buildingDetailId,
            contract_id: elevatorContract.contract_id
        }
    });

    const hvacS1007 = await prisma.device.create({
        data: {
            name: 'Hệ thống điều hòa - S1007',
            type: 'HVAC',
            manufacturer: 'Mitsubishi',
            model: 'VRF System',
            buildingDetailId: buildingDetailS1007.buildingDetailId,
            contract_id: hvacContract.contract_id
        }
    });

    // Additional devices with different types to cover all DeviceType enum values

    // FireProtection devices
    const fireSystemS101 = await prisma.device.create({
        data: {
            name: 'Hệ thống phòng cháy chữa cháy - S101',
            type: 'FireProtection',
            manufacturer: 'Johnson Controls',
            model: 'FireClass Series',
            buildingDetailId: buildingDetailS101.buildingDetailId,
            contract_id: fireProtectionContract.contract_id
        }
    });

    const fireSystemS201 = await prisma.device.create({
        data: {
            name: 'Hệ thống phòng cháy chữa cháy - S201',
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
            name: 'Máy phát điện khẩn cấp - S301',
            type: 'Generator',
            manufacturer: 'Caterpillar',
            model: 'C15 ACERT',
            buildingDetailId: buildingDetailS301.buildingDetailId,
            contract_id: generatorContract.contract_id
        }
    });

    const generatorS601 = await prisma.device.create({
        data: {
            name: 'Máy phát điện dự phòng - S601',
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
            name: 'Chiếu sáng khu vực chung - S701',
            type: 'Lighting',
            manufacturer: 'Philips',
            model: 'LED SmartControl',
            buildingDetailId: buildingDetailS701.buildingDetailId,
            contract_id: lightingContract.contract_id
        }
    });

    const lightingS801 = await prisma.device.create({
        data: {
            name: 'Chiếu sáng khẩn cấp - S801',
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
            name: 'Cổng bãi đỗ xe - S901',
            type: 'AutomaticDoor',
            manufacturer: 'FAAC',
            model: '640 Barrier',
            buildingDetailId: buildingDetailS901.buildingDetailId,
            contract_id: automaticDoorContract.contract_id
        }
    });

    const autoDoorsS1001 = await prisma.device.create({
        data: {
            name: 'Cửa tự động sảnh - S1001',
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
            name: 'Bình chữa cháy di động - S102',
            type: 'FireExtinguisher',
            manufacturer: 'Amerex',
            model: 'B456 ABC Dry Chemical',
            buildingDetailId: buildingDetailS102.buildingDetailId,
            contract_id: fireExtinguisherContract.contract_id
        }
    });

    const fireExtS202 = await prisma.device.create({
        data: {
            name: 'Hệ thống bình chữa cháy cố định - S202',
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
            name: 'Tấm pin năng lượng mặt trời trên mái - S302',
            type: 'Other',
            manufacturer: 'SunPower',
            model: 'Maxeon 5 AC',
            buildingDetailId: buildingDetailS302.buildingDetailId,
            contract_id: otherEquipmentContract.contract_id
        }
    });

    const irrigationS503 = await prisma.device.create({
        data: {
            name: 'Hệ thống tưới tiêu cảnh quan - S503',
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
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-07-10')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator2S101.device_id,
            file_name: 'elevator2_S101_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-07-11')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS101.device_id,
            file_name: 'hvac_S101_maintenance_guide.pdf',
            file_type: 'Hướng dẫn bảo trì',
            upload_date: new Date('2021-07-12')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireAlarmS101.device_id,
            file_name: 'fire_alarm_S101_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-07-13')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: waterPumpS101.device_id,
            file_name: 'water_pump_S101_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-07-14')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: cctvS101.device_id,
            file_name: 'cctv_S101_installation_guide.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-07-15')
        }
    });

    // S102 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S102.device_id,
            file_name: 'elevator1_S102_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-07-16')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator2S102.device_id,
            file_name: 'elevator2_S102_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-07-17')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS102.device_id,
            file_name: 'hvac_S102_maintenance_guide.pdf',
            file_type: 'Hướng dẫn bảo trì',
            upload_date: new Date('2021-08-15')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireAlarmS102.device_id,
            file_name: 'fire_alarm_S102_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-08-16')
        }
    });

    // S201 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S201.device_id,
            file_name: 'elevator1_S201_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-08-17')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator2S201.device_id,
            file_name: 'elevator2_S201_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-08-18')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS201.device_id,
            file_name: 'hvac_S201_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-08-19')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: electricalS201.device_id,
            file_name: 'electrical_S201_wiring_diagram.pdf',
            file_type: 'Sơ đồ đấu dây',
            upload_date: new Date('2021-08-20')
        }
    });

    // S301 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S301.device_id,
            file_name: 'elevator1_S301_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-08-21')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS301.device_id,
            file_name: 'hvac_S301_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-08-22')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: waterTankS301.device_id,
            file_name: 'water_tank_S301_installation_guide.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-08-23')
        }
    });

    // S501 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S501.device_id,
            file_name: 'elevator1_S501_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-08-24')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS501.device_id,
            file_name: 'hvac_S501_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-08-25')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: generatorS501.device_id,
            file_name: 'generator_S501_service_manual.pdf',
            file_type: 'Hướng dẫn sửa chữa',
            upload_date: new Date('2021-08-26')
        }
    });

    // S601 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S601.device_id,
            file_name: 'elevator1_S601_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-10-05')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator2S601.device_id,
            file_name: 'elevator2_S601_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-09-01')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS601.device_id,
            file_name: 'hvac_S601_installation_guide.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-09-02')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: securityGateS601.device_id,
            file_name: 'security_gate_S601_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-09-03')
        }
    });

    // S701 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S701.device_id,
            file_name: 'elevator1_S701_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-09-04')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS701.device_id,
            file_name: 'hvac_S701_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-09-05')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: plumbingS701.device_id,
            file_name: 'plumbing_S701_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-09-06')
        }
    });

    // S801 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S801.device_id,
            file_name: 'elevator1_S801_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-09-07')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS801.device_id,
            file_name: 'hvac_S801_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-09-08')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: electricalS801.device_id,
            file_name: 'electrical_S801_circuit_diagram.pdf',
            file_type: 'Sơ đồ mạch điện',
            upload_date: new Date('2021-09-09')
        }
    });

    // S901 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S901.device_id,
            file_name: 'elevator1_S901_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-09-10')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS901.device_id,
            file_name: 'hvac_S901_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-09-11')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: securityS901.device_id,
            file_name: 'security_S901_installation_guide.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-09-12')
        }
    });

    // S1001 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S1001.device_id,
            file_name: 'elevator1_S1001_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-09-13')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS1001.device_id,
            file_name: 'hvac_S1001_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-09-14')
        }
    });

    // S1006 devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S1006.device_id,
            file_name: 'elevator1_S1006_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-09-15')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS1006.device_id,
            file_name: 'hvac_S1006_maintenance_guide.pdf',
            file_type: 'Hướng dẫn bảo trì',
            upload_date: new Date('2021-09-16')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireSprinklerS1006.device_id,
            file_name: 'fire_sprinkler_S1006_installation_diagram.pdf',
            file_type: 'Sơ đồ lắp đặt',
            upload_date: new Date('2021-09-17')
        }
    });

    // Technical records for remaining buildings
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S103.device_id,
            file_name: 'elevator1_S103_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-09-18')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS103.device_id,
            file_name: 'hvac_S103_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-09-19')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S105.device_id,
            file_name: 'elevator1_S105_maintenance_guide.pdf',
            file_type: 'Hướng dẫn bảo trì',
            upload_date: new Date('2021-09-20')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS105.device_id,
            file_name: 'hvac_S105_commissioning_report.pdf',
            file_type: 'Báo cáo đưa vào vận hành',
            upload_date: new Date('2021-09-21')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S106.device_id,
            file_name: 'elevator1_S106_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-09-22')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS106.device_id,
            file_name: 'hvac_S106_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-09-23')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S107.device_id,
            file_name: 'elevator1_S107_safety_compliance.pdf',
            file_type: 'Bảo đảm an toàn',
            upload_date: new Date('2021-09-24')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS107.device_id,
            file_name: 'hvac_S107_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-09-25')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: waterPumpS107.device_id,
            file_name: 'water_pump_S107_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-09-26')
        }
    });

    // Technical records for additional device types
    await prisma.technicalRecord.create({
        data: {
            device_id: fireSystemS101.device_id,
            file_name: 'fire_system_S101_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-09-27')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireSystemS201.device_id,
            file_name: 'fire_system_S201_installation_guide.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-09-28')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: generatorS301.device_id,
            file_name: 'generator_S301_operation_manual.pdf',
            file_type: 'Hướng dẫn vận hành',
            upload_date: new Date('2021-09-29')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: generatorS601.device_id,
            file_name: 'generator_S601_maintenance_schedule.pdf',
            file_type: 'Lịch bảo trì',
            upload_date: new Date('2021-09-30')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: lightingS701.device_id,
            file_name: 'lighting_S701_specification_sheet.pdf',
            file_type: 'Bảng thông số kỹ thuật',
            upload_date: new Date('2021-10-01')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: lightingS801.device_id,
            file_name: 'lighting_S801_emergency_compliance.pdf',
            file_type: 'Chứng nhận đạt tiêu chuẩn',
            upload_date: new Date('2021-10-02')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: autoGateS901.device_id,
            file_name: 'gate_S901_user_guide.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-10-03')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: autoDoorsS1001.device_id,
            file_name: 'doors_S1001_installation_manual.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-10-04')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireExtS102.device_id,
            file_name: 'fire_ext_S102_inspection_requirements.pdf',
            file_type: 'Yêu cầu kiểm tra',
            upload_date: new Date('2021-10-05')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: fireExtS202.device_id,
            file_name: 'fire_ext_S202_technical_manual.pdf',
            file_type: 'Hướng dẫn kỹ thuật',
            upload_date: new Date('2021-10-06')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: solarPanelS302.device_id,
            file_name: 'solar_S302_installation_manual.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-10-07')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: irrigationS503.device_id,
            file_name: 'irrigation_S503_operator_manual.pdf',
            file_type: 'Hướng dẫn vận hành',
            upload_date: new Date('2021-10-08')
        }
    });

    console.log('Seeding maintenance history...');
    // Seed Maintenance History for S1 cluster devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S101.device_id,
            date_performed: new Date('2022-01-15'),
            description: 'Kiểm tra bảo trì định kỳ hàng quý',
            cost: 1500.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator2S101.device_id,
            date_performed: new Date('2022-01-20'),
            description: 'Kiểm tra an toàn định kỳ hàng tháng',
            cost: 800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS101.device_id,
            date_performed: new Date('2022-01-25'),
            description: 'Vệ sinh bộ lọc và kiểm tra toàn bộ hệ thống',
            cost: 600.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireAlarmS101.device_id,
            date_performed: new Date('2022-02-01'),
            description: 'Chứng nhận an toàn phòng cháy hàng năm',
            cost: 1200.00
        }
    });

    // S102 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS102.device_id,
            date_performed: new Date('2022-02-20'),
            description: 'Thay bộ lọc và kiểm tra hệ thống',
            cost: 800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S102.device_id,
            date_performed: new Date('2022-02-22'),
            description: 'Kiểm tra cáp và bôi trơn',
            cost: 950.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator2S102.device_id,
            date_performed: new Date('2022-02-25'),
            description: 'Điều chỉnh cơ chế cửa',
            cost: 650.00
        }
    });

    // S201 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S201.device_id,
            date_performed: new Date('2022-03-05'),
            description: 'Kiểm tra và bảo trì hệ thống phanh khẩn cấp',
            cost: 1100.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS201.device_id,
            date_performed: new Date('2022-03-10'),
            description: 'Vệ sinh dàn ngưng tụ và kiểm tra hệ thống làm lạnh',
            cost: 750.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: electricalS201.device_id,
            date_performed: new Date('2022-03-15'),
            description: 'Kiểm tra toàn diện hệ thống điện và bảo trì tủ điện',
            cost: 900.00
        }
    });

    // S601 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S601.device_id,
            date_performed: new Date('2022-04-10'),
            description: 'Kiểm định an toàn định kỳ hàng năm',
            cost: 2000.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator2S601.device_id,
            date_performed: new Date('2022-04-12'),
            description: 'Bảo trì hệ thống động cơ và hệ thống ròng rọc',
            cost: 1800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS601.device_id,
            date_performed: new Date('2022-04-15'),
            description: 'Kiểm tra hiệu suất và vệ sinh định kỳ hàng quý',
            cost: 700.00
        }
    });

    // S701 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S701.device_id,
            date_performed: new Date('2022-04-20'),
            description: 'Cập nhật phần mềm điều khiển và kiểm tra hệ thống',
            cost: 1500.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS701.device_id,
            date_performed: new Date('2022-04-25'),
            description: 'Kiểm tra máy nén và thay thế dây đai quạt gió',
            cost: 900.00
        }
    });

    // S801 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S801.device_id,
            date_performed: new Date('2022-05-05'),
            description: 'Bảo trì tổng thể định kỳ 6 tháng',
            cost: 2500.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: electricalS801.device_id,
            date_performed: new Date('2022-05-10'),
            description: 'Vệ sinh và kiểm tra tủ điện chính',
            cost: 1200.00
        }
    });

    // S901 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S901.device_id,
            date_performed: new Date('2022-05-15'),
            description: 'Hiệu chỉnh cảm biến cửa và kiểm tra hệ thống an toàn',
            cost: 850.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: securityS901.device_id,
            date_performed: new Date('2022-05-20'),
            description: 'Cập nhật phần mềm an ninh và điều chỉnh camera',
            cost: 650.00
        }
    });

    // S1001 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S1001.device_id,
            date_performed: new Date('2022-06-05'),
            description: 'Kiểm tra và điều chỉnh bộ điều tốc',
            cost: 1150.00
        }
    });

    // S1006 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS1006.device_id,
            date_performed: new Date('2022-06-10'),
            description: 'Bảo trì định kỳ hàng năm và tối ưu hóa hiệu suất',
            cost: 1300.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireSprinklerS1006.device_id,
            date_performed: new Date('2022-06-15'),
            description: 'Kiểm tra đầu phun sprinkler và thử nghiệm dòng chảy',
            cost: 950.00
        }
    });

    // S103, S105, S106, S107 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S103.device_id,
            date_performed: new Date('2022-06-20'),
            description: 'Bảo trì phòng ngừa hàng tháng',
            cost: 750.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS105.device_id,
            date_performed: new Date('2022-06-25'),
            description: 'Bảo trì theo mùa và thay thế bộ lọc',
            cost: 800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S106.device_id,
            date_performed: new Date('2022-07-05'),
            description: 'Bảo trì máy kéo',
            cost: 1350.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: waterPumpS107.device_id,
            date_performed: new Date('2022-07-10'),
            description: 'Kiểm tra và thay thế bộ lọc hệ thống bơm',
            cost: 900.00
        }
    });

    // Maintenance history for additional device types
    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireSystemS101.device_id,
            date_performed: new Date('2022-07-15'),
            description: 'Chứng nhận và kiểm tra hệ thống chữa cháy',
            cost: 2200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireSystemS201.device_id,
            date_performed: new Date('2022-07-20'),
            description: 'Hiệu chỉnh cảm biến phát hiện cháy',
            cost: 1800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: generatorS301.device_id,
            date_performed: new Date('2022-07-25'),
            description: 'Kiểm tra tải và thay dầu',
            cost: 1500.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: generatorS601.device_id,
            date_performed: new Date('2022-08-01'),
            description: 'Vệ sinh và kiểm tra hệ thống nhiên liệu',
            cost: 1200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: lightingS701.device_id,
            date_performed: new Date('2022-08-05'),
            description: 'Thay thế bộ điều khiển LED và vệ sinh bộ đèn',
            cost: 850.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: lightingS801.device_id,
            date_performed: new Date('2022-08-10'),
            description: 'Thay thế bộ nạp pin cho đèn khẩn cấp',
            cost: 950.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: autoGateS901.device_id,
            date_performed: new Date('2022-08-15'),
            description: 'Hiệu chỉnh động cơ và cảm biến',
            cost: 750.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: autoDoorsS1001.device_id,
            date_performed: new Date('2022-08-20'),
            description: 'Bôi trơn và vệ sinh đường ray',
            cost: 600.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireExtS102.device_id,
            date_performed: new Date('2022-08-25'),
            description: 'Kiểm tra và chứng nhận bình chữa cháy hàng năm',
            cost: 1200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireExtS202.device_id,
            date_performed: new Date('2022-09-01'),
            description: 'Kiểm tra và chứng nhận hệ thống khí bảo vệ',
            cost: 1600.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: solarPanelS302.device_id,
            date_performed: new Date('2022-09-05'),
            description: 'Vệ sinh và kiểm tra kết nối',
            cost: 900.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: irrigationS503.device_id,
            date_performed: new Date('2022-09-10'),
            description: 'Bảo trì hệ thống tưới phun hàng năm',
            cost: 750.00
        }
    });

    // Additional maintenance history for newer devices
    // S202, S203, S205 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S202.device_id,
            date_performed: new Date('2022-09-15'),
            description: 'Kiểm tra và bảo trì định kỳ và kiểm tra an toàn',
            cost: 1200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS202.device_id,
            date_performed: new Date('2022-09-18'),
            description: 'Kiểm tra áp suất và vệ sinh bộ lọc',
            cost: 850.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S203.device_id,
            date_performed: new Date('2022-09-20'),
            description: 'Cập nhật bảng điều khiển và kiểm tra hệ thống',
            cost: 1750.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS203.device_id,
            date_performed: new Date('2022-09-22'),
            description: 'Kiểm tra và hiệu chỉnh bộ nén và cảm biến',
            cost: 920.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S205.device_id,
            date_performed: new Date('2022-09-25'),
            description: 'Bảo trì hệ thống phanh và hiệu chỉnh cửa',
            cost: 1350.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS205.device_id,
            date_performed: new Date('2022-09-28'),
            description: 'Vệ sinh và tối ưu hóa hệ thống',
            cost: 780.00
        }
    });

    // S302, S303, S305 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S302.device_id,
            date_performed: new Date('2022-10-01'),
            description: 'Điều chỉnh độ căng dây và bôi trơn',
            cost: 950.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS302.device_id,
            date_performed: new Date('2022-10-03'),
            description: 'Kiểm tra và bảo trì hệ thống',
            cost: 820.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S303.device_id,
            date_performed: new Date('2022-10-05'),
            description: 'Bảo trì hệ thống ròng rọc và kiểm tra an toàn',
            cost: 1050.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS303.device_id,
            date_performed: new Date('2022-10-08'),
            description: 'Vệ sinh và kiểm tra chất lượng không khí',
            cost: 1200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S305.device_id,
            date_performed: new Date('2022-10-10'),
            description: 'Kiểm tra và hiệu chỉnh hệ thống',
            cost: 1150.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS305.device_id,
            date_performed: new Date('2022-10-12'),
            description: 'Kiểm tra và vệ sinh hệ thống trao đổi nhiệt',
            cost: 880.00
        }
    });

    // S502, S503 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S502.device_id,
            date_performed: new Date('2022-10-15'),
            description: 'Bảo trì định kỳ',
            cost: 1100.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS502.device_id,
            date_performed: new Date('2022-10-18'),
            description: 'Cập nhật phần mềm và kiểm tra hiệu suất',
            cost: 900.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S503.device_id,
            date_performed: new Date('2022-10-20'),
            description: 'Chứng nhận và kiểm tra an toàn',
            cost: 1500.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS503.device_id,
            date_performed: new Date('2022-10-22'),
            description: 'Bảo trì tháp làm mát và xử lý nước',
            cost: 1250.00
        }
    });

    // S602, S603, S605, S606 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S602.device_id,
            date_performed: new Date('2022-10-25'),
            description: 'Kiểm tra và bảo trì hệ thống điện thoại khẩn cấp',
            cost: 700.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS602.device_id,
            date_performed: new Date('2022-10-28'),
            description: 'Kiểm tra và sửa chữa rò rỉ dầu',
            cost: 1100.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S603.device_id,
            date_performed: new Date('2022-11-01'),
            description: 'Bảo trì và hiệu chỉnh cửa',
            cost: 850.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS603.device_id,
            date_performed: new Date('2022-11-03'),
            description: 'Thay thế bảng điều khiển và hiệu chỉnh hệ thống',
            cost: 1350.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S605.device_id,
            date_performed: new Date('2022-11-05'),
            description: 'Thay thế bánh phanh và kiểm tra',
            cost: 1200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS605.device_id,
            date_performed: new Date('2022-11-08'),
            description: 'Bảo trì định kỳ và thay bộ lọc',
            cost: 850.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S606.device_id,
            date_performed: new Date('2022-11-10'),
            description: 'Thay thế ổ trục và bôi trơn',
            cost: 1400.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS606.device_id,
            date_performed: new Date('2022-11-12'),
            description: 'Điều chỉnh van mở rộng và bổ sung chất làm mát',
            cost: 780.00
        }
    });

    // S702, S703, S705 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S702.device_id,
            date_performed: new Date('2022-11-15'),
            description: 'Kiểm tra và cập nhật hệ thống',
            cost: 900.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS702.device_id,
            date_performed: new Date('2022-11-18'),
            description: 'Bảo trì hàng năm và hiệu chỉnh hệ thống',
            cost: 750.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S703.device_id,
            date_performed: new Date('2022-11-20'),
            description: 'Chứng nhận và kiểm tra an toàn',
            cost: 1300.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS703.device_id,
            date_performed: new Date('2022-11-22'),
            description: 'Vệ sinh và kiểm tra áp suất dầu',
            cost: 820.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S705.device_id,
            date_performed: new Date('2022-11-25'),
            description: 'Thay thế dây đai và điều chỉnh độ căng',
            cost: 950.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS705.device_id,
            date_performed: new Date('2022-11-28'),
            description: 'Bảo trì quạt tháp làm mát và bôi trơn',
            cost: 680.00
        }
    });

    // S802, S803 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S802.device_id,
            date_performed: new Date('2022-12-01'),
            description: 'Kiểm tra và chứng nhận an toàn hàng năm',
            cost: 1500.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS802.device_id,
            date_performed: new Date('2022-12-03'),
            description: 'Bảo trì hệ thống sưởi hàng năm',
            cost: 920.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S803.device_id,
            date_performed: new Date('2022-12-05'),
            description: 'Kiểm tra và điều chỉnh hệ thống cân bằng',
            cost: 1150.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS803.device_id,
            date_performed: new Date('2022-12-08'),
            description: 'Hiệu chỉnh cảm biến và kiểm tra vùng điều khiển',
            cost: 750.00
        }
    });

    // S902, S903 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S902.device_id,
            date_performed: new Date('2022-12-10'),
            description: 'Bảo trì và kiểm tra tháng',
            cost: 800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS902.device_id,
            date_performed: new Date('2022-12-12'),
            description: 'Chuẩn bị hệ thống sưởi hàng năm và điều chỉnh độ ẩm',
            cost: 950.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S903.device_id,
            date_performed: new Date('2022-12-15'),
            description: 'Đồng bộ cửa và hiệu chỉnh cảm biến',
            cost: 720.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS903.device_id,
            date_performed: new Date('2022-12-18'),
            description: 'Thay thế bộ lọc không khí và kiểm tra hệ thống',
            cost: 680.00
        }
    });

    // S1002, S1003, S1005, S1007 devices
    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S1002.device_id,
            date_performed: new Date('2022-12-20'),
            description: 'Kiểm tra và điều chỉnh độ căng dây',
            cost: 850.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS1002.device_id,
            date_performed: new Date('2022-12-22'),
            description: 'Kiểm tra và điều chỉnh hệ thống bơm nhiệt hàng năm',
            cost: 780.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S1003.device_id,
            date_performed: new Date('2022-12-25'),
            description: 'Bảo trì định kỳ và kiểm tra an toàn',
            cost: 1050.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS1003.device_id,
            date_performed: new Date('2022-12-28'),
            description: 'Kiểm tra và tối ưu hóa hiệu suất hệ thống',
            cost: 850.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S1005.device_id,
            date_performed: new Date('2023-01-02'),
            description: 'Kiểm tra và chứng nhận lại hàng năm',
            cost: 1600.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS1005.device_id,
            date_performed: new Date('2023-01-05'),
            description: 'Bảo trì và kiểm tra hiệu suất',
            cost: 920.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S1007.device_id,
            date_performed: new Date('2023-01-08'),
            description: 'Hiệu chỉnh ray dẫn và bôi trơn',
            cost: 1250.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS1007.device_id,
            date_performed: new Date('2023-01-10'),
            description: 'Cập nhật hệ thống và hiệu chỉnh cảm biến',
            cost: 780.00
        }
    });

    // Second maintenance history record for devices that only have one
    await prisma.maintenanceHistory.create({
        data: {
            device_id: waterPumpS101.device_id,
            date_performed: new Date('2023-01-15'),
            description: 'Kiểm tra và thay thế bánh công tác',
            cost: 1050.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: cctvS101.device_id,
            date_performed: new Date('2023-01-18'),
            description: 'Hiệu chỉnh và cập nhật hệ thống ghi hình',
            cost: 1200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: fireAlarmS102.device_id,
            date_performed: new Date('2023-01-20'),
            description: 'Kiểm tra và kiểm tra bảng điều khiển',
            cost: 950.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator2S201.device_id,
            date_performed: new Date('2023-01-22'),
            description: 'Kiểm tra và điều chỉnh hệ thống an toàn và cơ cấu cửa',
            cost: 1150.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS301.device_id,
            date_performed: new Date('2023-01-25'),
            description: 'Bảo trì hàng năm và hiệu chỉnh cảm biến',
            cost: 780.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: waterTankS301.device_id,
            date_performed: new Date('2023-01-28'),
            description: 'Kiểm tra chất lượng nước và bảo trì van',
            cost: 850.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS501.device_id,
            date_performed: new Date('2023-02-01'),
            description: 'Thay thế bộ lọc và bảo trì hệ thống xử lý không khí',
            cost: 720.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: generatorS501.device_id,
            date_performed: new Date('2023-02-03'),
            description: 'Vệ sinh hệ thống nhiên liệu và kiểm tra công suất',
            cost: 1800.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: securityGateS601.device_id,
            date_performed: new Date('2023-02-05'),
            description: 'Cập nhật hệ thống kiểm soát truy cập và hiệu chỉnh cảm biến',
            cost: 1050.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: plumbingS701.device_id,
            date_performed: new Date('2023-02-08'),
            description: 'Kiểm tra áp suất và kiểm tra kết nối',
            cost: 920.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS801.device_id,
            date_performed: new Date('2023-02-10'),
            description: 'Kiểm tra phần tử sưởi và hiệu chỉnh cảm biến',
            cost: 850.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS901.device_id,
            date_performed: new Date('2023-02-12'),
            description: 'Kiểm tra mức dầu và tối ưu hóa hệ thống',
            cost: 780.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS1001.device_id,
            date_performed: new Date('2023-02-15'),
            description: 'Bảo trì hàng năm và thay thế bộ lọc',
            cost: 820.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS103.device_id,
            date_performed: new Date('2023-02-18'),
            description: 'Kiểm tra và tối ưu hóa hiệu suất hệ thống',
            cost: 750.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: elevator1S105.device_id,
            date_performed: new Date('2023-02-20'),
            description: 'Kiểm tra định kỳ và chứng nhận an toàn',
            cost: 1200.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS106.device_id,
            date_performed: new Date('2023-02-22'),
            description: 'Vệ sinh tháp làm mát và kiểm tra áp suất hệ thống',
            cost: 880.00
        }
    });

    await prisma.maintenanceHistory.create({
        data: {
            device_id: hvacS107.device_id,
            date_performed: new Date('2023-02-25'),
            description: 'Thay thế bộ lọc không khí và vệ sinh hệ thống',
            cost: 920.00
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: irrigationS503.device_id,
            file_name: 'irrigation_S503_operator_manual.pdf',
            file_type: 'Hướng dẫn vận hành',
            upload_date: new Date('2021-10-08')
        }
    });

    // Technical records for remaining devices
    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S202.device_id,
            file_name: 'elevator1_S202_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-10-10')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS202.device_id,
            file_name: 'hvac_S202_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-10-11')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S203.device_id,
            file_name: 'elevator1_S203_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-10-12')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS203.device_id,
            file_name: 'hvac_S203_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-10-13')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S205.device_id,
            file_name: 'elevator1_S205_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-10-14')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS205.device_id,
            file_name: 'hvac_S205_user_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-10-15')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S302.device_id,
            file_name: 'elevator1_S302_installation_guide.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-10-16')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS302.device_id,
            file_name: 'hvac_S302_service_manual.pdf',
            file_type: 'Hướng dẫn bảo trì',
            upload_date: new Date('2021-10-17')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S303.device_id,
            file_name: 'elevator1_S303_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-10-18')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS303.device_id,
            file_name: 'hvac_S303_user_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-10-19')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S305.device_id,
            file_name: 'elevator1_S305_operation_guide.pdf',
            file_type: 'Hướng dẫn vận hành',
            upload_date: new Date('2021-10-20')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS305.device_id,
            file_name: 'hvac_S305_circuit_diagram.pdf',
            file_type: 'Sơ đồ mạch điện',
            upload_date: new Date('2021-10-21')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S502.device_id,
            file_name: 'elevator1_S502_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-10-22')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS502.device_id,
            file_name: 'hvac_S502_maintenance_guide.pdf',
            file_type: 'Hướng dẫn bảo trì',
            upload_date: new Date('2021-10-23')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S503.device_id,
            file_name: 'elevator1_S503_user_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-10-24')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS503.device_id,
            file_name: 'hvac_S503_installation_guide.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-10-25')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S602.device_id,
            file_name: 'elevator1_S602_user_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-10-26')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS602.device_id,
            file_name: 'hvac_S602_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-10-27')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S603.device_id,
            file_name: 'elevator1_S603_maintenance_guide.pdf',
            file_type: 'Hướng dẫn bảo trì',
            upload_date: new Date('2021-10-28')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS603.device_id,
            file_name: 'hvac_S603_user_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-10-29')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S605.device_id,
            file_name: 'elevator1_S605_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-10-30')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS605.device_id,
            file_name: 'hvac_S605_installation_guide.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-10-31')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S606.device_id,
            file_name: 'elevator1_S606_safety_manual.pdf',
            file_type: 'Hướng dẫn an toàn',
            upload_date: new Date('2021-11-01')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS606.device_id,
            file_name: 'hvac_S606_technical_guide.pdf',
            file_type: 'Hướng dẫn kỹ thuật',
            upload_date: new Date('2021-11-02')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S702.device_id,
            file_name: 'elevator1_S702_user_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-11-03')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS702.device_id,
            file_name: 'hvac_S702_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-11-04')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S703.device_id,
            file_name: 'elevator1_S703_installation_guide.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-11-05')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS703.device_id,
            file_name: 'hvac_S703_operation_manual.pdf',
            file_type: 'Hướng dẫn vận hành',
            upload_date: new Date('2021-11-06')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S705.device_id,
            file_name: 'elevator1_S705_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-11-07')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS705.device_id,
            file_name: 'hvac_S705_service_guide.pdf',
            file_type: 'Hướng dẫn bảo trì',
            upload_date: new Date('2021-11-08')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S802.device_id,
            file_name: 'elevator1_S802_user_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-11-09')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS802.device_id,
            file_name: 'hvac_S802_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-11-10')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S803.device_id,
            file_name: 'elevator1_S803_maintenance_guide.pdf',
            file_type: 'Hướng dẫn bảo trì',
            upload_date: new Date('2021-11-11')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS803.device_id,
            file_name: 'hvac_S803_technical_manual.pdf',
            file_type: 'Hướng dẫn kỹ thuật',
            upload_date: new Date('2021-11-12')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S902.device_id,
            file_name: 'elevator1_S902_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-11-13')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS902.device_id,
            file_name: 'hvac_S902_user_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-11-14')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S903.device_id,
            file_name: 'elevator1_S903_installation_guide.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-11-15')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS903.device_id,
            file_name: 'hvac_S903_maintenance_schedule.pdf',
            file_type: 'Lịch bảo trì',
            upload_date: new Date('2021-11-16')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S1002.device_id,
            file_name: 'elevator1_S1002_user_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-11-17')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS1002.device_id,
            file_name: 'hvac_S1002_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-11-18')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S1003.device_id,
            file_name: 'elevator1_S1003_service_manual.pdf',
            file_type: 'Hướng dẫn bảo trì',
            upload_date: new Date('2021-11-19')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS1003.device_id,
            file_name: 'hvac_S1003_operation_guide.pdf',
            file_type: 'Hướng dẫn vận hành',
            upload_date: new Date('2021-11-20')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S1005.device_id,
            file_name: 'elevator1_S1005_specifications.pdf',
            file_type: 'Thông số kỹ thuật',
            upload_date: new Date('2021-11-21')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS1005.device_id,
            file_name: 'hvac_S1005_user_manual.pdf',
            file_type: 'Hướng dẫn sử dụng',
            upload_date: new Date('2021-11-22')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: elevator1S1007.device_id,
            file_name: 'elevator1_S1007_installation_guide.pdf',
            file_type: 'Hướng dẫn lắp đặt',
            upload_date: new Date('2021-11-23')
        }
    });

    await prisma.technicalRecord.create({
        data: {
            device_id: hvacS1007.device_id,
            file_name: 'hvac_S1007_maintenance_guide.pdf',
            file_type: 'Hướng dẫn bảo trì',
            upload_date: new Date('2021-11-24')
        }
    });

    console.log('✅ Seed complete');
}

main()
    .catch((e) => console.error('❌ Seed error:', e))
    .finally(async () => {
        await prisma.$disconnect();
    });

