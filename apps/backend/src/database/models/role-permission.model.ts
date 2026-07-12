import { BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Permission } from './permission.model';
import { Role } from './role.model';

@Table({ tableName: 'role_permissions', underscored: true })
export class RolePermission extends Model {
  @PrimaryKey
  @ForeignKey(() => Role)
  @Column({ type: DataType.TEXT, field: 'role_key' })
  declare roleKey: string;

  @PrimaryKey
  @ForeignKey(() => Permission)
  @Column({ type: DataType.TEXT, field: 'permission_key' })
  declare permissionKey: string;

  @BelongsTo(() => Role)
  declare role: Role;

  @BelongsTo(() => Permission)
  declare permission: Permission;
}
