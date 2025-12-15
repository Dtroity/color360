import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Декоратор для получения текущего пользователя из request
 * Использование: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Если указано конкретное поле - вернуть его
    return data ? user?.[data] : user;
  },
);
