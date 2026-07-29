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

export type PortfolioProjectLink = Readonly<{
  label?: string;
  url: string;
}>;

@Table({
  tableName: 'portfolio_projects',
  underscored: true,
  indexes: [
    {
      name: 'portfolio_projects_profile_external_uidx',
      unique: true,
      fields: ['freelancer_profile_id', 'external_id'],
    },
  ],
})
export class PortfolioProject extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => FreelancerProfile)
  @Column({ type: DataType.UUID, allowNull: false, field: 'freelancer_profile_id' })
  declare freelancerProfileId: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'external_id' })
  declare externalId: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare role: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  declare technologies: string[];

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  declare links: PortfolioProjectLink[];

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [], field: 'image_urls' })
  declare imageUrls: string[];

  @Column({ type: DataType.TEXT, allowNull: true, field: 'published_on' })
  declare publishedOn: string | null;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: 'extension' })
  declare source: string;

  @Column({ type: DataType.JSONB, allowNull: true, field: 'raw_snapshot' })
  declare rawSnapshot: Record<string, unknown> | null;

  @Column({ type: DataType.DATE, allowNull: false, field: 'scraped_at', defaultValue: DataType.NOW })
  declare scrapedAt: Date;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => FreelancerProfile)
  declare freelancerProfile: FreelancerProfile;
}
