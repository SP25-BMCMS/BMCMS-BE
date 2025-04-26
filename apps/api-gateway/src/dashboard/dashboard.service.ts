import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, map, Observable, timeout } from 'rxjs';
import { TASKS_PATTERN } from '@app/contracts/tasks/task.patterns';
import { TASKASSIGNMENT_PATTERN } from '@app/contracts/taskAssigment/taskAssigment.patterns';
import { FEEDBACK_PATTERN } from '@app/contracts/feedback/feedback.patterns';
import { AssignmentStatus, Status } from '@prisma/client-Task';
import { ApiResponse } from '@app/contracts/ApiResponse/api-response';
import { CRACK_RECORD_PATTERNS } from '@app/contracts/CrackRecord/CrackRecord.patterns';
import { SCHEDULEJOB_PATTERN } from '@app/contracts/schedulesjob/ScheduleJob.patterns';
import { MAINTENANCE_CYCLE_PATTERN } from '@app/contracts/MaintenanceCycle/MaintenanceCycle.patterns';
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns';
import { DEVICE_PATTERNS } from '@app/contracts/Device/Device.patterns';

const TASK_CLIENT = 'TASK_CLIENT';
const CRACK_CLIENT = 'CRACK_CLIENT';
const USERS_CLIENT = 'USERS_CLIENT';
const BUILDING_CLIENT = 'BUILDINGS_CLIENT';
const SCHEDULE_CLIENT = 'SCHEDULE_CLIENT';

interface UserService {
    getAllStaff(paginationParams?: { page?: number; limit?: number; search?: string; role?: string | string[] }): Observable<any>
}
@Injectable()
export class DashboardService {
    private userService: UserService;
    constructor(
        @Inject(TASK_CLIENT) private readonly taskClient: ClientProxy,
        @Inject(CRACK_CLIENT) private readonly crackClient: ClientProxy,
        @Inject(USERS_CLIENT) private readonly userClient: ClientGrpc,
        @Inject(BUILDING_CLIENT) private readonly buildingClient: ClientProxy,
        @Inject(SCHEDULE_CLIENT) private readonly scheduleClient: ClientProxy,
    ) {
        this.userService = this.userClient.getService<UserService>('UserService');
    }

