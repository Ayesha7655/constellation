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
import { FreelancerProfile } from './freelancer-profile.model';
import { Organization } from './organization.model';

@Table({ tableName: 'proposal_style_packs', underscored: true })
export class ProposalStylePack extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: false, field: 'org_id' })
  declare orgId: string;

  @ForeignKey(() => FreelancerProfile)
  @Column({ type: DataType.UUID, allowNull: false, unique: true, field: 'freelancer_profile_id' })
  declare freelancerProfileId: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  declare preferences: Record<string, unknown>;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Organization)
  declare organization: Organization;

  @BelongsTo(() => FreelancerProfile)
  declare freelancerProfile: FreelancerProfile;
}
