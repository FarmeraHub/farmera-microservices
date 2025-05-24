import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'node-mailjet';

@Injectable()
export class EmailService {
  private mailjet: Client;

  constructor(private configService: ConfigService) {
    this.mailjet = new Client({
      apiKey: this.configService.get<string>('MAILJET_API_KEY'),
      apiSecret: this.configService.get<string>('MAILJET_API_SECRET'),
    });
  }

  async sendEmail(to: string, subject: string, text: string, html: string) {
    const data = {
      Messages: [
        {
          From: {
            Email: this.configService.get<string>('MAILJET_FROM_EMAIL'),
            Name: this.configService.get<string>('MAILJET_FROM_NAME'),
          },
          To: [
            {
              Email: to,
            },
          ],
          Subject: subject,
          TextPart: text,
          HTMLPart: html,
        },
      ],
    };

    try {
      const result = await this.mailjet
        .post('send', { version: 'v3.1' })
        .request(data);
      console.log(result.body);
    } catch (err) {
      console.error(err);
    }
  }
}
