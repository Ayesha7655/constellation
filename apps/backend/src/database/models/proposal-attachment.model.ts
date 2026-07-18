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
import { ProposalDraft } from './proposal-draft.model';
import { ProposalExample } from './proposal-example.model';

/**
 * Document attached to a proposal draft or example.
 * Exactly one of `proposalDraftId` / `proposalExampleId` is set (enforced in SQL).
 * `storageKey` is the object-store path (e.g. constellation/proposal-attachments/…).
 */
@Table({
  tableName: 'proposal_attachments',
  underscored: true,
  indexes: [
    { name: 'proposal_attach_org_id_idx', fields: ['org_id'] },
    { name: 'proposal_attach_profile_id_idx', fields: ['freelancer_profile_id'] },
    { name: 'proposal_attach_draft_sort_idx', fields: ['proposal_draft_id', 'sort_order'] },
    { name: 'proposal_attach_example_sort_idx', fields: ['proposal_example_id', 'sort_order'] },
  ],
})
export class ProposalAttachment extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: false, field: 'org_id' })
  declare orgId: string;

  @ForeignKey(() => FreelancerProfile)
  @Column({ type: DataType.UUID, allowNull: false, field: 'freelancer_profile_id' })
  declare freelancerProfileId: string;

  @ForeignKey(() => ProposalDraft)
  @Column({ type: DataType.UUID, allowNull: true, field: 'proposal_draft_id' })
  declare proposalDraftId: string | null;

  @ForeignKey(() => ProposalExample)
  @Column({ type: DataType.UUID, allowNull: true, field: 'proposal_example_id' })
  declare proposalExampleId: string | null;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true, field: 'storage_key' })
  declare storageKey: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'file_name' })
  declare fileName: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'mime_type' })
  declare mimeType: string;

  @Column({ type: DataType.BIGINT, allowNull: false, field: 'size_bytes' })
  declare sizeBytes: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1, field: 'sort_order' })
  declare sortOrder: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Organization)
  declare organization: Organization;

  @BelongsTo(() => FreelancerProfile)
  declare freelancerProfile: FreelancerProfile;

  @BelongsTo(() => ProposalDraft)
  declare proposalDraft: ProposalDraft | null;

  @BelongsTo(() => ProposalExample)
  declare proposalExample: ProposalExample | null;
}
