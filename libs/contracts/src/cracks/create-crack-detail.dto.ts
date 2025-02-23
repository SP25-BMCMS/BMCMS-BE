import { IsString, IsEnum, IsOptional } from 'class-validator';
import { $Enums } from '@prisma/client-cracks';

export class CreateCrackDetailDto {
  // ❌ Xóa `@IsUUID()` vì ID này được backend tự động gán
  crackReportId?: string; // ✅ Backend sẽ tự động thêm

  @IsString()
  photoUrl: string;

  @IsEnum($Enums.CrackStatus)
  @IsOptional()
  status?: $Enums.CrackStatus = $Enums.CrackStatus.InProgress; // ✅ Mặc định InProgress

  @IsEnum($Enums.Severity)
  @IsOptional()
  severity?: $Enums.Severity = $Enums.Severity.Unknown; // ✅ Mặc định Unknown

  @IsString()
  @IsOptional()
  aiDetectionUrl?: string; // ✅ Nếu không có, sẽ lấy từ `photoUrl`
}
