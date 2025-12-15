import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard
 * Использует Passport стратегию 'jwt' для проверки токена
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Вызов базовой логики AuthGuard для валидации JWT
    return super.canActivate(context);
  }
}
