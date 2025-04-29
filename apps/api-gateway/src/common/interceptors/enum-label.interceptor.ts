import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class EnumLabelInterceptor implements NestInterceptor {
    private readonly statusMaps = {
        // Users Schema
        Role: {
            Admin: 'Quản trị viên',
            Manager: 'Quản lý',
            Resident: 'Cư dân',
            Staff: 'Nhân viên'
        },
        Gender: {
            Male: 'Nam',
            Female: 'Nữ',
            Other: 'Khác'
        },
        StaffStatus: {
            Active: 'Đang hoạt động',
            Inactive: 'Không hoạt động'
        },
        PositionName: {
            Leader: 'Trưởng nhóm',
            Technician: 'Kỹ thuật viên',
            Maintenance_Technician: 'Kỹ thuật viên bảo trì'
        },
        AccountStatus: {
            Active: 'Đang hoạt động',
            Inactive: 'Không hoạt động'
        },

        // Tasks Schema
        WorkLogStatus: {
            INIT_INSPECTION: 'Khởi tạo kiểm tra',
            WAIT_FOR_DEPOSIT: 'Chờ đặt cọc',
            EXECUTE_CRACKS: 'Thực hiện sửa nứt',
            CONFIRM_NO_PENDING_ISSUES: 'Xác nhận không còn vấn đề tồn đọng',
            FINAL_REVIEW: 'Đánh giá cuối cùng',
            CANCELLED: 'Đã hủy'
        },
        Status: {
            Assigned: 'Đã phân công',
            Completed: 'Hoàn thành'
        },
        AssignmentStatus: {
            Pending: 'Chờ xử lý',
            Verified: 'Đã xác minh',
            Unverified: 'Chưa xác minh',
            InFixing: 'Đang sửa chữa',
            Fixed: 'Đã sửa xong',
            Confirmed: 'Đã xác nhận',
            Reassigned: 'Phân công lại',
            Notcompleted: 'Chưa hoàn thành'
        },
        MaterialStatus: {
            ACTIVE: 'Đang hoạt động',
            INACTIVE: 'Không hoạt động',
            DELETED: 'Đã xóa'
        },
        FeedbackStatus: {
            ACTIVE: 'Đang hoạt động',
            INACTIVE: 'Không hoạt động',
            DELETED: 'Đã xóa'
        },
        reportStatus: {
            NoPending: 'Không có vấn đề tồn đọng',
            Pending: 'Đang chờ duyệt',
            Approved: 'Đã được duyệt',
            Rejected: 'Bị từ chối',
            AutoApproved: 'Tự động duyệt'
        },

        // Schedules Schema
        Frequency: {
            Daily: 'Hàng ngày',
            Weekly: 'Hàng tuần',
            Monthly: 'Hàng tháng',
            Yearly: 'Hàng năm',
            Specific: 'Cụ thể'
        },
        ScheduleJobStatus: {
            Reviewing: 'Đang xem xét',
            Rejected: 'Bị từ chối',
            Pending: 'Chờ xử lý',
            InProgress: 'Đang thực hiện',
            Completed: 'Hoàn thành',
            Cancel: 'Đã hủy'
        },
        ScheduleStatus: {
            InProgress: 'Đang thực hiện',
            Completed: 'Hoàn thành',
            Cancel: 'Đã hủy'
        },
        MaintenanceBasis: {
            ManufacturerRecommendation: 'Khuyến nghị của nhà sản xuất',
            LegalStandard: 'Tiêu chuẩn pháp lý',
            OperationalExperience: 'Kinh nghiệm vận hành',
            Other: 'Khác'
        },
        DeviceType: {
            Elevator: 'Thang máy',
            FireProtection: 'Phòng cháy chữa cháy',
            Electrical: 'Điện',
            Plumbing: 'Cấp thoát nước',
            HVAC: 'Điều hòa thông gió',
            CCTV: 'Camera giám sát',
            Generator: 'Máy phát điện',
            Lighting: 'Chiếu sáng',
            AutomaticDoor: 'Cửa tự động',
            FireExtinguisher: 'Bình chữa cháy',
            Other: 'Khác'
        },

        // Notifications Schema
        NotificationType: {
            TASK_ASSIGNMENT: 'Phân công công việc',
            TASK_STATUS_UPDATE: 'Cập nhật trạng thái công việc',
            MAINTENANCE_SCHEDULE: 'Lịch bảo trì',
            SYSTEM: 'Hệ thống'
        },

        // Cracks Schema
        ReportStatus: {
            Pending: 'Chờ xử lý',
            InProgress: 'Đang thực hiện',
            InFixing: 'Đang sửa chữa',
            Reviewing: 'Đang xem xét',
            Rejected: 'Bị từ chối',
            Completed: 'Hoàn thành'
        },
        Severity: {
            Unknown: 'Không xác định',
            Low: 'Thấp',
            Medium: 'Trung bình',
            High: 'Cao'
        },

        // Buildings Schema
        BuildingStatus: {
            operational: 'Đang hoạt động',
            under_construction: 'Đang xây dựng',
            completion_date: 'Đã hoàn thành'
        },
        CrackType: {
            Vertical: 'Nứt dọc',
            Horizontal: 'Nứt ngang',
            Diagonal: 'Nứt xiên',
            Structural: 'Nứt kết cấu',
            NonStructural: 'Nứt phi kết cấu',
            Other: 'Khác'
        },
        AreaType: {
            SwimmingPool: 'Hồ bơi',
            Terrace: 'Sân thượng',
            Garden: 'Vườn',
            Parking: 'Bãi đỗ xe',
            Gym: 'Phòng tập',
            Lobby: 'Sảnh',
            Other: 'Khác'
        },
        AreaDetailsType: {
            Floor: 'Sàn',
            Wall: 'Tường',
            Ceiling: 'Trần',
            column: 'Cột',
            Other: 'Khác'
        }
    };

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                if (data && typeof data === 'object') {
                    return this.transformData(data);
                }
                return data;
            }),
        );
    }

    private transformData(data: any): any {
        if (Array.isArray(data)) {
            return data.map(item => this.transformData(item));
        }

        if (data && typeof data === 'object') {
            // Create a new object to store the transformed data
            const result: any = {};
            const fields: { key: string; value: any; isEnum: boolean; label?: string }[] = [];

            // First pass: collect all fields and their labels
            for (const key in data) {
                const value = data[key];

                if (typeof value === 'string' || typeof value === 'number') {
                    const label = this.getLabelForEnumField(key, value.toString());
                    if (label) {
                        fields.push({ key, value, isEnum: true, label });
                    } else {
                        fields.push({ key, value, isEnum: false });
                    }
                } else if (value && typeof value === 'object') {
                    fields.push({
                        key,
                        value: this.transformData(value),
                        isEnum: false
                    });
                } else {
                    fields.push({ key, value, isEnum: false });
                }
            }

            // Second pass: build the result object with proper ordering
            for (const field of fields) {
                result[field.key] = field.value;
                if (field.isEnum && field.label) {
                    result[`${field.key}Label`] = field.label;
                }
            }

            return result;
        }

        return data;
    }

    // Helper method to get label for enum fields
    private getLabelForEnumField(key: string, value: string): string | null {
        // Normalize the key to handle case-insensitive matching
        const normalizedKey = key.toLowerCase();

        // Special handling for status fields
        if (normalizedKey === 'status') {
            const allStatusMaps = {
                ...this.statusMaps.Status,
                ...this.statusMaps.ReportStatus,
                ...this.statusMaps.WorkLogStatus,
                ...this.statusMaps.AssignmentStatus,
                ...this.statusMaps.MaterialStatus,
                ...this.statusMaps.FeedbackStatus,
                ...this.statusMaps.ScheduleJobStatus,
                ...this.statusMaps.ScheduleStatus,
                ...this.statusMaps.BuildingStatus
            };

            return allStatusMaps[value] || null;
        }

        // Special handling for type fields
        if (normalizedKey === 'type') {
            const allTypeMaps = {
                ...this.statusMaps.NotificationType,
                ...this.statusMaps.DeviceType,
                ...this.statusMaps.CrackType,
                ...this.statusMaps.AreaType,
                ...this.statusMaps.AreaDetailsType
            };

            return allTypeMaps[value] || null;
        }

        // Handle other specific enum fields with case-insensitive matching
        const enumFieldMappings = {
            'role': this.statusMaps.Role,
            'gender': this.statusMaps.Gender,
            'staffstatus': this.statusMaps.StaffStatus,
            'positionname': this.statusMaps.PositionName,
            'accountstatus': this.statusMaps.AccountStatus,
            'severity': this.statusMaps.Severity,
            'frequency': this.statusMaps.Frequency,
            'basis': this.statusMaps.MaintenanceBasis
        };

        return enumFieldMappings[normalizedKey]?.[value] || null;
    }
} 