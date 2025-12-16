import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Найти пользователя по ID
   */
  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Пользователь с id ${id} не найден`);
    }
    return user;
  }

  /**
   * Найти пользователя по email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Смена пароля пользователя
   * @param userId ID пользователя
   * @param currentPassword Текущий пароль
   * @param newPassword Новый пароль
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Валидация нового пароля
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Новый пароль должен содержать минимум 8 символов');
    }

    // Найти пользователя
    const user = await this.findById(userId);

    // Проверить текущий пароль
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Неверный текущий пароль');
    }

    // Проверить, что новый пароль отличается от текущего
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('Новый пароль должен отличаться от текущего');
    }

    // Хешировать новый пароль
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Обновить пароль
    user.passwordHash = newPasswordHash;
    await this.userRepository.save(user);
  }

  /**
   * Обновить информацию о пользователе
   */
  async update(userId: number, data: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    Object.assign(user, data);
    return this.userRepository.save(user);
  }
}