    /**
     * Lấy dữ liệu tổng quan cho dashboard của Manager
     */
    async getManagerDashboardSummary() {
        try {
            // Lấy dữ liệu từng phần song song để cải thiện hiệu suất
            const [taskStats, crackStats, staffStats, feedbackStats] = await Promise.all([
                this.getTaskStatistics(),
                this.getCrackStatistics(),
                this.getStaffStatistics(),
                this.getFeedbackStatistics()
            ]);

            // Tổng hợp dữ liệu
            return {
                isSuccess: true,
                message: 'Manager dashboard data retrieved successfully',
                data: {
                    taskStats,
                    crackStats,
                    staffStats,
                    feedbackStats,
                    lastUpdated: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error retrieving manager dashboard data:', error);
            return {
                isSuccess: false,
                message: 'Failed to retrieve dashboard data',
                error: error.message
            };
        }
    }

    /**
     * Lấy thống kê về công việc
     */
    private async getTaskStatistics() {
        try {
            const response = await firstValueFrom(
                this.taskClient.send(TASKS_PATTERN.GET, {}).pipe(
                    timeout(100000),
                    catchError(err => {
                        console.error('Error fetching task statistics:', err);
                        throw new Error('Failed to retrieve task data');
                    })
                )
            );

            const taskAssignmentResponse = await firstValueFrom(
                this.taskClient.send(TASKASSIGNMENT_PATTERN.GET, {}).pipe(
                    timeout(100000),
                    catchError(err => {
                        console.error('Error fetching task assignments:', err);
                        throw new Error('Failed to retrieve task assignment data');
                    })
                )
            );

            // Xử lý dữ liệu để trả về thống kê 
            const tasks = response?.data || [];
            const taskAssignments = taskAssignmentResponse?.data || [];

            // Đếm số lượng task theo từng trạng thái
            const tasksByStatus = {
                pending: tasks.filter(task => task.status === 'Pending').length,
                inProgress: tasks.filter(task => task.status === 'InProgress').length,
                completed: tasks.filter(task => task.status === Status.Completed).length,
                assigned: tasks.filter(task => task.status === Status.Assigned).length,
                total: tasks.length
            };

            // Đếm số lượng task assignment theo trạng thái
            const assignmentsByStatus = {
                pending: taskAssignments.filter(assignment => assignment.status === AssignmentStatus.Pending).length,
                confirmed: taskAssignments.filter(assignment => assignment.status === AssignmentStatus.Confirmed).length,
                verified: taskAssignments.filter(assignment => assignment.status === AssignmentStatus.Verified).length,
                unverified: taskAssignments.filter(assignment => assignment.status === AssignmentStatus.Unverified).length,
                total: taskAssignments.length
            };

            // Thông tin chi phí
            let totalCost = 0;
            let estimatedCost = 0;

            taskAssignments.forEach(assignment => {
                if (assignment.inspections) {
                    assignment.inspections.forEach(inspection => {
                        if (inspection.total_cost) {
                            if (assignment.status === AssignmentStatus.Confirmed) {
                                totalCost += Number(inspection.total_cost);
                            }
                            if (assignment.status === AssignmentStatus.Verified) {
                                estimatedCost += Number(inspection.total_cost);
                            }
                        }
                    });
                }
            });

            // Lấy 5 task mới nhất
            const recentTasks = [...tasks]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);

            return {
                tasksByStatus,
                assignmentsByStatus,
                costStatistics: {
                    totalCost,
                    estimatedCost,
                    currency: 'VND'
                },
                recentTasks
            };
        } catch (error) {
            console.error('Error in getTaskStatistics:', error);
            return {
                tasksByStatus: { pending: 0, inProgress: 0, completed: 0, assigned: 0, total: 0 },
                assignmentsByStatus: { pending: 0, confirmed: 0, verified: 0, unverified: 0, total: 0 },
                costStatistics: { totalCost: 0, estimatedCost: 0, currency: 'VND' },
                recentTasks: []
            };
        }
    }

    /**
     * Lấy thống kê về báo cáo vết nứt
     */
    private async getCrackStatistics() {
        try {
            const response = await firstValueFrom(
                this.crackClient.send({ cmd: 'get-all-crack-report' }, {
                    page: 1,
                    limit: 1000 // Lấy đủ lớn để có đầy đủ dữ liệu thống kê
                }).pipe(
                    timeout(10000),
                    catchError(err => {
                        console.error('Error fetching crack statistics:', err);
                        throw new Error('Failed to retrieve crack data');
                    })
                )
            );

            const cracks = response?.data || [];

            // Thống kê theo trạng thái
            const cracksByStatus = {
                pending: cracks.filter(crack => crack.status === 'Pending').length,
                inProgress: cracks.filter(crack => crack.status === 'InProgress').length,
                completed: cracks.filter(crack => crack.status === 'Completed').length,
                rejected: cracks.filter(crack => crack.status === 'Rejected').length,
                total: cracks.length
            };

            // Thống kê theo mức độ nghiêm trọng
            const cracksBySeverity = {
                low: 0,
                medium: 0,
                high: 0,
                critical: 0
            };

            cracks.forEach(crack => {
                if (crack.crackDetails && crack.crackDetails.length > 0) {
                    crack.crackDetails.forEach(detail => {
                        if (detail.severity === 'Low') cracksBySeverity.low++;
                        else if (detail.severity === 'Medium') cracksBySeverity.medium++;
                        else if (detail.severity === 'High') cracksBySeverity.high++;
                        else if (detail.severity === 'Critical') cracksBySeverity.critical++;
                    });
                }
            });

            // Lấy 5 báo cáo vết nứt mới nhất
            const recentCracks = [...cracks]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);

            return {
                cracksByStatus,
                cracksBySeverity,
                recentCracks
            };
        } catch (error) {
            console.error('Error in getCrackStatistics:', error);
            return {
                cracksByStatus: { pending: 0, inProgress: 0, completed: 0, rejected: 0, total: 0 },
                cracksBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
                recentCracks: []
            };
        }
    }

