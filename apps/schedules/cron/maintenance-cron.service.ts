import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { $Enums, Frequency, ScheduleJobStatus } from '@prisma/client-schedule';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { NOTIFICATIONS_PATTERN } from '@app/contracts/notifications/notifications.patterns';
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns';
import { TASKS_PATTERN } from '@app/contracts/tasks/task.patterns';

const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';
const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT';
const TASK_CLIENT = 'TASK_CLIENT';

@Injectable()
export class MaintenanceCronService {
    private readonly logger = new Logger(MaintenanceCronService.name);

    constructor(
        private prisma: PrismaService,
        private schedulerRegistry: SchedulerRegistry,
        @Inject(NOTIFICATION_CLIENT) private readonly notificationsClient: ClientProxy,
        @Inject(BUILDINGS_CLIENT) private readonly buildingClient: ClientProxy,
        @Inject(TASK_CLIENT) private readonly taskClient: ClientProxy,
    ) { }

    // Chạy vào 00:00 mỗi ngày để kiểm tra các ScheduleJob cần chuyển sang InProgress
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleActivateMaintenanceJobs() {
        try {
            this.logger.log('Checking for maintenance jobs to activate...');

            // Lấy ngày hiện tại (chỉ lấy phần ngày, không tính giờ)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Tìm các ScheduleJob có run_date là ngày hôm nay và status là Pending
            const jobsToActivate = await this.prisma.scheduleJob.findMany({
                where: {
                    run_date: {
                        gte: today,
                        lt: tomorrow,
                    },
                    status: $Enums.ScheduleJobStatus.Pending,
                },
                include: {
                    schedule: true,
                },
            });

            this.logger.log(`Found ${jobsToActivate.length} jobs to activate`);

            // Cập nhật trạng thái các công việc thành InProgress
            if (jobsToActivate.length > 0) {
                const updatePromises = jobsToActivate.map(async (job) => {
                    await this.prisma.scheduleJob.update({
                        where: { schedule_job_id: job.schedule_job_id },
                        data: { status: $Enums.ScheduleJobStatus.InProgress },
                    });

                    // Tạo task và task assignment tương ứng
                    await this.createTaskAndAssignments(job);

                    // Gửi thông báo cho người dùng (nếu cần)
                    await this.sendMaintenanceNotification(job);
                });

                await Promise.all(updatePromises);
                this.logger.log(`Activated ${jobsToActivate.length} maintenance jobs`);
            }
        } catch (error) {
            this.logger.error('Error activating maintenance jobs:', error);
        }
    }

    // Method để tạo task và task assignment tự động cho các schedule jobs
    private async createTaskAndAssignments(scheduleJob: any): Promise<void> {
        try {
            // 1. Lấy thông tin của building
            const buildingResponse = await firstValueFrom(
                this.buildingClient.send(BUILDINGS_PATTERN.GET_BY_ID, { buildingId: scheduleJob.buildingDetailId })
            );

            if (!buildingResponse?.data) {
                this.logger.error(`Failed to fetch building info for job ${scheduleJob.schedule_job_id}`);
                return;
            }

            const building = buildingResponse.data;

            // 2. Tìm leader của building
            // Sử dụng GET_BY_MANAGER_ID để lấy danh sách quản lý của tòa nhà
            const leadersResponse = await firstValueFrom(
                this.buildingClient.send(BUILDINGS_PATTERN.GET_BY_MANAGER_ID, building.buildingId)
            );

            if (!leadersResponse?.data || leadersResponse.data.length === 0) {
                this.logger.error(`No leaders found for building ${building.buildingId}`);
                return;
            }

            // Lấy leader đầu tiên trong danh sách
            const leader = leadersResponse.data[0];

            // 3. Tạo task mới
            const createTaskResponse = await firstValueFrom(
                this.taskClient.send(TASKS_PATTERN.CREATE, {
                    description: `Bảo trì ${scheduleJob.schedule.schedule_name} cho ${building.name}`,
                    status: 'Pending', // Trạng thái ban đầu
                    schedule_job_id: scheduleJob.schedule_job_id, // Liên kết với schedule job
                })
            );

            if (!createTaskResponse?.isSuccess) {
                this.logger.error(`Failed to create task for schedule job ${scheduleJob.schedule_job_id}`);
                return;
            }

            const task = createTaskResponse.data;

            // 4. Tạo task assignment cho leader
            const createTaskAssignmentResponse = await firstValueFrom(
                this.taskClient.send(TASKS_PATTERN.CREATE_TASK_ASSIGNMENT, {
                    task_id: task.task_id,
                    employee_id: leader.userId, // ID của leader
                    description: `Phân công bảo trì ${scheduleJob.schedule.schedule_name} cho ${building.name}. Yêu cầu kiểm tra và báo cáo sau khi hoàn thành.`,
                    status: 'Assigned', // Trạng thái ban đầu
                })
            );

            if (createTaskAssignmentResponse?.statusCode !== 201) {
                this.logger.error(`Failed to create task assignment for task ${task.task_id}`);
                return;
            }

            this.logger.log(`Successfully created task and assigned to leader for schedule job ${scheduleJob.schedule_job_id}`);

        } catch (error) {
            this.logger.error(`Error creating task and assignment for schedule job ${scheduleJob.schedule_job_id}:`, error);
        }
    }

