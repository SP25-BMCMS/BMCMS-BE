// email.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)

  constructor(
    private configService: ConfigService,
    private readonly mailerService: MailerService,
  ) { }

  async sendOtp(email: string, otp: string): Promise<boolean> {
    try {
      this.logger.log(`Sending OTP email to: ${email}`)
      this.logger.debug(`OTP: ${otp}`)

      const result = await this.mailerService.sendMail({
        to: email,
        subject: 'Mã OTP xác thực',
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
      return true
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}: ${error.message}`)
      this.logger.error(error.stack)
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
  }): Promise<boolean> {
    try {
      this.logger.log(`Sending maintenance email to: ${data.to}`)
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
      })

      const formattedDate = new Date(data.maintenanceDate).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      const result = await this.mailerService.sendMail({
        to: data.to,
        subject: `Thông báo lịch bảo trì - ${data.buildingName}`,
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

      this.logger.log(`Maintenance email sent successfully to: ${data.to}`)
      this.logger.debug(`Message ID: ${result.messageId}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to send maintenance email to ${data.to}: ${error.message}`)
      this.logger.error(error.stack)
      return false
    }
  }
}