    /**
     * Lấy thống kê về nhân viên
     */
    private async getStaffStatistics() {
        try {
            const response = await firstValueFrom(
                this.userService.getAllStaff({
                    page: 1,
                    limit: 1000,
                    role: ['Staff']
                }).pipe(
                    timeout(10000),
                    catchError(err => {
                        console.error('Error fetching staff statistics:', err);
                        throw new Error('Failed to retrieve staff data');
                    })
                )
            );

            const staffMembers = response?.data || [];
            const totalStaff = staffMembers.length;

            // Nhân viên theo phòng ban (cần có thêm dữ liệu userDetails.department)
            const staffByDepartment = {};

            staffMembers.forEach(staff => {
                if (staff.userDetails && staff.userDetails.department) {
                    const deptName = staff.userDetails.department.departmentName;
                    if (!staffByDepartment[deptName]) {
                        staffByDepartment[deptName] = 0;
                    }
                    staffByDepartment[deptName]++;
                }
            });

            return {
                totalStaff,
                staffByDepartment,
                staffList: staffMembers.map(staff => ({
                    userId: staff.userId,
                    username: staff.username,
                    department: staff.userDetails?.department?.departmentName || 'Unassigned',
                    position: staff.userDetails?.position?.positionName || 'Unassigned'
                }))
            };
        } catch (error) {
            console.error('Error in getStaffStatistics:', error);
            return {
                totalStaff: 0,
                staffByDepartment: {},
                staffList: []
            };
        }
    }

