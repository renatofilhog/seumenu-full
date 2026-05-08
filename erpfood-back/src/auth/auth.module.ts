import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../user/entities/user.entity';
import { SaasManagementUser } from 'src/saas/entities/saas-management-user.entity';
import { SecurityModule } from 'src/security/security.module';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { TenantUser } from 'src/tenant/entities/tenant-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, SaasManagementUser, TenantUser]),
    SecurityModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'changeme',
        signOptions: {
          expiresIn: configService.get<number>('JWT_EXPIRES_IN') ?? 43200,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
