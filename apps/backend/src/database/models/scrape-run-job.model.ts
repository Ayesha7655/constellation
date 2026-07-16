import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { FreelancerProfile } from './freelancer-profile.model';
import { Organization } from './organization.model';
import { ScrapeRun } from './scrape-run.model';
import { UpworkJob } from './upwork-job.model';

@Table({ tableName: 'scrape_run_jobs', underscored: true, updatedAt: false })
export class ScrapeRunJob extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: false, field: 'org_id' })
  declare orgId: string;

  @ForeignKey(() => ScrapeRun)
  @Column({ type: DataType.UUID, allowNull: false, field: 'scrape_run_id' })
  declare scrapeRunId: string;

  @ForeignKey(() => UpworkJob)
  @Column({ type: DataType.UUID, allowNull: false, field: 'upwork_job_id' })
  declare upworkJobId: string;

  @ForeignKey(() => FreelancerProfile)
  @Column({ type: DataType.UUID, allowNull: false, field: 'freelancer_profile_id' })
  declare freelancerProfileId: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_new' })
  declare isNew: boolean;

  @CreatedAt
  declare createdAt: Date;

  @BelongsTo(() => Organization)
  declare organization: Organization;

  @BelongsTo(() => ScrapeRun)
  declare scrapeRun: ScrapeRun;

  @BelongsTo(() => UpworkJob)
  declare upworkJob: UpworkJob;

  @BelongsTo(() => FreelancerProfile)
  declare freelancerProfile: FreelancerProfile;
}
