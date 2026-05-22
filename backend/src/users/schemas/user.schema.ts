import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { Role } from '../../common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  phone: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.User,
  })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, default: null })
  refreshTokenHash?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
