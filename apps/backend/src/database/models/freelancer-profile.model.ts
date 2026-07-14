import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { FreelancerProfileSource } from '../enums';
import { Organization } from './organization.model';

@Table({ tableName: 'freelancer_profiles', underscored: true })
export class FreelancerProfile extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: false, unique: true, field: 'org_id' })
  declare orgId: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare title: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare overview: string | null;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  declare skills: string[];

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'hourly_rate_min' })
  declare hourlyRateMin: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'hourly_rate_max' })
  declare hourlyRateMax: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare country: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare timezone: string | null;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  declare languages: string[];

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  declare exclusions: string[];

  @Column({ type: DataType.TEXT, allowNull: true, field: 'profile_url' })
  declare profileUrl: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: FreelancerProfileSource.MANUAL,
  })
  declare source: FreelancerProfileSource;

  @Column({ type: DataType.JSONB, allowNull: true, field: 'raw_snapshot' })
  declare rawSnapshot: Record<string, unknown> | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Organization)
  declare organization: Organization;
}
