export class ApiResponse<T> {
    isSuccess: boolean;
    message?: string;
    data?: T | T[];

    constructor(isSuccess: boolean, message?: string, data?: T | T[]) {
        this.isSuccess = isSuccess;
        this.message = message;
        this.data = data;
    }
}
