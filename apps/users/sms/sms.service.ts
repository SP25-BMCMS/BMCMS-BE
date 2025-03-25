import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
    private readonly apiUrl: string;
    private readonly apiKey: string;

    constructor(private configService: ConfigService) {
        this.apiUrl = this.configService.get<string>('INFOBIP_API_URL');
        this.apiKey = this.configService.get<string>('INFOBIP_API_KEY');
    }

    private formatPhoneNumber(phoneNumber: string): string {
        // Remove any non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');

        // If number starts with 0, replace with 84 (Vietnam country code)
        if (cleaned.startsWith('0')) {
            return '+84' + cleaned.substring(1); // Infobip needs +84
        }

        // If number doesn't start with +, add it
        if (!cleaned.startsWith('+')) {
            return '+' + cleaned;
        }

        return cleaned;
    }

    async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
        try {
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            const message = `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút.`;

            const response = await axios.post(
                this.apiUrl,
                {
                    messages: [{
                        destinations: [{ to: formattedNumber }],
                        from: 'OTP Service',
                        text: message
                    }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `App ${this.apiKey}`
                    }
                }
            );

            console.log('SMS sent successfully:', response.data);
            return true;
        } catch (error) {
            console.error('Error sending SMS:', error.response?.data || error.message);
            return false;
        }
    }
}