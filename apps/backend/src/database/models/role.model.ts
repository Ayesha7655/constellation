import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript';
import { RolePermission } from './role-permission.model';
import { UserRole } from './user-role.model';
import { UserSession } from './user-session.model';
import { User } from './user.model';

@Table({ tableName: 'roles', underscored: true })
export class Role extends Model {
  @PrimaryKey
  @Column(DataType.TEXT)
  declare key: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare displayName: Record<string, string>;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @HasMany(() => User, 'primaryRoleKey')
  declare primaryUsers: User[];

  @HasMany(() => UserRole)
  declare userRoles: UserRole[];

  @HasMany(() => RolePermission)
  declare rolePermissions: RolePermission[];

  @HasMany(() => UserSession, 'activeRoleKey')
  declare activeRoleSessions: UserSession[];
}
