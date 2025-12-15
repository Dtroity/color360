import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RequestWithUser extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * Guard для проверки ролей пользователя
 * Работает в паре с @Roles() декоратором
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Получить требуемые роли из метаданных декоратора @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Если роли не указаны - доступ разрешен
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Проверка наличия пользователя (должен быть авторизован)
    if (!user) {
      throw new ForbiddenException('Требуется авторизация');
    }

    // Проверка наличия требуемой роли
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Доступ запрещен. Требуется одна из ролей: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
