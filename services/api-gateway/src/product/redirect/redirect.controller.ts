import { Controller, Get, Param, ParseIntPipe, Req, Res } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/common/decorators/public.decorator';
import { Request, Response } from 'express';

@Controller('redirect')
export class RedirectController {
  private readonly appUrlScheme: string;
  private readonly iosAppStoreUrl: string;
  private readonly androidAppStoreUrl: string;

  constructor(
    private readonly productService: ProductService,
    private readonly configService: ConfigService,
  ) {
    this.appUrlScheme = this.configService.get<string>(
      'APP_URL_SCHEME',
      'farmera',
    );
    this.iosAppStoreUrl = this.configService.get<string>(
      'IOS_APP_STORE_URL',
      'https://apps.apple.com/app/app-id',
    );
    this.androidAppStoreUrl = this.configService.get<string>(
      'ANDROID_APP_STORE_URL',
      'https://play.google.com/store/apps/details?id=com.shopee.vn',
    );
  }

  // Deep link redirect
  @Public()
  @Get('product/:product_id')
  async redirectToProduct(
    @Param('product_id', ParseIntPipe) productId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Detect user agent
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    const isAndroid = userAgent.includes('android');
    const isIOS = userAgent.includes('iphone') || userAgent.includes('ipad');

    // Custom URL scheme for the Flutter app
    const appDeepLink = `${this.appUrlScheme}://product/${productId}`;

    if (isAndroid) {
      // Android: Use intent URL to attempt opening the app
      res.redirect(
        `intent://${appDeepLink.replace(`${this.appUrlScheme}://`, '')}#Intent;` +
          `scheme=${this.appUrlScheme};` +
          `package=com.example.frontend;` +
          `S.browser_fallback_url=${encodeURIComponent(this.androidAppStoreUrl)};` +
          `end`,
      );
    } else if (isIOS) {
      // iOS: Try opening the app, fall back to App Store
      res.setHeader('Content-Type', 'text/html');
      res.send(`
                <html>
                <head>
                    <meta http-equiv="refresh" content="0;url=${appDeepLink}" />
                </head>
                <body>
                    <script>
                    setTimeout(function() {
                        window.location = "${this.iosAppStoreUrl}";
                    }, 1000);
                    </script>
                </body>
                </html>
            `);
    } else {
      // // Fallback for non-mobile devices (e.g., web page)
      // res.redirect(`${this.configService.get<string>('APP_URL')}/web/product/${productId}`);
      return res
        .status(500)
        .json({ message: 'Không hỗ trợ trên thiết bị này' });
    }
  }
}
