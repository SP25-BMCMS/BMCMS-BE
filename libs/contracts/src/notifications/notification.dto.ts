import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean, IsDate, IsEnum } from "class-validator";

export enum NotificationType {
    TASK_ASSIGNMENT = 'TASK_ASSIGNMENT',
    TASK_STATUS_UPDATE = 'TASK_STATUS_UPDATE',
    MAINTENANCE_SCHEDULE = 'MAINTENANCE_SCHEDULE',
    SYSTEM = 'SYSTEM'
}

export class CreateNotificationDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'ID của người dùng nhận thông báo',
        example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
    })
    userId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'Tiêu đề thông báo',
        example: 'Bạn được phân công một task mới'
    })
    title: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'Nội dung thông báo',
        example: 'Bạn đã được phân công task "Bảo trì thang máy tầng 5"'
    })
    content: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Link liên quan đến thông báo, ví dụ link đến trang chi tiết task',
        example: '/tasks/d290f1ee-6c54-4b01-90e6-d701748f0851',
        required: false
    })
    link?: string;

    @IsNotEmpty()
    @IsEnum(NotificationType)
    @ApiProperty({
        description: 'Loại thông báo',
        enum: NotificationType,
        example: NotificationType.TASK_ASSIGNMENT
    })
    type: NotificationType;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'ID liên kết (ví dụ: task_id, assignment_id)',
        example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
        required: false
    })
    relatedId?: string;
}

export class NotificationResponseDto {
    @ApiProperty({
        description: 'ID của thông báo',
        example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
    })
    id: string;

    @ApiProperty({
        description: 'ID của người dùng nhận thông báo',
        example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
    })
    userId: string;

    @ApiProperty({
        description: 'Tiêu đề thông báo',
        example: 'Bạn được phân công một task mới'
    })
    title: string;

    @ApiProperty({
        description: 'Nội dung thông báo',
        example: 'Bạn đã được phân công task "Bảo trì thang máy tầng 5"'
    })
    content: string;

    @ApiProperty({
        description: 'Link liên quan đến thông báo',
        example: '/tasks/d290f1ee-6c54-4b01-90e6-d701748f0851'
    })
    link: string;

    @ApiProperty({
        description: 'Trạng thái đã đọc',
        example: false
    })
    isRead: boolean;

    @ApiProperty({
        description: 'Loại thông báo',
        enum: NotificationType,
        example: NotificationType.TASK_ASSIGNMENT
    })
    type: NotificationType;

    @ApiProperty({
        description: 'ID liên kết (ví dụ: task_id, assignment_id)',
        example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
    })
    relatedId: string;

    @ApiProperty({
        description: 'Thời gian tạo thông báo',
        example: '2025-01-01T00:00:00.000Z'
    })
    createdAt: Date;
}

export class MarkNotificationReadDto {
    @IsNotEmpty()
    @IsUUID()
    @ApiProperty({
        description: 'ID của thông báo cần đánh dấu đã đọc',
        example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
    })
    notificationId: string;
}

export class SubscribeNotificationsDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'ID của người dùng đăng ký nhận thông báo',
        example: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
    })
    userId: string;
} 