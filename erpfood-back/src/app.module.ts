import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { ConfigModule } from '@nestjs/config';
import { ProductGroupModule } from './product-group/product-group.module';
import { ProductModule } from './product/product.module';
import { AdditionalModule } from './additional/additional.module';
import { MesaModule } from './mesa/mesa.module';
import { PedidoModule } from './pedido/pedido.module';
import { PedidoItemModule } from './pedido-item/pedido-item.module';
import { PedidoStatusModule } from './pedido-status/pedido-status.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StoreModule } from './store/store.module';
import { LicenseModule } from './license/license.module';
import { LicenseAccessGuard } from './license/license-access.guard';
import { License } from './license/entities/license.entity';
import { TenantAdminModule } from './tenant-admin/tenant-admin.module';
import { TenantDomain } from './tenant/entities/tenant-domain.entity';
import { Tenant } from './tenant/entities/tenant.entity';
import { TenantUser } from './tenant/entities/tenant-user.entity';
import { TenantResolutionMiddleware } from './tenant/tenant-resolution.middleware';
import { TenantAccessGuard } from './tenant/tenant-access.guard';
import { TenantPublicController } from './tenant/tenant-public.controller';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { StorageModule } from './storage/storage.module';
import { FilesModule } from './files/files.module';
import { SaasManagementModule } from './saas/saas-management.module';
import { ForcePasswordChangeGuard } from './auth/guards/force-password-change.guard';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SecurityModule,
    StorageModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNC === 'true',
    }),
    TypeOrmModule.forFeature([Tenant, TenantDomain, TenantUser, License]),
    UserModule,
    RoleModule,
    PermissionModule,
    ProductGroupModule,
    ProductModule,
    AdditionalModule,
    MesaModule,
    PedidoModule,
    PedidoItemModule,
    PedidoStatusModule,
    AuthModule,
    DashboardModule,
    StoreModule,
    LicenseModule,
    TenantAdminModule,
    SaasManagementModule,
    FilesModule,
  ],
  controllers: [AppController, TenantPublicController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: TenantAccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ForcePasswordChangeGuard,
    },
    {
      provide: APP_GUARD,
      useClass: LicenseAccessGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, TenantResolutionMiddleware).forRoutes('*');
  }
}
