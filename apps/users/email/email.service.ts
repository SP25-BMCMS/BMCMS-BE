import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendOtp(email: string, otp: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM'),
        to: email,
        subject: 'Mã OTP xác thực',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Xác thực OTP</h2>
                        <p>Xin chào,</p>
                        <p>Mã OTP của bạn là: <strong style="font-size: 24px; color: #007bff;">${otp}</strong></p>
                        <p>Mã này sẽ hết hạn sau 5 phút.</p>
                        <p>Nếu bạn không yêu cầu mã OTP này, vui lòng bỏ qua email này.</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
                    </div>
                `,
      };

      console.log('Sending email with params:', {
        to: email,
        subject: mailOptions.subject,
      });

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error.message);
      return false;
    }
  }
}
