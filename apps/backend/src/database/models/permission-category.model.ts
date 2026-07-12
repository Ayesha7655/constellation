import { Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Permission } from './permission.model';

@Table({ tableName: 'permission_categories', underscored: true })
export class PermissionCategory extends Model {
  @PrimaryKey
  @Column(DataType.TEXT)
  declare key: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare label: Record<string, string>;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare sortOrder: number;

  @HasMany(() => Permission, 'category')
  declare permissions: Permission[];
}
