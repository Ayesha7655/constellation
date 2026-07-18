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
import { ProposalExampleSource } from '../enums';
import { FreelancerProfile } from './freelancer-profile.model';
import { Organization } from './organization.model';
import { ProposalAttachment } from './proposal-attachment.model';

@Table({ tableName: 'proposal_examples', underscored: true })
export class ProposalExample extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: false, field: 'org_id' })
  declare orgId: string;

  @ForeignKey(() => FreelancerProfile)
  @Column({ type: DataType.UUID, allowNull: false, field: 'freelancer_profile_id' })
  declare freelancerProfileId: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare title: string | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare body: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'job_context' })
  declare jobContext: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_starred' })
  declare isStarred: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: ProposalExampleSource.UPLOAD,
  })
  declare source: ProposalExampleSource;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Organization)
  declare organization: Organization;

  @BelongsTo(() => FreelancerProfile)
  declare freelancerProfile: FreelancerProfile;

  @HasMany(() => ProposalAttachment)
  declare attachments: ProposalAttachment[];
}
