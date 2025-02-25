import { $Enums } from '@prisma/client-cracks';
import { CrackDetailDto } from './crack-detail.dto';

export type CrackReportDto = {
    crackReportId: string;
    buildingDetailId: string;
    description: string;
    photoUrl: string;
    status: $Enums.ReportStatus;
    reportedBy: string;
    verifiedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    crackDetails: CrackDetailDto[];
};
