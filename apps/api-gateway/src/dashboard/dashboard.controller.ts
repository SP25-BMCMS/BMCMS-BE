import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard';
import { RolesGuard } from '../guards/role.guard';
import { Roles } from '../decorator/roles.decarator';
import { Role } from '@prisma/client-users';

@Controller('dashboard')
@ApiTags('dashboard')
@UseGuards(PassportJwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('manager/summary')
    @Roles(Role.Manager, Role.Admin)
    @ApiOperation({ summary: 'Lấy tổng quan dữ liệu dashboard cho Manager' })
    @ApiResponse({
        status: 200,
        description: 'Dữ liệu tổng quan đã được lấy thành công',
        schema: {
            type: 'object',
            properties: {
                isSuccess: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Manager dashboard data retrieved successfully' },
                data: {
                    type: 'object',
                    properties: {
                        taskStats: { type: 'object' },
                        crackStats: { type: 'object' },
                        staffStats: { type: 'object' },
                        feedbackStats: { type: 'object' },
                        lastUpdated: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Manager/Admin role required' })
    async getManagerDashboardSummary() {
        return this.dashboardService.getManagerDashboardSummary();
    }

    @Get('manager/tasks/timeline')
    @Roles(Role.Manager, Role.Admin)
    @ApiOperation({ summary: 'Lấy dữ liệu biểu đồ timeline công việc' })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['week', 'month', 'year'],
        description: 'Khoảng thời gian cho biểu đồ (week/month/year)'
    })
    @ApiResponse({
        status: 200,
        description: 'Dữ liệu biểu đồ timeline đã được lấy thành công',
        schema: {
            type: 'object',
            properties: {
                isSuccess: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Task timeline data retrieved successfully' },
                data: { type: 'object' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Manager/Admin role required' })
    async getTaskTimelineChart(
        @Query('period') period: 'week' | 'month' | 'year' = 'month'
    ) {
        return this.dashboardService.getTaskTimelineChart(period);
    }

    @Get('manager/costs/by-type')
    @Roles(Role.Manager, Role.Admin)
    @ApiOperation({ summary: 'Lấy dữ liệu chi phí theo loại công việc' })
    @ApiResponse({
        status: 200,
        description: 'Dữ liệu chi phí theo loại công việc đã được lấy thành công',
        schema: {
            type: 'object',
            properties: {
                isSuccess: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Cost by task type retrieved successfully' },
                data: {
                    type: 'object',
                    properties: {
                        crack: {
                            type: 'object',
                            properties: {
                                count: { type: 'number' },
                                cost: { type: 'number' }
                            }
                        },
                        maintenance: {
                            type: 'object',
                            properties: {
                                count: { type: 'number' },
                                cost: { type: 'number' }
                            }
                        },
                        inspection: {
                            type: 'object',
                            properties: {
                                count: { type: 'number' },
                                cost: { type: 'number' }
                            }
                        },
                        other: {
                            type: 'object',
                            properties: {
                                count: { type: 'number' },
                                cost: { type: 'number' }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Manager/Admin role required' })
    async getCostByTaskType() {
        return this.dashboardService.getCostByTaskType();
    }

    @Get('manager/staff/performance')
    @Roles(Role.Manager, Role.Admin)
    @ApiOperation({ summary: 'Lấy dữ liệu hiệu suất làm việc của nhân viên' })
    @ApiResponse({
        status: 200,
        description: 'Dữ liệu hiệu suất nhân viên đã được lấy thành công',
        schema: {
            type: 'object',
            properties: {
                isSuccess: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Staff performance data retrieved successfully' },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            userId: { type: 'string' },
                            username: { type: 'string' },
                            department: { type: 'string' },
                            position: { type: 'string' },
                            performance: {
                                type: 'object',
                                properties: {
                                    totalAssigned: { type: 'number' },
                                    completed: { type: 'number' },
                                    onTime: { type: 'number' },
                                    completionRate: { type: 'string' },
                                    onTimeRate: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Manager/Admin role required' })
    async getStaffPerformance() {
        return this.dashboardService.getStaffPerformance();
    }

    @Get('manager/metrics')
    @Roles(Role.Manager, Role.Admin)
    @ApiOperation({ summary: 'Lấy số liệu thống kê về CrackRecord, Task, MaintenanceCycles và ScheduleJobs cho Manager Dashboard' })
    @ApiResponse({
        status: 200,
        description: 'Dữ liệu thống kê cho Manager Dashboard được lấy thành công',
        schema: {
            type: 'object',
            properties: {
                isSuccess: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Manager dashboard metrics retrieved successfully' },
                data: {
                    type: 'object',
                    properties: {
                        crackRecords: {
                            type: 'object',
                            properties: {
                                total: { type: 'number', example: 150 }
                            }
                        },
                        tasks: {
                            type: 'object',
                            properties: {
                                assigned: { type: 'number', example: 45 },
                                completed: { type: 'number', example: 87 },
                                total: { type: 'number', example: 132 }
                            }
                        },
                        taskAssignments: {
                            type: 'object',
                            properties: {
                                inFixing: { type: 'number', example: 23 },
                                unverified: { type: 'number', example: 15 },
                                fixed: { type: 'number', example: 38 },
                                total: { type: 'number', example: 76 }
                            }
                        },
                        maintenanceCycles: {
                            type: 'object',
                            properties: {
                                total: { type: 'number', example: 42 }
                            }
                        },
                        scheduleJobs: {
                            type: 'object',
                            properties: {
                                total: { type: 'number', example: 67 }
                            }
                        },
                        lastUpdated: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Manager/Admin role required' })
    async getManagerDashboardMetrics() {
        return this.dashboardService.getManagerDashboardMetrics();
    }
} 