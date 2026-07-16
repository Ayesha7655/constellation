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
import { ScrapeRunStatus, ScrapeRunTrigger } from '../enums';
import { FreelancerProfile } from './freelancer-profile.model';
import { Organization } from './organization.model';
import { UpworkJob } from './upwork-job.model';

@Table({ tableName: 'scrape_runs', underscored: true })
export class ScrapeRun extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: false, field: 'org_id' })
  declare orgId: string;

  @ForeignKey(() => FreelancerProfile)
  @Column({ type: DataType.UUID, allowNull: false, field: 'freelancer_profile_id' })
  declare freelancerProfileId: string;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: ScrapeRunStatus.QUEUED })
  declare status: ScrapeRunStatus;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: ScrapeRunTrigger.MANUAL })
  declare trigger: ScrapeRunTrigger;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'actor_id' })
  declare actorId: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'apify_run_id' })
  declare apifyRunId: string | null;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {}, field: 'filters_snapshot' })
  declare filtersSnapshot: Record<string, unknown>;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare error: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, field: 'total_fetched' })
  declare totalFetched: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, field: 'total_filtered' })
  declare totalFiltered: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, field: 'total_saved' })
  declare totalSaved: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, field: 'total_new' })
  declare totalNew: number;

  @Column({ type: DataType.DATE, allowNull: true, field: 'started_at' })
  declare startedAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'finished_at' })
  declare finishedAt: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Organization)
  declare organization: Organization;

  @BelongsTo(() => FreelancerProfile)
  declare freelancerProfile: FreelancerProfile;

  @HasMany(() => UpworkJob)
  declare jobs: UpworkJob[];
}
