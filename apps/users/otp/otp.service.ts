import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OtpService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService
    ) { }

    async createOTP(email: string): Promise<string> {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in database with 5 minutes expiration
        await this.prisma.otp.create({
            data: {
                email,
                otp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                used: false
            }
        });

        // Send OTP via Email
        await this.emailService.sendOtp(email, otp);

        return otp;
    }

    async verifyOTP(email: string, otp: string): Promise<boolean> {
        try {
            console.log('Verifying OTP:', { email, otp });

            const otpRecord = await this.prisma.otp.findFirst({
                where: {
                    email,
                    otp,
                    used: false,
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });

            console.log('Found OTP record:', otpRecord);

            if (!otpRecord) {
                console.log('No valid OTP found');
                throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn');
            }

            // Mark OTP as used
            const updatedOtp = await this.prisma.otp.update({
                where: {
                    id: otpRecord.id
                },
                data: {
                    used: true
                }
            });

            console.log('OTP marked as used:', updatedOtp);
            return true;
        } catch (error) {
            console.error('Error in verifyOTP:', error);
            throw error;
        }
    }
} 