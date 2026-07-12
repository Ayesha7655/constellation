import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Role } from './role.model';
import { User } from './user.model';

@Table({ tableName: 'user_roles', underscored: true, updatedAt: false })
export class UserRole extends Model {
  @PrimaryKey
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'user_id' })
  declare userId: string;

  @PrimaryKey
  @ForeignKey(() => Role)
  @Column({ type: DataType.TEXT, field: 'role_key' })
  declare roleKey: string;

  @CreatedAt
  declare createdAt: Date;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Role)
  declare role: Role;
}
