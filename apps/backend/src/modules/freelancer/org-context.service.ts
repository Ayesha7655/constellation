import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { API_ERROR_CODES } from '@constellation/shared';
import { codedNotFound } from '../../common/exceptions/coded-http.exception';
import { requireAuthUserId } from '../../common/utils/require-auth-user-id';
import { USER_ORG_LOOKUP_ATTRS } from '../../database/attributes';
import { User } from '../../database/models/user.model';

@Injectable()
export class OrgContextService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  async requireOrgIdForUser(userId: string | undefined): Promise<{ userId: string; orgId: string }> {
    const id = requireAuthUserId(userId);
    const user = await this.userModel.findOne({
      where: { id, deletedAt: null },
      attributes: [...USER_ORG_LOOKUP_ATTRS],
    });
    if (!user?.orgId) {
      throw codedNotFound(API_ERROR_CODES.FREELANCER_PROFILE_ORG_REQUIRED);
    }
    return { userId: id, orgId: user.orgId };
  }
}
