export const NOTIFICATIONS_PATTERN = {
    SEND_EMAIL: 'send_email',
    SEND_MAINTENANCE_SCHEDULE_EMAIL: 'send_maintenance_schedule_email',
    CREATE_NOTIFICATION: 'create_notification',
    GET_USER_NOTIFICATIONS: 'get_user_notifications',
    MARK_NOTIFICATION_READ: 'mark_notification_read',
    SUBSCRIBE_NOTIFICATIONS: 'subscribe_notifications',
    STREAM_NOTIFICATIONS: 'notification.stream',
    MARK_ALL_READ: 'mark_all_read',
    CLEAR_ALL: 'clear_all'
} as const 