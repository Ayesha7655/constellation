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
import { SearchFilterProvenance } from '../enums';
import { FreelancerProfile } from './freelancer-profile.model';
import { Organization } from './organization.model';
import { User } from './user.model';

@Table({ tableName: 'search_filter_sets', underscored: true })
export class SearchFilterSet extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: false, field: 'org_id' })
  declare orgId: string;

  @ForeignKey(() => FreelancerProfile)
  @Column({ type: DataType.UUID, allowNull: false, unique: true, field: 'freelancer_profile_id' })
  declare freelancerProfileId: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'actor_id' })
  declare actorId: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  declare filters: Record<string, unknown>;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: SearchFilterProvenance.MANUAL,
  })
  declare provenance: SearchFilterProvenance;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true, field: 'updated_by_user_id' })
  declare updatedByUserId: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Organization)
  declare organization: Organization;

  @BelongsTo(() => FreelancerProfile)
  declare freelancerProfile: FreelancerProfile;

  @BelongsTo(() => User)
  declare updatedBy: User | null;
}
