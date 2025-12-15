import { applyDecorators, UseGuards } from '@nestjs/common';
import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
class RecaptchaGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const body = request.body || {};
    const token: string | undefined = body.recaptchaToken || body.token || body['g-recaptcha-response'];
    if (!token) {
      throw new BadRequestException('Recaptcha token is missing');
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      // Без секретного ключа нельзя валидировать — в деве можно падать сразу
      throw new BadRequestException('Recaptcha secret key not configured');
    }

    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    if (request.ip) {
      params.append('remoteip', request.ip);
    }

    let json: any;
    try {
      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      json = await res.json();
    } catch (e) {
      throw new BadRequestException('Recaptcha verification failed');
    }

    if (!json || !json.success) {
      throw new BadRequestException('Recaptcha invalid');
    }

    const score = typeof json.score === 'number' ? json.score : 0;
    if (score < 0.5) {
      throw new BadRequestException('Recaptcha score too low');
    }

    // Валидация пройдена
    return true;
  }
}

export function VerifyRecaptcha() {
  return applyDecorators(UseGuards(RecaptchaGuard));
}

// Применение:
// @Post()
// @VerifyRecaptcha()
// createOrder(@Body() dto: CreateOrderDto) { ... }
// Или для формы обратной связи.