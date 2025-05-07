export const TASKS_PATTERN = {
    GET: 'get_all_tasks',
    CREATE: 'create_task',
    UPDATE: 'update_task',
    DELELTE: 'delete_task',
    GET_BY_ID: 'get_task_by_id',
    CHANGE_STATUS: 'change_task_status',
    GET_BY_STATUS: 'get_tasks_by_status',
    CREATE_TASK_ASSIGNMENT: 'create_task_assignment',
    NOTIFICATION_THANKS_TO_RESIDENT: { cmd: 'notification-thanks-to-resident' },
    GET_BY_TYPE: { cmd: 'get-tasks-by-type' },
    COMPLETE_AND_REVIEW: 'complete_task_and_review',
    DELETE_AND_RELATED: 'delete_task_and_related'
}

