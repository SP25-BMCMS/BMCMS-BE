import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. Gemini API will not function correctly.');
    } else {
      this.logger.log('Gemini API service initialized successfully');
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY is not set');
      }

      this.logger.log(`Sending prompt to Gemini API: "${prompt.substring(0, 50)}..."`);
      
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          }
        }
      );

      if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const generatedText = response.data.candidates[0].content.parts[0].text;
      this.logger.log(`Received response from Gemini API: "${generatedText.substring(0, 50)}..."`);
      
      return generatedText;
    } catch (error) {
      this.logger.error(`Error generating text with Gemini API: ${error.message}`, error.stack);
      
      if (error.response) {
        this.logger.error(`Gemini API response error: ${JSON.stringify(error.response.data)}`);
      }
      
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }
} 