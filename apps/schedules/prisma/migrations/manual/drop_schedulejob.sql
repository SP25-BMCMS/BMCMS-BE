-- Xóa các ràng buộc khóa ngoại trước để tránh lỗi
ALTER TABLE "ScheduleJob" DROP CONSTRAINT IF EXISTS "ScheduleJob_schedule_id_fkey";

-- Xóa bảng ScheduleJob
DROP TABLE IF EXISTS "ScheduleJob"; 