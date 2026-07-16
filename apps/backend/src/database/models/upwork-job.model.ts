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
import { Organization } from './organization.model';
import { ScrapeRun } from './scrape-run.model';

@Table({ tableName: 'upwork_jobs', underscored: true })
export class UpworkJob extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: false, field: 'org_id' })
  declare orgId: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'external_job_id' })
  declare externalJobId: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'job_url' })
  declare jobUrl: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: '' })
  declare description: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare budget: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'job_type' })
  declare jobType: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'experience_level' })
  declare experienceLevel: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'client_location' })
  declare clientLocation: string | null;

  @Column({ type: DataType.DOUBLE, allowNull: true, field: 'client_rating' })
  declare clientRating: number | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'client_spent' })
  declare clientSpent: string | null;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  declare skills: string[];

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare proposals: number | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'posted_time' })
  declare postedTime: string | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'posted_at' })
  declare postedAt: Date | null;

  @ForeignKey(() => ScrapeRun)
  @Column({ type: DataType.UUID, allowNull: true, field: 'scrape_run_id' })
  declare scrapeRunId: string | null;

  @Column({ type: DataType.JSONB, allowNull: true, field: 'raw_payload' })
  declare rawPayload: Record<string, unknown> | null;

  @Column({ type: DataType.DATE, allowNull: false, field: 'scraped_at' })
  declare scrapedAt: Date;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Organization)
  declare organization: Organization;

  @BelongsTo(() => ScrapeRun)
  declare scrapeRun: ScrapeRun | null;
}
