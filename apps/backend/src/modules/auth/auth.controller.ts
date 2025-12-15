import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Post('login')
  @ApiOperation({ 
    summary: 'Вход в систему', 
    description: 'Аутентификация пользователя по email и паролю' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@hiwatch.ru' },
        password: { type: 'string', example: 'admin123' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Успешный вход',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
        access_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Неверный email или пароль' 
  })
  async login(@Body() loginDto: { email: string; password: string }) {
    console.log('========================================');
    console.log('LOGIN ATTEMPT:', {
      email: loginDto.email,
      password: '***', // Не логируем пароль
      timestamp: new Date().toISOString(),
    });
    console.log('========================================');

    const { email, password } = loginDto;

    // Временная проверка для демо (в продакшене использовать БД и bcrypt)
    if (email === 'admin@hiwatch.ru' && password === 'admin123') {
      const response = {
        success: true,
        user: {
          id: 1,
          email: 'admin@hiwatch.ru',
          role: 'admin',
        },
        access_token: 'mock-jwt-token-' + Date.now(),
      };

      console.log('========================================');
      console.log('LOGIN SUCCESS:', {
        user: response.user,
        token: response.access_token.substring(0, 20) + '...',
        timestamp: new Date().toISOString(),
      });
      console.log('========================================');

      return response;
    }

    console.log('========================================');
    console.log('LOGIN FAILED: Invalid credentials', {
      email: loginDto.email,
      timestamp: new Date().toISOString(),
    });
    console.log('========================================');

    throw new UnauthorizedException('Неверный email или пароль');
  }
}

