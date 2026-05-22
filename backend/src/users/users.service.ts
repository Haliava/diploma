import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Role } from '../common/enums/role.enum';
import { CreateUserInput } from './dto/create-user.input';
import { UserResponseDto } from './dto/user-response.dto';
import { User, UserDocument } from './schemas/user.schema';

type MongoDuplicateKeyError = Error & {
  code?: number;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(input: CreateUserInput): Promise<UserDocument> {
    try {
      return await this.userModel.create({
        ...input,
        role: input.role ?? Role.User,
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('User with this phone already exists');
      }

      throw error;
    }
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.userModel.findById(id).exec();
  }

  async findActiveById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.userModel.findOne({ _id: id, isActive: true }).exec();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone }).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateRefreshTokenHash(
    userId: string | Types.ObjectId,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { $set: { refreshTokenHash } })
      .exec();
  }

  toResponse(user: UserDocument): UserResponseDto {
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    };
  }

  private isDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
    return error instanceof Error && (error as MongoDuplicateKeyError).code === 11000;
  }
}
