import { $Enums } from '@prisma/client-cracks'
import { CrackDetailDto } from './crack-detail.dto'

export type CrackReportDto = {
    crackId: string
    buildingDetailId: string
    photoUrl: string
    status: $Enums.ReportStatus
    reportedBy: number
    createdAt: Date
    updatedAt: Date
    crackDetails: CrackDetailDto[];
}