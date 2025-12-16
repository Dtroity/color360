import {
  Controller,
  Patch,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@ApiTags('Admin Profile')
@Controller('admin/profile')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('change-password')
  @ApiOperation({
    summary: 'Смена пароля администратора',
    description: 'Позволяет администратору изменить свой пароль. Требует текущий пароль для подтверждения.',
  })
  @ApiResponse({
    status: 200,
    description: 'Пароль успешно изменен',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Пароль успешно изменен' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный текущий пароль или слабый новый пароль',
  })
  @ApiResponse({
    status: 401,
    description: 'Требуется авторизация',
  })
  async changePassword(
    @CurrentUser() user: { id: number; email: string; role: string },
    @Body() dto: { currentPassword: string; newPassword: string; confirmPassword: string },
  ) {
    // Валидация входных данных
    if (!dto.currentPassword || !dto.newPassword || !dto.confirmPassword) {
      throw new BadRequestException('Все поля обязательны для заполнения');
    }

    // Проверка совпадения нового пароля и подтверждения
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Новый пароль и подтверждение не совпадают');
    }

    // Валидация длины пароля
    if (dto.newPassword.length < 8) {
      throw new BadRequestException('Новый пароль должен содержать минимум 8 символов');
    }

    // Смена пароля через сервис
    await this.usersService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );

    return {
      message: 'Пароль успешно изменен',
    };
  }
}

