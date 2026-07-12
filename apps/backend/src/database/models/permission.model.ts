import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { PermissionCategory } from './permission-category.model';
import { RolePermission } from './role-permission.model';

@Table({ tableName: 'permissions', underscored: true })
export class Permission extends Model {
  @PrimaryKey
  @Column(DataType.TEXT)
  declare key: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare name: Record<string, string>;

  @ForeignKey(() => PermissionCategory)
  @Column({ type: DataType.TEXT, allowNull: false })
  declare category: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare description: Record<string, string> | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isCore: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare sortOrder: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => PermissionCategory, 'category')
  declare categoryRef: PermissionCategory;

  @HasMany(() => RolePermission)
  declare rolePermissions: RolePermission[];
}
