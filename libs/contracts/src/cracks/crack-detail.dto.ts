import { $Enums } from "@prisma/client-cracks";

export type CrackDetailDto = {
    crackDetailsId: string;
    crackReportId: string;
    photoUrl: string;
    status: $Enums.CrackStatus;
    severity: $Enums.Severity;
    aiDetectionUrl: string;
    createdAt: Date;
    updatedAt: Date;
};
