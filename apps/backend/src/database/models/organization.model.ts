import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({ tableName: 'organizations', paranoid: true, underscored: true })
export class Organization extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare name: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare address: string | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'extension_connected_at' })
  declare extensionConnectedAt: Date | null;

  /** Org Upwork relevancy weights + color thresholds; null → shared defaults. */
  @Column({ type: DataType.JSONB, allowNull: true, field: 'upwork_scoring_config' })
  declare upworkScoringConfig: Record<string, unknown> | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;

  @HasMany(() => User)
  declare users: User[];
}
