import { $Enums } from "@prisma/client-cracks";

export type CrackDetailDto = {
    crackDetailsId: string;
    crackId: string;
    photoUrl: string;
    description: string;
    status: $Enums.CrackStatus;
    severity: $Enums.Severity;
    reportedBy: number;
    verifiedBy: number;
    createdAt: Date;
    updatedAt: Date;
};