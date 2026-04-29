import { Module } from '@nestjs/common';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const accessTtl = configService.get<string>('JWT_ACCESS_TTL', '15m');

        return {
          secret: configService.get<string>(
            'JWT_ACCESS_SECRET',
            'change_me_access_secret',
          ),
          signOptions: {
            expiresIn: accessTtl as JwtSignOptions['expiresIn'],
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, TenantGuard],
  exports: [AuthService, JwtStrategy, PassportModule, TenantGuard],
})
export class AuthModule {}
