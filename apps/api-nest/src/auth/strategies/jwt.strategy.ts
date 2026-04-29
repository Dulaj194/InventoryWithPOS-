import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUserContext } from '../../common/types/authenticated-request';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  outletId?: string;
  roles: string[];
  isSuperAdmin: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_ACCESS_SECRET',
        'change_me_access_secret',
      ),
    });
  }

  validate(payload: JwtPayload): AuthUserContext {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      outletId: payload.outletId,
      roles: payload.roles ?? [],
      isSuperAdmin: payload.isSuperAdmin,
    };
  }
}
