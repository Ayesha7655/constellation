import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { SessionPlatform } from '../enums';
import { Role } from './role.model';
import { User } from './user.model';

@Table({ tableName: 'user_sessions', underscored: true, updatedAt: false })
export class UserSession extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  declare userId: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'refresh_token_hash' })
  declare refreshTokenHash: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'access_token_jti' })
  declare accessTokenJti: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'device_id' })
  declare deviceId: string | null;

  @Default(SessionPlatform.WEB)
  @Column({ type: DataType.ENUM(...Object.values(SessionPlatform)), allowNull: false })
  declare platform: SessionPlatform;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'ip_address' })
  declare ipAddress: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'user_agent' })
  declare userAgent: string | null;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false, field: 'is_revoked' })
  declare isRevoked: boolean;

  @ForeignKey(() => Role)
  @Column({ type: DataType.TEXT, allowNull: false, field: 'active_role_key' })
  declare activeRoleKey: string;

  @CreatedAt
  declare createdAt: Date;

  @Column({ type: DataType.DATE, allowNull: false, field: 'last_active_at' })
  declare lastActiveAt: Date;

  @Column({ type: DataType.DATE, allowNull: true, field: 'revoked_at' })
  declare revokedAt: Date | null;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Role, 'activeRoleKey')
  declare activeRole: Role;
}
