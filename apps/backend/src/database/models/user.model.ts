import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { AuthProvider, UserStatus } from '../enums';
import { Organization } from './organization.model';
import { Role } from './role.model';
import { UserRole } from './user-role.model';
import { UserSession } from './user-session.model';

@Table({ tableName: 'users', paranoid: true, underscored: true })
export class User extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.TEXT, allowNull: true, unique: true, field: 'firebase_uid' })
  declare firebaseUid: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'photo_url' })
  declare photoUrl: string | null;

  @Column({ type: DataType.ENUM(...Object.values(AuthProvider)), allowNull: false, field: 'auth_provider' })
  declare authProvider: AuthProvider;

  @Column({ type: DataType.DATE, allowNull: true, field: 'email_verified_at' })
  declare emailVerifiedAt: Date | null;

  @Column({ type: DataType.ENUM(...Object.values(UserStatus)), allowNull: false, defaultValue: UserStatus.ACTIVE })
  declare status: UserStatus;

  @ForeignKey(() => Role)
  @Column({ type: DataType.TEXT, allowNull: false, field: 'primary_role_key' })
  declare primaryRoleKey: string;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: true, field: 'org_id' })
  declare orgId: string | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'last_login_at' })
  declare lastLoginAt: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;

  @BelongsTo(() => Role, 'primaryRoleKey')
  declare primaryRole: Role;

  @BelongsTo(() => Organization)
  declare organization: Organization | null;

  @HasMany(() => UserRole)
  declare userRoles: UserRole[];

  @HasMany(() => UserSession)
  declare sessions: UserSession[];
}