    // Chạy vào 01:00 mỗi ngày để tạo lịch bảo trì mới cho những công việc đã hoàn thành
    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async handleCreateNextMaintenanceJobs() {
        try {
            this.logger.log('Creating next maintenance jobs for completed jobs...');

            // Tìm các ScheduleJob đã hoàn thành và lịch bảo trì vẫn đang active
            const completedJobs = await this.prisma.scheduleJob.findMany({
                where: {
                    status: $Enums.ScheduleJobStatus.Completed,
                    schedule: {
                        schedule_status: $Enums.ScheduleStatus.InProgress,
                    },
                },
                include: {
                    schedule: {
                        include: {
                            cycle: true,
                        },
                    },
                },
            });

            this.logger.log(`Found ${completedJobs.length} completed jobs to create next cycle`);

            // Tạo công việc bảo trì tiếp theo dựa trên chu kỳ
            for (const job of completedJobs) {
                try {
                    // Tính toán ngày bảo trì tiếp theo dựa trên tần suất của MaintenanceCycle
                    const nextRunDate = this.calculateNextRunDate(job.run_date, job.schedule.cycle.frequency);

                    // Kiểm tra nếu ngày tiếp theo vượt quá end_date của lịch
                    if (job.schedule.end_date && nextRunDate > job.schedule.end_date) {
                        this.logger.log(`Next run date ${nextRunDate} exceeds schedule end date ${job.schedule.end_date} for job ${job.schedule_job_id}`);
                        continue;
                    }

                    // Tạo công việc bảo trì mới
                    const newJob = await this.prisma.scheduleJob.create({
                        data: {
                            schedule_id: job.schedule_id,
                            run_date: nextRunDate,
                            status: $Enums.ScheduleJobStatus.Pending,
                            buildingDetailId: job.buildingDetailId,
                        },
                    });

                    // Cập nhật công việc đã hoàn thành để không tạo thêm lịch mới (đánh dấu đã xử lý)
                    await this.prisma.scheduleJob.update({
                        where: { schedule_job_id: job.schedule_job_id },
                        data: {
                            // Thêm trường meta_data để đánh dấu đã tạo lịch tiếp theo
                            // Hoặc có thể tạo một trường riêng trong schema
                            updated_at: new Date()  // Cập nhật thời gian để đánh dấu đã xử lý
                        },
                    });

                    this.logger.log(`Created next maintenance job ${newJob.schedule_job_id} for schedule ${job.schedule_id} with run date ${nextRunDate}`);
                } catch (error) {
                    this.logger.error(`Error creating next job for completed job ${job.schedule_job_id}:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error creating next maintenance jobs:', error);
        }
    }

    // Cron chạy vào 02:00 mỗi ngày để gửi email nhắc nhở về lịch bảo trì sắp tới
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async sendMaintenanceReminders() {
        try {
            this.logger.log('Sending maintenance reminders...');

            // Lấy ngày hiện tại
            const today = new Date();

            // Tính ngày trong 3 ngày tới
            const threeDaysLater = new Date(today);
            threeDaysLater.setDate(threeDaysLater.getDate() + 3);

            // Tìm các lịch bảo trì sắp đến trong 3 ngày tới
            const upcomingJobs = await this.prisma.scheduleJob.findMany({
                where: {
                    run_date: {
                        gte: today,
                        lte: threeDaysLater,
                    },
                    status: $Enums.ScheduleJobStatus.Pending,
                },
                include: {
                    schedule: true,
                },
            });

            this.logger.log(`Found ${upcomingJobs.length} upcoming jobs to send reminders`);

            // Gửi email nhắc nhở cho từng công việc
            for (const job of upcomingJobs) {
                await this.sendMaintenanceReminder(job);
            }
        } catch (error) {
            this.logger.error('Error sending maintenance reminders:', error);
        }
    }

    // Cron chạy định kỳ để tự động tạo các lịch bảo trì từ MaintenanceCycle
    @Cron(CronExpression.EVERY_WEEK)
    async generateMaintenanceSchedules() {
        try {
            this.logger.log('Generating maintenance schedules from maintenance cycles...');

            // Lấy tất cả các MaintenanceCycle
            const maintenanceCycles = await this.prisma.maintenanceCycle.findMany();

            this.logger.log(`Found ${maintenanceCycles.length} maintenance cycles`);

            // Lấy tất cả các tòa nhà cần bảo trì
            const buildingsResponse = await firstValueFrom(
                this.buildingClient.send(BUILDINGS_PATTERN.GET, {})
            );

            if (!buildingsResponse || !buildingsResponse.data) {
                this.logger.error('Failed to fetch buildings');
                return;
            }

            const buildings = buildingsResponse.data;

            // Duyệt từng MaintenanceCycle để tạo lịch bảo trì
            for (const cycle of maintenanceCycles) {
                try {
                    // Kiểm tra xem đã có lịch bảo trì gần đây cho cycle này chưa
                    const scheduleCount = await this.prisma.schedule.count({
                        where: {
                            cycle_id: cycle.cycle_id,
                            created_at: {
                                gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Trong 30 ngày gần đây
                            },
                        },
                    });

                    // Nếu đã có lịch trong 30 ngày qua, bỏ qua
                    if (scheduleCount > 0) {
                        this.logger.log(`Schedule for cycle ${cycle.cycle_id} already exists within last 30 days, skipping...`);
                        continue;
                    }

                    // Tính toán ngày bắt đầu và kết thúc dựa trên tần suất
                    const now = new Date();
                    let endDate = new Date(now);

                    switch (cycle.frequency) {
                        case Frequency.Daily:
                            endDate.setDate(endDate.getDate() + 30);
                            break;
                        case Frequency.Weekly:
                            endDate.setDate(endDate.getDate() + 90);
                            break;
                        case Frequency.Monthly:
                            endDate.setFullYear(endDate.getFullYear() + 1);
                            break;
                        case Frequency.Yearly:
                            endDate.setFullYear(endDate.getFullYear() + 3);
                            break;
                        default:
                            endDate.setFullYear(endDate.getFullYear() + 1);
                    }

                    // Tạo một lịch bảo trì mới
                    const schedule = await this.prisma.schedule.create({
                        data: {
                            schedule_name: `Auto ${cycle.device_type} Maintenance - ${new Date().toISOString().slice(0, 10)}`,
                            description: `Automatically generated maintenance schedule for ${cycle.device_type}`,
                            cycle_id: cycle.cycle_id,
                            start_date: now,
                            end_date: endDate,
                            schedule_status: $Enums.ScheduleStatus.InProgress,
                        },
                    });

                    // Tạo các ScheduleJob cho mỗi tòa nhà
                    const scheduleJobs = buildings.map((building) => ({
                        schedule_id: schedule.schedule_id,
                        run_date: this.calculateNextRunDate(now, cycle.frequency),
                        status: $Enums.ScheduleJobStatus.Pending,
                        buildingDetailId: building.buildingId, // Hoặc building.buildingDetailId tùy theo cấu trúc dữ liệu
                    }));

                    // Thêm các công việc bảo trì vào DB
                    const createdJobs = await this.prisma.scheduleJob.createMany({
                        data: scheduleJobs,
                    });

                    this.logger.log(`Created schedule ${schedule.schedule_id} with ${scheduleJobs.length} jobs`);

                    // Lưu ý: Các jobs mới tạo sẽ có status là Pending
                    // Việc tạo task và task assignment sẽ được thực hiện trong handleActivateMaintenanceJobs
                    // khi các job chuyển sang InProgress vào ngày thực hiện

                } catch (error) {
                    this.logger.error(`Error creating schedule for cycle ${cycle.cycle_id}:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error generating maintenance schedules:', error);
        }
    }

    // Method để tự động tạo task và task assignment khi trigger manual
    public async createTasksForScheduleJob(scheduleJobId: string): Promise<boolean> {
        try {
            // Lấy schedule job
            const scheduleJob = await this.prisma.scheduleJob.findUnique({
                where: { schedule_job_id: scheduleJobId },
                include: { schedule: true },
            });

            if (!scheduleJob) {
                this.logger.error(`Schedule job not found: ${scheduleJobId}`);
                return false;
            }

            // Tạo task và task assignment
            await this.createTaskAndAssignments(scheduleJob);
            return true;
        } catch (error) {
            this.logger.error(`Error creating tasks for schedule job ${scheduleJobId}:`, error);
            return false;
        }
    }

    // Hàm tính ngày bảo trì tiếp theo dựa trên tần suất
    private calculateNextRunDate(currentDate: Date, frequency: string): Date {
        const nextDate = new Date(currentDate);

        switch (frequency) {
            case 'Daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'Weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'Monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'Yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
            default:
                nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
        }

        return nextDate;
    }

    // Gửi thông báo về việc bảo trì đã được kích hoạt
    private async sendMaintenanceNotification(job: any) {
        try {
            // Lấy thông tin tòa nhà
            const buildingResponse = await firstValueFrom(
                this.buildingClient.send(BUILDINGS_PATTERN.GET_BY_ID, { buildingId: job.buildingDetailId })
            );

            if (!buildingResponse || !buildingResponse.data) {
                this.logger.error(`Failed to fetch building info for job ${job.schedule_job_id}`);
                return;
            }

            const building = buildingResponse.data;

            // Lấy danh sách cư dân trong tòa nhà
            const residentsResponse = await firstValueFrom(
                this.buildingClient.send(BUILDINGS_PATTERN.GET_RESIDENTS_BY_BUILDING_ID, building.buildingId)
            );

            if (!residentsResponse || !residentsResponse.data) {
                this.logger.error(`Failed to fetch residents for building ${building.buildingId}`);
                return;
            }

            // Gửi thông báo đến từng cư dân
            residentsResponse.data.forEach(async (resident) => {
                if (resident.email) {
                    await firstValueFrom(
                        this.notificationsClient.emit(NOTIFICATIONS_PATTERN.SEND_MAINTENANCE_SCHEDULE_EMAIL, {
                            to: resident.email,
                            residentName: resident.name,
                            buildingName: building.name,
                            maintenanceDate: job.run_date,
                            startTime: '08:00',
                            endTime: '17:00',
                            maintenanceType: job.schedule.schedule_name,
                            description: job.schedule.description || 'No additional details provided',
                            floor: resident.floor || 'Không xác định',
                            area: building.area?.name || 'Không xác định',
                            unit: resident.apartmentNumber || 'Không xác định'
                        })
                    );
                }
            });
        } catch (error) {
            this.logger.error(`Error sending maintenance notification for job ${job.schedule_job_id}:`, error);
        }
    }

    // Gửi email nhắc nhở về lịch bảo trì sắp tới
    private async sendMaintenanceReminder(job: any) {
        try {
            // Tương tự như sendMaintenanceNotification nhưng thay đổi nội dung email
            // ...
        } catch (error) {
            this.logger.error(`Error sending maintenance reminder for job ${job.schedule_job_id}:`, error);
        }
    }
} 