import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

import { Role } from '../common/enums/role.enum';
import { WebhookEventType } from '../common/enums/webhook-event.enum';
import { UserDocument } from '../users/schemas/user.schema';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const userId = new Types.ObjectId();

const createUser = (): UserDocument =>
  ({
    _id: userId,
    id: userId.toString(),
    email: 'ivan@example.com',
    name: 'Ivan',
    role: Role.User,
    isActive: true,
    passwordHash: 'password-hash',
    refreshTokenHash: 'refresh-token-hash',
  }) as UserDocument;

describe('AuthService', () => {
  const configService = {
    get: jest.fn((key: string, fallback?: string) => fallback ?? key),
    getOrThrow: jest.fn((key: string) => key),
  };
  const eventEmitter = {
    emit: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const usersService = {
    create: jest.fn(),
    findActiveById: jest.fn(),
    findByEmail: jest.fn(),
    toResponse: jest.fn((user: UserDocument) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })),
    updateRefreshTokenHash: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      configService as never,
      eventEmitter as never,
      jwtService as never,
      usersService as never,
    );
  });

  it('registers a user, emits event, and returns tokens', async () => {
    const user = createUser();

    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(user);
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    jest
      .mocked(bcrypt.hash)
      .mockResolvedValueOnce('password-hash' as never)
      .mockResolvedValueOnce('refresh-hash' as never);

    const result = await service.register({
      email: user.email,
      name: user.name,
      password: 'password123',
    });

    expect(usersService.create).toHaveBeenCalledWith({
      email: user.email,
      name: user.name,
      passwordHash: 'password-hash',
    });
    expect(usersService.updateRefreshTokenHash).toHaveBeenCalledWith(
      user._id,
      'refresh-hash',
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      WebhookEventType.UserCreated,
      {
        user: usersService.toResponse(user),
      },
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: usersService.toResponse(user),
    });
  });

  it('rejects registration when email is already used', async () => {
    usersService.findByEmail.mockResolvedValue(createUser());

    await expect(
      service.register({
        email: 'ivan@example.com',
        name: 'Ivan',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in an active user with a valid password', async () => {
    const user = createUser();

    usersService.findByEmail.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    jest.mocked(bcrypt.hash).mockResolvedValue('refresh-hash' as never);
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(
      service.login({ email: user.email, password: 'password123' }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('rejects login for invalid password', async () => {
    usersService.findByEmail.mockResolvedValue(createUser());
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      service.login({ email: 'ivan@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('clears refresh token hash on logout', async () => {
    await service.logout(userId.toString());

    expect(usersService.updateRefreshTokenHash).toHaveBeenCalledWith(
      userId.toString(),
      null,
    );
  });
});
