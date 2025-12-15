import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Декоратор для указания требуемых ролей
 * Использование: @Roles('admin', 'manager')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
