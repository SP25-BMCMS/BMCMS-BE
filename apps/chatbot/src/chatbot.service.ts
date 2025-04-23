import { Injectable, Logger, Inject } from '@nestjs/common';
import { ChatMessageDto, ChatResponseDto, ChatListQueryDto } from '@app/contracts/chatbot/chatbot.dto';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './utils/gemini.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BUILDINGS_PATTERN } from '@app/contracts/buildings/buildings.patterns';
@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    @Inject('CRACK_CLIENT') private readonly cracksClient: ClientProxy,
    @Inject('BUILDINGS_CLIENT') private readonly buildingsClient: ClientProxy,
  ) {
    this.logger.log('ChatbotService initialized');
    this.logger.log('CRACK_CLIENT connected successfully');
    this.logger.log('BUILDINGS_CLIENT connected successfully');
  }

  async getUserChats(userId: string, page: number = 1, limit: number = 10): Promise<any> {
    this.logger.log(`[getUserChats] Getting chat history for user ${userId}, page ${page}, limit ${limit}`);

    try {
      if (!userId) {
        this.logger.error('[getUserChats] No userId provided');
        throw new Error('User ID is required');
      }

      // Calculate skip for pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination metadata
      const totalCount = await this.prisma.chat.count({
        where: { userId }
      });

      // Get chat messages with pagination
      const chats = await this.prisma.chat.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      this.logger.log(`[getUserChats] Found ${chats.length} chat messages for user ${userId}`);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      return {
        data: chats,
        meta: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext,
          hasPrevious
        }
      };
    } catch (error) {
      this.logger.error(`[getUserChats] Error getting chat history:`, error);
      throw error;
    }
  }

  private async getCrackReportsInfo(userId: string): Promise<string> {
    try {
      // Lấy thông tin crack reports
      const crackReportsResponse = await firstValueFrom(
        this.cracksClient.send({ cmd: 'get-all-crack-report-by-user-id' }, { userId })
      );
      console.log("🚀 ~ ChatbotService ~ getCrackReportsInfo ~ Full response:", crackReportsResponse);
      
      if (!crackReportsResponse || !crackReportsResponse.isSuccess || !crackReportsResponse.data || !crackReportsResponse.data.crackReports) {
        console.log("🚀 ~ ChatbotService ~ getCrackReportsInfo ~ Invalid response structure:", crackReportsResponse);
        return "\n\nKhông thể lấy thông tin vết nứt. Vui lòng thử lại sau.\n";
      }

      const crackReports = crackReportsResponse.data.crackReports;
      console.log("🚀 ~ ChatbotService ~ getCrackReportsInfo ~ crackReports array:", crackReports);
      
      if (crackReports.length === 0) {
        console.log("🚀 ~ ChatbotService ~ getCrackReportsInfo ~ No crack reports found for user");
        return "\n\nBạn chưa có báo cáo vết nứt nào.\n";
      }

      // Lấy thông tin building cho mỗi report
      let crackReportsInfo = `\n\nTHÔNG TIN VẾT NỨT CỦA BẠN:\n`;
      for (const report of crackReports) {
        try {
          console.log(`🚀 ~ ChatbotService ~ getCrackRepádasdassdasdsdasdsortsInfo ~ Processing report:`,  report.buildingDetailId);
          
          // Lấy thông tin building
          let buildingName = 'Không xác định';
          try {
            if (report.buildingDetailId) {
              const buildingResponse = await firstValueFrom(
                this.buildingsClient.send(BUILDINGS_PATTERN.GET_BY_ID, { id: report.buildingDetailId })
              );
              console.log(`🚀 ~ ChatbotService ~ getCrackReportsInfo ~ Building response:`, buildingResponse);
              
              if (buildingResponse && buildingResponse.isSuccess && buildingResponse.data) {
                buildingName = buildingResponse.data.name;
                console.log("🚀 ~ ChatbotService ~ getCrackReportsInfo ~ Building name:", buildingName);
              }
            } else {
              console.log("🚀 ~ ChatbotService ~ getCrackReportsInfo ~ No buildingDetailId found for report");
            }
          } catch (buildingError) {
            console.error(`🚀 ~ ChatbotService ~ getCrackReportsInfo ~ Error getting building info:`, buildingError);
          }
          
          crackReportsInfo += `- Vị trí: ${report.position}\n`;
          crackReportsInfo += `- Khu vực: ${buildingName}\n`;
          crackReportsInfo += `  Mô tả: ${report.description}\n`;
          crackReportsInfo += `  Trạng thái: ${report.status}\n`;
          crackReportsInfo += `  Ngày báo cáo: ${report.created_at}\n`;
          
          if (report.crackDetails && report.crackDetails.length > 0) {
            console.log(`🚀 ~ ChatbotService ~ getCrackReportsInfo ~ crackDetails:`, report.crackDetails);
            crackReportsInfo += `  Mức độ nghiêm trọng: ${report.crackDetails[0].severity}\n`;
            
            // Thêm thông tin ảnh nếu có
            if (report.crackDetails[0].aiDetectionUrl) {
              crackReportsInfo += `  Ảnh phát hiện: ${report.crackDetails[0].aiDetectionUrl}\n`;
            }
          }
          crackReportsInfo += `\n`;
        } catch (error) {
          console.error(`🚀 ~ ChatbotService ~ getCrackReportsInfo ~ Error processing report:`, error);
          continue;
        }
      }

      console.log("🚀 ~ ChatbotService ~ getCrackReportsInfo ~ Final crackReportsInfo:", crackReportsInfo);
      return crackReportsInfo;
    } catch (error) {
      console.error("🚀 ~ ChatbotService ~ getCrackReportsInfo ~ Error:", error);
      return "\n\nKhông thể lấy thông tin vết nứt. Vui lòng thử lại sau.\n";
    }
  }

  async testChat(message: string, userId: string): Promise<string> {
    this.logger.log(`[testChat] Processing message from user ${userId}: "${message}"`);

    try {
      // // Lưu message vào database để tracking
      // await this.prisma.chat.create({
      //   data: {
      //     userId: userId,
      //     message: message,
      //     isUser: true,
      //     type: 'test'
      //   },
      // });

      let response: string;
      console.log("🚀 ~ ChatbotService ~ đâsdasdsadsdasdadasdadsdadasdsad ~ response:", response)
      try {
        // Lấy thông tin crack reports
        const crackReportsInfo = await this.getCrackReportsInfo(userId);

        // Tạo prompt cho Gemini API
        const prompt = `Bạn là một trợ lý AI thông minh cho hệ thống Building Management & Crack Monitoring System  và chỉ có thể trả lời liên quan tới những câu hỏi liên quan tới bảo trì , vết nứt và hướng dẫn cách báo cáo report đến cho hệ thống.

HƯỚNG DẪN PHẢN HỒI:
- Trả lời theo đúng nội dung câu hỏi, không lặp lại cấu trúc cố định
- Chỉ giới thiệu tổng quan về hệ thống khi người dùng hỏi về toàn bộ hệ thống
- Trả lời có cảm xúc với cư dân vinhomes, súc tích, đi thẳng vào vấn đề người dùng đang hỏi và không lặp lại cấu trúc
- Nếu người dùng hỏi về chức năng cụ thể (như quản lý tòa nhà) hướng dẫn họ cách report đến cho hệ thống 
- Phản hồi tự nhiên như một cuộc trò chuyện, không phải như một bài thuyết trình
- Luôn luôn cho họ số điện thoại cần hỗ trợ "0939193974" nhớ ghi là "bạn có thắc mắc gì hay có gì khiếu nại hãy gọi tới ban quan lý Trần Nhật Quang"
- Nếu người dùng hỏi về tình trạng vết nứt, hãy tham khảo thông tin vết nứt của họ từ phần THÔNG TIN VẾT NỨT CỦA BẠN
- bởi vì 1 resident có rất nhiều bản report , nên dựa vào  ${crackReportsInfo} created_at mới nhất để trả về , nhớ trả đường dẫn ảnh AiDetectionUrl  ${crackReportsInfo} 

THÔNG TIN HỆ THỐNG:
Building Management & Crack Monitoring System là hệ thống quản lý tòa nhà và giám sát vết nứt với nhiều chức năng:
1. Quản lý tòa nhà: theo dõi thông tin tòa nhà, quản lý tài sản, lịch bảo trì, hệ thống kỹ thuật
2. Giám sát vết nứt: phát hiện, theo dõi, đánh giá mức độ nghiêm trọng của vết nứt
3. Cảnh báo và thông báo: gửi cảnh báo khi phát hiện vấn đề
4. Lập kế hoạch bảo trì: theo lịch hoặc dựa trên tình trạng
5. Mục tiêu là cho phép người dùng xem lịch sử bảo trì của căn hộ nào đó, theo dõi lịch sử hoạt động của báo cáo vết nứt, cảnh báo khi cho lịch bảo trì  mới được tạo liên quan tới căn hộ của nó.
${crackReportsInfo}

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

      // // Lưu response vào database
      // await this.prisma.chat.create({
      //   data: {
      //     userId: userId,
      //     message: response,
      //     isUser: false,
      //     type: 'test'
      //   },
      // });

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
        const prompt = `Bạn là một trợ lý AI thông minh cho hệ thống Building Management & Crack Monitoring System.

HƯỚNG DẪN PHẢN HỒI:
- Trả lời theo đúng nội dung câu hỏi, không lặp lại cấu trúc cố định
- Chỉ giới thiệu tổng quan về hệ thống khi người dùng hỏi về toàn bộ hệ thống
- Trả lời ngắn gọn, súc tích, đi thẳng vào vấn đề người dùng đang hỏi
- Nếu người dùng hỏi về chức năng cụ thể (như quản lý tòa nhà), chỉ tập trung vào chức năng đó
- Phản hồi tự nhiên như một cuộc trò chuyện, không phải như một bài thuyết trình

THÔNG TIN HỆ THỐNG:
Building Management & Crack Monitoring System là hệ thống quản lý tòa nhà và giám sát vết nứt với nhiều chức năng:
1. Quản lý tòa nhà: theo dõi thông tin tòa nhà, quản lý tài sản, lịch bảo trì, hệ thống kỹ thuật
2. Giám sát vết nứt: phát hiện, theo dõi, đánh giá mức độ nghiêm trọng của vết nứt
3. Cảnh báo và thông báo: gửi cảnh báo khi phát hiện vấn đề
4. Lập kế hoạch bảo trì: theo lịch hoặc dựa trên tình trạng

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