    /**
     * Lấy thống kê về phản hồi (feedback)
     */
    private async getFeedbackStatistics() {
        try {
            const response = await firstValueFrom(
                this.taskClient.send(FEEDBACK_PATTERN.GET, {
                    page: 1,
                    limit: 1000
                }).pipe(
                    timeout(10000),
                    catchError(err => {
                        console.error('Error fetching feedback statistics:', err);
                        throw new Error('Failed to retrieve feedback data');
                    })
                )
            );

            const feedbacks = response?.data || [];

            // Tính điểm đánh giá trung bình
            let totalRating = 0;
            let ratingCount = 0;

            feedbacks.forEach(feedback => {
                if (feedback.rating) {
                    totalRating += feedback.rating;
                    ratingCount++;
                }
            });

            const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

            // Lấy 5 phản hồi mới nhất
            const recentFeedbacks = [...feedbacks]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5);

            return {
                totalFeedbacks: feedbacks.length,
                averageRating,
                ratingCount,
                recentFeedbacks
            };
        } catch (error) {
            console.error('Error in getFeedbackStatistics:', error);
            return {
                totalFeedbacks: 0,
                averageRating: 0,
                ratingCount: 0,
                recentFeedbacks: []
            };
        }
    }

    /**
     * Lấy dữ liệu chi tiết cho biểu đồ công việc theo thời gian
     */
    async getTaskTimelineChart(period: 'week' | 'month' | 'year' = 'month') {
        try {
            const response = await firstValueFrom(
                this.taskClient.send(TASKS_PATTERN.GET, {}).pipe(
                    timeout(10000),
                    catchError(err => {
                        console.error('Error fetching task timeline data:', err);
                        throw new Error('Failed to retrieve task timeline data');
                    })
                )
            );

            const tasks = response?.data || [];

            // Tạo dữ liệu timeline dựa vào period
            const now = new Date();
            const timelineData = [];

            if (period === 'week') {
                // Dữ liệu theo ngày trong tuần
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];

                    const tasksOnDate = tasks.filter(task => {
                        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
                        return taskDate === dateStr;
                    });

                    timelineData.push({
                        date: dateStr,
                        total: tasksOnDate.length,
                        completed: tasksOnDate.filter(t => t.status === 'Completed').length,
                        inProgress: tasksOnDate.filter(t => t.status === 'InProgress').length,
                    });
                }
            } else if (period === 'month') {
                // Dữ liệu theo tuần trong tháng
                for (let i = 0; i < 4; i++) {
                    const weekStart = new Date(now);
                    weekStart.setDate(weekStart.getDate() - (now.getDay() + 7 * i));
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);

                    const weekStartStr = weekStart.toISOString().split('T')[0];
                    const weekEndStr = weekEnd.toISOString().split('T')[0];

                    const tasksInWeek = tasks.filter(task => {
                        const taskDate = new Date(task.createdAt);
                        return taskDate >= weekStart && taskDate <= weekEnd;
                    });

                    timelineData.push({
                        period: `${weekStartStr} to ${weekEndStr}`,
                        total: tasksInWeek.length,
                        completed: tasksInWeek.filter(t => t.status === 'Completed').length,
                        inProgress: tasksInWeek.filter(t => t.status === 'InProgress').length,
                    });
                }
                // Đảo ngược để hiển thị từ trước đến nay
                timelineData.reverse();
            } else if (period === 'year') {
                // Dữ liệu theo tháng trong năm
                for (let i = 0; i < 12; i++) {
                    const monthDate = new Date(now.getFullYear(), i, 1);
                    const monthName = monthDate.toLocaleString('default', { month: 'long' });

                    const tasksInMonth = tasks.filter(task => {
                        const taskDate = new Date(task.createdAt);
                        return taskDate.getMonth() === i && taskDate.getFullYear() === now.getFullYear();
                    });

                    timelineData.push({
                        month: monthName,
                        total: tasksInMonth.length,
                        completed: tasksInMonth.filter(t => t.status === 'Completed').length,
                        inProgress: tasksInMonth.filter(t => t.status === 'InProgress').length,
                    });
                }
            }

            return {
                isSuccess: true,
                message: 'Task timeline data retrieved successfully',
                data: {
                    period,
                    timelineData
                }
            };
        } catch (error) {
            console.error('Error in getTaskTimelineChart:', error);
            return {
                isSuccess: false,
                message: 'Failed to retrieve task timeline data',
                error: error.message
            };
        }
    }

    /**
     * Lấy dữ liệu chi phí theo loại công việc
     */
    async getCostByTaskType() {
        try {
            const response = await firstValueFrom(
                this.taskClient.send(TASKS_PATTERN.GET, {}).pipe(
                    timeout(10000),
                    catchError(err => {
                        console.error('Error fetching cost by task type:', err);
                        throw new Error('Failed to retrieve cost data');
                    })
                )
            );

            const tasks = response?.data || [];

            // Phân loại công việc
            const costByType = {
                crack: { count: 0, cost: 0 },
                maintenance: { count: 0, cost: 0 },
                inspection: { count: 0, cost: 0 },
                other: { count: 0, cost: 0 }
            };

            for (const task of tasks) {
                let taskType = 'other';
                let taskCost = 0;

                // Xác định loại task
                if (task.crack_id) {
                    taskType = 'crack';
                } else if (task.description && task.description.toLowerCase().includes('maintenance')) {
                    taskType = 'maintenance';
                } else if (task.description && task.description.toLowerCase().includes('inspection')) {
                    taskType = 'inspection';
                }

                // Tính toán chi phí từ inspections trong assignments
                if (task.taskAssignments) {
                    for (const assignment of task.taskAssignments) {
                        if (assignment.inspections) {
                            for (const inspection of assignment.inspections) {
                                if (inspection.total_cost) {
                                    taskCost += Number(inspection.total_cost);
                                }
                            }
                        }
                    }
                }

                costByType[taskType].count++;
                costByType[taskType].cost += taskCost;
            }

            return {
                isSuccess: true,
                message: 'Cost by task type retrieved successfully',
                data: costByType
            };
        } catch (error) {
            console.error('Error in getCostByTaskType:', error);
            return {
                isSuccess: false,
                message: 'Failed to retrieve cost by task type',
                error: error.message
            };
        }
    }

    /**
     * Lấy dữ liệu hiệu suất nhân viên
     */
    async getStaffPerformance() {
        try {
            const [staffResponse, taskAssignmentResponse] = await Promise.all([
                firstValueFrom(
                    this.userService.getAllStaff({
                        page: 1,
                        limit: 1000,
                        role: ['Staff']
                    }).pipe(
                        timeout(10000),
                        catchError(err => {
                            console.error('Error fetching staff data:', err);
                            throw new Error('Failed to retrieve staff data');
                        })
                    )
                ),
                firstValueFrom(
                    this.taskClient.send(TASKASSIGNMENT_PATTERN.GET, {}).pipe(
                        timeout(10000),
                        catchError(err => {
                            console.error('Error fetching task assignments:', err);
                            throw new Error('Failed to retrieve task assignment data');
                        })
                    )
                )
            ]);

            const staffMembers = staffResponse?.data || [];
            const taskAssignments = taskAssignmentResponse?.data || [];

            // Tính toán hiệu suất cho mỗi nhân viên
            const staffPerformance = staffMembers.map(staff => {
                const staffAssignments = taskAssignments.filter(
                    assignment => assignment.employee_id === staff.userId
                );

                const totalAssigned = staffAssignments.length;
                const completed = staffAssignments.filter(
                    assignment => assignment.status === AssignmentStatus.Confirmed
                ).length;

                const onTime = staffAssignments.filter(assignment => {
                    if (assignment.status !== AssignmentStatus.Confirmed) return false;

                    // Kiểm tra hoàn thành đúng hạn
                    const completedDate = new Date(assignment.updated_at || assignment.completed_at);
                    const dueDate = new Date(assignment.due_date);

                    return completedDate <= dueDate;
                }).length;

                const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;
                const onTimeRate = completed > 0 ? (onTime / completed) * 100 : 0;

                return {
                    userId: staff.userId,
                    username: staff.username,
                    department: staff.userDetails?.department?.departmentName || 'Unassigned',
                    position: staff.userDetails?.position?.positionName || 'Unassigned',
                    performance: {
                        totalAssigned,
                        completed,
                        onTime,
                        completionRate: completionRate.toFixed(2),
                        onTimeRate: onTimeRate.toFixed(2)
                    }
                };
            });

            // Sắp xếp theo tỷ lệ hoàn thành giảm dần
            staffPerformance.sort((a, b) =>
                parseFloat(b.performance.completionRate) - parseFloat(a.performance.completionRate)
            );

            return {
                isSuccess: true,
                message: 'Staff performance data retrieved successfully',
                data: staffPerformance
            };
        } catch (error) {
            console.error('Error in getStaffPerformance:', error);
            return {
                isSuccess: false,
                message: 'Failed to retrieve staff performance data',
                error: error.message
            };
        }
    }

    /**
     * Get manager dashboard metrics specifically for CrackRecord count and Task statistics
     */
    async getManagerDashboardMetrics() {
        try {
            // Get total crack records count from buildings service
            const crackRecordResponse = await firstValueFrom(
                this.buildingClient.send(CRACK_RECORD_PATTERNS.GET_ALL, {
                    page: 1,
                    limit: 1  // We only need the count from pagination response
                }).pipe(
                    timeout(100000),
                    catchError(err => {
                        console.error('Error fetching crack records count:', err);
                        throw new Error('Failed to retrieve crack records count');
                    })
                )
            );

            // Get tasks with status counts (Assigned, Completed)
            const tasksResponse = await firstValueFrom(
                this.taskClient.send(TASKS_PATTERN.GET, {}).pipe(
                    timeout(100000),
                    catchError(err => {
                        console.error('Error fetching tasks:', err);
                        throw new Error('Failed to retrieve tasks data');
                    })
                )
            );

            // Get task assignments with status counts (InFixing, Unverified, Fixed)
            const taskAssignmentsResponse = await firstValueFrom(
                this.taskClient.send(TASKASSIGNMENT_PATTERN.GET, {}).pipe(
                    timeout(100000),
                    catchError(err => {
                        console.error('Error fetching task assignments:', err);
                        throw new Error('Failed to retrieve task assignments data');
                    })
                )
            );

            // Get maintenance cycle count from schedules service
            const maintenanceCycleResponse = await firstValueFrom(
                this.scheduleClient.send(MAINTENANCE_CYCLE_PATTERN.GET_ALL, {
                    paginationParams: { page: 1, limit: 30 }
                }).pipe(
                    timeout(100000),
                    catchError(err => {
                        console.error('Error fetching maintenance cycles:', err);
                        throw new Error('Failed to retrieve maintenance cycles data');
                    })
                )
            );
            console.log('MaintenanceCycle response structure:', JSON.stringify(maintenanceCycleResponse, null, 2).substring(0, 500));

            // Get schedule jobs count from schedules service
            const scheduleJobResponse = await firstValueFrom(
                this.scheduleClient.send(SCHEDULEJOB_PATTERN.GET, {
                    paginationParams: { page: 1, limit: 30}
                }).pipe(
                    timeout(100000),
                    catchError(err => {
                        console.error('Error fetching schedule jobs:', err);
                        throw new Error('Failed to retrieve schedule jobs data');
                    })
                )
            );
            console.log('ScheduleJob response structure:', JSON.stringify(scheduleJobResponse, null, 2).substring(0, 500));

            // Process the data
            const tasks = tasksResponse?.data || [];
            const taskAssignments = taskAssignmentsResponse?.data || [];
            
            // Calculate task counts by status
            const taskCounts = {
                assigned: tasks.filter(task => task.status === Status.Assigned).length,
                completed: tasks.filter(task => task.status === Status.Completed).length,
                total: tasks.length
            };

            // Calculate task assignment counts by status
            const taskAssignmentCounts = {
                inFixing: taskAssignments.filter(assignment => assignment.status === AssignmentStatus.InFixing).length,
                unverified: taskAssignments.filter(assignment => assignment.status === AssignmentStatus.Unverified).length,
                fixed: taskAssignments.filter(assignment => assignment.status === AssignmentStatus.Fixed).length,
                total: taskAssignments.length
            };

            // Get total crack records count from the pagination response
            const totalCrackRecords = crackRecordResponse?.pagination?.total || 0;
            
            // Extract maintenance cycle and schedule job counts from the response
            // Try different response formats based on the API structure
            let totalMaintenanceCycles = 0;
            if (maintenanceCycleResponse?.pagination?.total !== undefined) {
                totalMaintenanceCycles = maintenanceCycleResponse.pagination.total;
            } else if (maintenanceCycleResponse?.total !== undefined) {
                totalMaintenanceCycles = maintenanceCycleResponse.total;
            } else if (maintenanceCycleResponse?.data && Array.isArray(maintenanceCycleResponse.data)) {
                totalMaintenanceCycles = maintenanceCycleResponse.data.length;
            }
            
            let totalScheduleJobs = 0;
            if (scheduleJobResponse?.pagination?.total !== undefined) {
                totalScheduleJobs = scheduleJobResponse.pagination.total;
            } else if (scheduleJobResponse?.total !== undefined) {
                totalScheduleJobs = scheduleJobResponse.total;
            } else if (scheduleJobResponse?.data && Array.isArray(scheduleJobResponse.data)) {
                totalScheduleJobs = scheduleJobResponse.data.length;
            }

            return {
                isSuccess: true,
                message: 'Manager dashboard metrics retrieved successfully',
                data: {
                    crackRecords: {
                        total: totalCrackRecords
                    },
                    tasks: taskCounts,
                    taskAssignments: taskAssignmentCounts,
                    maintenanceCycles: {
                        total: totalMaintenanceCycles
                    },
                    scheduleJobs: {
                        total: totalScheduleJobs
                    },
                    lastUpdated: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error retrieving manager dashboard metrics:', error);
            return {
                isSuccess: false,
                message: 'Failed to retrieve dashboard metrics',
                error: error.message
            };
        }
    }

    /**
     * Get comprehensive building statistics for manager dashboard
     */
    async getBuildingStatistics() {
        try {
            // Get buildings with their details
            const buildingsResponse = await firstValueFrom(
                this.buildingClient.send(BUILDINGS_PATTERN.GET, {
                    page: 1,
                    limit: 1000
                }).pipe(
                    timeout(10000),
                    catchError(err => {
                        console.error('Error fetching buildings:', err);
                        throw new Error('Failed to retrieve buildings data');
                    })
                )
            );

            // Get devices information
            const devicesResponse = await firstValueFrom(
                this.buildingClient.send(DEVICE_PATTERNS.FIND_ALL, {
                    page: 1,
                    limit: 1000
                }).pipe(
                    timeout(10000),
                    catchError(err => {
                        console.error('Error fetching devices:', err);
                        throw new Error('Failed to retrieve devices data');
                    })
                )
            );

            const buildings = buildingsResponse?.data || [];
            const devices = devicesResponse?.data || [];

            // Calculate building stats
            const totalBuildings = buildings.length;
            const buildingsByStatus = {
                operational: buildings.filter(b => b.Status === 'operational').length,
                underConstruction: buildings.filter(b => b.Status === 'under_construction').length,
                other: buildings.filter(b => !['operational', 'under_construction'].includes(b.Status)).length
            };

            // Calculate device stats by type
            const devicesByType = {};
            devices.forEach(device => {
                if (!devicesByType[device.type]) {
                    devicesByType[device.type] = 0;
                }
                devicesByType[device.type]++;
            });

            // Get total number of building details
            let totalBuildingDetails = 0;
            buildings.forEach(building => {
                if (building.buildingDetails) {
                    totalBuildingDetails += building.buildingDetails.length;
                }
            });

            return {
                isSuccess: true,
                message: 'Building statistics retrieved successfully',
                data: {
                    buildings: {
                        total: totalBuildings,
                        byStatus: buildingsByStatus
                    },
                    buildingDetails: {
                        total: totalBuildingDetails
                    },
                    devices: {
                        total: devices.length,
                        byType: devicesByType
                    },
                    lastUpdated: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error retrieving building statistics:', error);
            return {
                isSuccess: false,
                message: 'Failed to retrieve building statistics',
                error: error.message
            };
        }
    }

    /**
     * Get maintenance efficiency metrics for manager dashboard
     */
    async getMaintenanceEfficiencyMetrics() {
        try {
            // Get all maintenance cycles
            const maintenanceCyclesResponse = await firstValueFrom(
                this.scheduleClient.send(MAINTENANCE_CYCLE_PATTERN.GET_ALL, {
                    paginationParams: { page: 1, limit: 1000 }
                }).pipe(
                    timeout(10000),
                    catchError(err => {
                        console.error('Error fetching maintenance cycles:', err);
                        throw new Error('Failed to retrieve maintenance cycles');
                    })
                )
            );

            // Get all schedule jobs
            const scheduleJobsResponse = await firstValueFrom(
                this.scheduleClient.send(SCHEDULEJOB_PATTERN.GET, {
                    paginationParams: { page: 1, limit: 1000 }
                }).pipe(
                    timeout(10000),
                    catchError(err => {
                        console.error('Error fetching schedule jobs:', err);
                        throw new Error('Failed to retrieve schedule jobs');
                    })
                )
            );

            const maintenanceCycles = maintenanceCyclesResponse?.data || [];
            const scheduleJobs = scheduleJobsResponse?.data || [];

            // Calculate cycles by device type
            const cyclesByDeviceType = {};
            maintenanceCycles.forEach(cycle => {
                if (!cyclesByDeviceType[cycle.device_type]) {
                    cyclesByDeviceType[cycle.device_type] = 0;
                }
                cyclesByDeviceType[cycle.device_type]++;
            });

            // Calculate cycles by frequency
            const cyclesByFrequency = {};
            maintenanceCycles.forEach(cycle => {
                if (!cyclesByFrequency[cycle.frequency]) {
                    cyclesByFrequency[cycle.frequency] = 0;
                }
                cyclesByFrequency[cycle.frequency]++;
            });

            // Calculate schedule jobs by status
            const jobsByStatus = {};
            scheduleJobs.forEach(job => {
                if (!jobsByStatus[job.status]) {
                    jobsByStatus[job.status] = 0;
                }
                jobsByStatus[job.status]++;
            });

            // Calculate completion rate
            const completedJobs = scheduleJobs.filter(job => job.status === 'Completed').length;
            const completionRate = scheduleJobs.length > 0 
                ? (completedJobs / scheduleJobs.length * 100).toFixed(2) 
                : 0;

            // Calculate on-time completion rate
            const now = new Date();
            const onTimeJobs = scheduleJobs.filter(job => {
                if (job.status !== 'Completed') return false;
                const endDate = new Date(job.end_date);
                const runDate = new Date(job.run_date);
                return runDate <= endDate;
            }).length;
            
            const onTimeRate = completedJobs > 0 
                ? (onTimeJobs / completedJobs * 100).toFixed(2) 
                : 0;

            // Calculate upcoming jobs (due in the next 7 days)
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            const upcomingJobs = scheduleJobs.filter(job => {
                if (job.status === 'Completed' || job.status === 'Cancel') return false;
                const runDate = new Date(job.run_date);
                return runDate >= now && runDate <= nextWeek;
            });

            return {
                isSuccess: true,
                message: 'Maintenance efficiency metrics retrieved successfully',
                data: {
                    maintenanceCycles: {
                        total: maintenanceCycles.length,
                        byDeviceType: cyclesByDeviceType,
                        byFrequency: cyclesByFrequency
                    },
                    scheduleJobs: {
                        total: scheduleJobs.length,
                        byStatus: jobsByStatus,
                        completionRate: completionRate,
                        onTimeRate: onTimeRate,
                        upcoming: upcomingJobs.length
                    },
                    lastUpdated: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error retrieving maintenance efficiency metrics:', error);
            return {
                isSuccess: false,
                message: 'Failed to retrieve maintenance efficiency metrics',
                error: error.message
            };
        }
    }

    /**
     * Get comprehensive dashboard data for managers in a single call
     */
    async getComprehensiveManagerDashboard() {
        try {
            // Call all dashboard methods in parallel
            const [
                metrics,
                buildingStats,
                maintenanceEfficiency,
                costsByType,
                staffPerformance
            ] = await Promise.all([
                this.getManagerDashboardMetrics(),
                this.getBuildingStatistics(),
                this.getMaintenanceEfficiencyMetrics(),
                this.getCostByTaskType(),
                this.getStaffPerformance()
            ]);

            return {
                isSuccess: true,
                message: 'Comprehensive dashboard data retrieved successfully',
                data: {
                    metrics: metrics.data,
                    buildingStats: buildingStats.data,
                    maintenanceEfficiency: maintenanceEfficiency.data,
                    costsByType: costsByType.data,
                    staffPerformance: staffPerformance.data,
                    lastUpdated: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error retrieving comprehensive dashboard data:', error);
            return {
                isSuccess: false,
                message: 'Failed to retrieve comprehensive dashboard data',
                error: error.message
            };
        }
    }
} 