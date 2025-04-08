import { Injectable, Logger } from '@nestjs/common';
import { ChatMessageDto, ChatResponseDto, ChatListQueryDto } from '@app/contracts/chatbot/chatbot.dto';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './utils/gemini.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {
    this.logger.log('ChatbotService initialized');
  }

  async testChat(message: string): Promise<string> {
    this.logger.log(`[testChat] Processing message: "${message}"`);

    try {
      // Lưu message vào database để tracking
      await this.prisma.chat.create({
        data: {
          userId: 'system_test',
          message: message,
          isUser: true,
          type: 'test'
        },
      });

      let response: string;

      try {
        // Tạo prompt cho Gemini API
        const prompt = `Bạn là một trợ lý AI thông minh cho hệ thống Building Management & Crack Monitoring System (BMCMS).
Khi trả lời:
1. và lời nói đầu tiên phải chào hỏi và chúc một ngày tốt lành LUÔN viết đầy đủ "Building Management & Crack Monitoring System" thay vì viết tắt BMCMS trong câu trả lời đầu tiên của bạn.
2. Giới thiệu ngắn gọn về Building Management & Crack Monitoring System là hệ thống quản lý tòa nhà và giám sát vết nứt.
3. Cung cấp thông tin cụ thể về các chức năng chính: quản lý tòa nhà, theo dõi vết nứt, lập lịch bảo trì, và cảnh báo khi phát hiện vấn đề.
4. Trả lời ngắn gọn nhưng đầy đủ thông tin.

Câu hỏi của người dùng: ${message}`;

        // Gọi Gemini API
        this.logger.log(`[testChat] Calling Gemini API with prompt`);
        response = await this.geminiService.generateText(prompt);
        this.logger.log(`[testChat] Received response from Gemini API`);
      } catch (geminiError) {
        this.logger.error(`[testChat] Error calling Gemini API:`, geminiError);
        
        // Fallback response dựa trên keywords khi Gemini API fails
        response = 'Tôi không hiểu câu hỏi của bạn. Vui lòng hỏi rõ hơn về hệ thống BMCMS.';

        // Chuyển message sang lowercase để dễ tìm keywords
        const lowercaseMessage = message.toLowerCase();

        // Kiểm tra các keywords và tạo response phù hợp
        if (lowercaseMessage.includes('xin chào') || lowercaseMessage.includes('hello')) {
          response = 'Xin chào! Tôi là chatbot của hệ thống BMCMS. Tôi có thể giúp gì cho bạn?';
        } else if (lowercaseMessage.includes('hệ thống') || lowercaseMessage.includes('giới thiệu')) {
          response = 'BMCMS là hệ thống quản lý tòa nhà thông minh, giúp quản lý các tòa nhà, phát hiện vết nứt, và tự động cảnh báo khi có sự cố.';
        } else if (lowercaseMessage.includes('vết nứt') || lowercaseMessage.includes('nứt')) {
          response = 'Hệ thống BMCMS có thể phát hiện vết nứt thông qua camera AI, giúp phân loại mức độ nghiêm trọng và đưa ra cảnh báo kịp thời.';
        }
      }

      // Lưu response vào database
      await this.prisma.chat.create({
        data: {
          userId: 'system_test',
          message: response,
          isUser: false,
          type: 'test'
        },
      });

      this.logger.log(`[testChat] Final response: "${response}"`);
      return response;
    } catch (error) {
      this.logger.error('[testChat] Error processing message:', error);
      return 'Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn.';
    }
  }

  async generateContent(request: ChatMessageDto): Promise<ChatResponseDto> {
    try {
      // Save user's message
      await this.prisma.chat.create({
        data: {
          userId: request.userId,
          message: request.message,
          isUser: true,
          type: 'user'
        },
      });

      let response: string;
      let type = 'system';

      try {
        // Tạo prompt cho Gemini API
        const prompt = `Bạn là một trợ lý AI thông minh cho hệ thống Building Management & Crack Monitoring System (BMCMS).
Khi trả lời:
1. LUÔN chào hỏi lại người dùng và chúc một ngày đẹp trời và   viết đầy đủ "Building Management & Crack Monitoring System" thay vì viết tắt BMCMS trong câu trả lời đầu tiên của bạn.
2. Giới thiệu ngắn gọn về Building Management & Crack Monitoring System là hệ thống quản lý tòa nhà và giám sát vết nứt.
3. Cung cấp thông tin cụ thể về các chức năng chính: quản lý tòa nhà, theo dõi vết nứt, lập lịch bảo trì, và cảnh báo khi phát hiện vấn đề.
4. Trả lời ngắn gọn nhưng đầy đủ thông tin.

Câu hỏi của người dùng: ${request.message}`;

        // Gọi Gemini API
        this.logger.log(`[generateContent] Calling Gemini API with prompt`);
        response = await this.geminiService.generateText(prompt);
        console.log("🚀 ~ ChádatbotServiceChádatbotServiceChádatbotServiceChádatbotServiceChádatbotServiceChádatbotServiceChádatbotService ~ generateContent ~ response:", response)
        this.logger.log(`[generateContent] Received response from Gemini API`);
        
        // Xác định type dựa trên nội dung response
        if (response.toLowerCase().includes('vết nứt') || response.toLowerCase().includes('nứt')) {
          type = 'crack';
        }
      } catch (geminiError) {
        this.logger.error(`[generateContent] Error calling Gemini API:`, geminiError);
        
        // Fallback response dựa trên keywords khi Gemini API fails
        response = 'Xin chào! Tôi có thể giúp gì cho bạn?';

        if (request.message.toLowerCase().includes('hệ thống') || 
            request.message.toLowerCase().includes('giới thiệu')) {
          response = 'BMCMS là hệ thống quản lý tòa nhà thông minh, giúp theo dõi và quản lý các vết nứt, lịch bảo trì và các nhiệm vụ liên quan.';
          type = 'system';
        } else if (request.message.toLowerCase().includes('vết nứt') || 
                  request.message.toLowerCase().includes('nứt')) {
          response = 'Vết nứt trong tòa nhà cần được theo dõi và đánh giá thường xuyên. Hệ thống BMCMS giúp quản lý và theo dõi các vết nứt này.';
          type = 'crack';
        }
      }

      // Save AI's response
      await this.prisma.chat.create({
        data: {
          userId: request.userId,
          message: response,
          isUser: false,
          type: type
        },
      });

      return {
        response,
        type
      };
    } catch (error) {
      this.logger.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }
} 