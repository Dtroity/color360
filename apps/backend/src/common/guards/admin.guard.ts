import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface RequestWithUser extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * Guard для защиты админских роутов
 * Проверяет наличие JWT токена и роль администратора
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Проверка 1: Пользователь авторизован (JWT валиден)
    if (!user) {
      throw new UnauthorizedException(
        'Требуется авторизация. Пожалуйста, войдите в систему.',
      );
    }

    // Проверка 2: Роль пользователя = 'admin'
    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Доступ запрещен. Требуются права администратора.',
      );
    }

    return true;
  }
}
