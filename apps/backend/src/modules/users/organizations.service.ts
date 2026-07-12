import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ORG } from '@constellation/shared';
import { requireAuthUserId } from '../../common/utils/require-auth-user-id';
import { ORG_PROFILE_ATTRS, USER_ORG_LOOKUP_ATTRS } from '../../database/attributes';
import { Organization } from '../../database/models/organization.model';
import { User } from '../../database/models/user.model';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization) private readonly organizationModel: typeof Organization,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async updateOrgProfile(userId: string | undefined, dto: UpdateOrganizationProfileDto) {
    const id = requireAuthUserId(userId);
    const user = await this.userModel.findOne({
      where: { id, deletedAt: null },
      attributes: [...USER_ORG_LOOKUP_ATTRS],
    });
    if (!user?.orgId) {
      throw new NotFoundException('Organization not found');
    }

    const [updatedCount] = await this.organizationModel.update(
      {
        name: dto.name.trim(),
        address: dto.address.trim(),
      },
      { where: { id: user.orgId, deletedAt: null } },
    );
    if (updatedCount === 0) {
      throw new NotFoundException('Organization not found');
    }

    const organization = await this.organizationModel.findByPk(user.orgId, {
      attributes: [...ORG_PROFILE_ATTRS],
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      orgId: organization.id,
      orgName: organization.name,
      orgAddress: organization.address,
    };
  }

  static requiredPermissions = [ORG.PROFILE_UPDATE] as const;
}
