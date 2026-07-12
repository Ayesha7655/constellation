import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Op } from 'sequelize';
import { USER_ID_ATTRS, USER_ROLE_MEMBERSHIP_ATTRS } from '../../../database/attributes';
import { UserStatus } from '../../../database/enums';
import { UserRole } from '../../../database/models/user-role.model';
import { User } from '../../../database/models/user.model';
import type { JwtPayload } from '../../../common/types/request.types';
import { SessionService } from '../../session/session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly sessionService: SessionService,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(UserRole) private readonly userRoleModel: typeof UserRole,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      issuer: configService.getOrThrow<string>('JWT_ISSUER'),
      audience: configService.getOrThrow<string>('JWT_AUDIENCE'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }
    const sessionId = payload.sid;
    if (!sessionId) {
      throw new UnauthorizedException('Invalid token');
    }
    const userId = payload.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    const sessionValidation = await this.sessionService.validateAccessTokenSession({
      sessionId,
      accessTokenJti: payload.jti,
    });
    if (!sessionValidation.valid || sessionValidation.userId !== userId) {
      throw new UnauthorizedException('Token revoked');
    }

    const user = await this.userModel.findOne({
      where: {
        id: userId,
        deletedAt: null,
        status: { [Op.notIn]: [UserStatus.DELETED, UserStatus.DEACTIVATED, UserStatus.SUSPENDED] },
      },
      attributes: [...USER_ID_ATTRS],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    const roleKey = payload.role?.trim();
    if (!roleKey) {
      throw new UnauthorizedException('Invalid token');
    }

    const membership = await this.userRoleModel.findOne({
      where: { userId, roleKey },
      attributes: [...USER_ROLE_MEMBERSHIP_ATTRS],
    });
    if (!membership) {
      throw new UnauthorizedException('Token revoked');
    }

    return payload;
  }
}
