// email.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private recentEmails = new Map<string, number>() // Store email keys with timestamps
  private deduplicationWindowMs = 30000 // 30 seconds default deduplication window

  constructor(
    private configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {
    // Clear old entries from deduplication map every minute
    setInterval(() => this.cleanupRecentEmails(), 60000);
  }

  // Helper to clean up old entries from the deduplication map
  private cleanupRecentEmails() {
    const now = Date.now();
    for (const [key, timestamp] of this.recentEmails.entries()) {
      if (now - timestamp > this.deduplicationWindowMs) {
        this.recentEmails.delete(key);
      }
    }
  }

  // Create a unique key for the email to prevent duplicates
  private createEmailKey(to: string, subject: string, deduplicationKey?: string): string {
    if (deduplicationKey) {
      return `${to}:${subject}:${deduplicationKey}`;
    }
    return `${to}:${subject}:${new Date().toISOString().split('T')[0]}`;
  }

  // Check if this is a duplicate email sent within the deduplication window
  private isDuplicateEmail(key: string, customWindowMs?: number): boolean {
    const now = Date.now();
    if (this.recentEmails.has(key)) {
      const timestamp = this.recentEmails.get(key);
      const windowMs = customWindowMs || this.deduplicationWindowMs;
      return now - timestamp < windowMs;
    }
    return false;
  }

  async sendOtp(email: string, otp: string): Promise<boolean> {
    try {
      // Create a unique key for this OTP email
      const subject = 'Mã OTP xác thực';
      const emailKey = this.createEmailKey(email, subject);

      // Check if we just sent an OTP to this email
      if (this.isDuplicateEmail(emailKey)) {
        this.logger.warn(`Duplicate OTP email detected to: ${email} - skipping send`);
        return true; // Return true to avoid triggering error flows
      }

      // Mark this email as sent
      this.recentEmails.set(emailKey, Date.now());

      this.logger.log(`Sending OTP email to: ${email}`)
      this.logger.debug(`OTP: ${otp}`)
      this.logger.debug(`Email configuration:`, {
        host: this.configService.get('EMAIL_HOST'),
        port: this.configService.get('EMAIL_PORT'),
        user: this.configService.get('EMAIL_USER'),
      })

      const result = await this.mailerService.sendMail({
        to: email,
        subject: subject,
        template: 'otp',
        context: {
          otp,
          expiryTime: 5,
          email,
          currentYear: new Date().getFullYear(),
        },
      })

      this.logger.log(`OTP email sent successfully to: ${email}`)
      this.logger.debug(`Message ID: ${result.messageId}`)
      this.logger.debug(`Email response:`, result)
      return true
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}: ${error.message}`)
      this.logger.error(`Error details:`, error)
      this.logger.error(`Stack trace:`, error.stack)
      return false
    }
  }

  async sendMaintenanceEmail(data: {
    to: string
    residentName: string
    buildingName: string
    maintenanceDate: Date
    startTime: string
    endTime: string
    maintenanceType: string
    description: string
    floor: string
    area: string
    unit: string
    deduplicationKey?: string
    deduplicationWindow?: number
  }): Promise<boolean> {
    try {
      // Create a unique key for this email
      const subject = `Thông báo lịch bảo trì - ${data.buildingName}`;
      const emailKey = this.createEmailKey(data.to, subject, data.deduplicationKey);
      const customWindowMs = data.deduplicationWindow ? data.deduplicationWindow * 1000 : undefined;

      // Check if we just sent this exact email
      if (this.isDuplicateEmail(emailKey, customWindowMs)) {
        this.logger.warn(`Duplicate email detected to: ${data.to} with key: ${emailKey} - skipping send`);
        return true; // Return true to avoid triggering error flows
      }

      // Mark this email as sent
      this.recentEmails.set(emailKey, Date.now());

      this.logger.log(`Sending maintenance email to: ${data.to} with key: ${emailKey}`)
      this.logger.debug(`Maintenance details:`, {
        building: data.buildingName,
        date: data.maintenanceDate,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.maintenanceType,
        location: {
          floor: data.floor,
          area: data.area,
          unit: data.unit,
        },
        deduplicationKey: data.deduplicationKey,
        deduplicationWindow: customWindowMs
      })

      const formattedDate = new Date(data.maintenanceDate).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      const result = await this.mailerService.sendMail({
        to: data.to,
        subject: subject,
        template: 'maintenance-schedule',
        context: {
          residentName: data.residentName,
          buildingName: data.buildingName,
          maintenanceDate: formattedDate,
          startTime: data.startTime,
          endTime: data.endTime,
          maintenanceType: data.maintenanceType,
          description: data.description || 'Không có mô tả chi tiết',
          floor: data.floor || 'Không xác định',
          area: data.area || 'Không xác định',
          unit: data.unit || 'Không xác định',
          currentYear: new Date().getFullYear(),
          contactInfo: {
            phone: this.configService.get('CONTACT_PHONE', '0123 456 789'),
            email: this.configService.get('CONTACT_EMAIL', 'management@building.com'),
            workingHours: '8:00 - 17:00 (Thứ 2 - Thứ 6)',
            managerName: this.configService.get('CONTACT_MANAGER', 'Người quản lý tòa nhà'),
          },
        },
      })

      this.logger.log(`Maintenance email sent successfully to: ${data.to} with key: ${emailKey}`)
      this.logger.debug(`Message ID: ${result.messageId}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to send maintenance email to ${data.to}: ${error.message}`)
      this.logger.error(error.stack)
      return false
    }
  }

  public checkDuplicateEmail(key: string, windowInSeconds: number = 300): boolean {
    return this.isDuplicateEmail(key, windowInSeconds);
  }
}
