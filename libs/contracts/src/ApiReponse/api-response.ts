export class ApiResponse<T> {
    isSuccess: boolean;
    message?: string;
    data?: T[];

    constructor(isSuccess: boolean, message?: string, data?: T[]) {
        this.isSuccess = isSuccess;
        this.message = message;
        this.data = data;
    }
}
