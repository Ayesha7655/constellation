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
import { ProposalDraftProvenance, ProposalDraftSource, ProposalDraftStatus } from '../enums';
import { FreelancerProfile } from './freelancer-profile.model';
import { Organization } from './organization.model';
import { ProposalAttachment } from './proposal-attachment.model';
import { UpworkJob } from './upwork-job.model';

@Table({ tableName: 'proposal_drafts', underscored: true })
export class ProposalDraft extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: false, field: 'org_id' })
  declare orgId: string;

  @ForeignKey(() => FreelancerProfile)
  @Column({ type: DataType.UUID, allowNull: false, field: 'freelancer_profile_id' })
  declare freelancerProfileId: string;

  @ForeignKey(() => UpworkJob)
  @Column({ type: DataType.UUID, allowNull: false, field: 'upwork_job_id' })
  declare upworkJobId: string;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: '' })
  declare body: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: ProposalDraftStatus.DRAFT,
  })
  declare status: ProposalDraftStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: ProposalDraftProvenance.AI,
  })
  declare provenance: ProposalDraftProvenance;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: ProposalDraftSource.WEB,
  })
  declare source: ProposalDraftSource;

  @Column({ type: DataType.JSONB, allowNull: true, field: 'model_meta' })
  declare modelMeta: Record<string, unknown> | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Organization)
  declare organization: Organization;

  @BelongsTo(() => FreelancerProfile)
  declare freelancerProfile: FreelancerProfile;

  @BelongsTo(() => UpworkJob)
  declare upworkJob: UpworkJob;

  @HasMany(() => ProposalAttachment)
  declare attachments: ProposalAttachment[];
}
