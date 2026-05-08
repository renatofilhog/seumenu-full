import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AuthAccessExceptionFilter } from './common/filters/auth-access-exception.filter';
import { DataSource } from 'typeorm';
import { TenantCorsOriginResolver } from './common/cors/tenant-cors-origin-resolver';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000'];
  const corsCacheTtlMs = Number(process.env.CORS_DOMAIN_CACHE_TTL_MS ?? 60000);
  const dataSource = app.get(DataSource);
  const corsOriginResolver = new TenantCorsOriginResolver(dataSource, corsOrigins, corsCacheTtlMs);

  app.enableCors({
    origin: (origin, callback) => {
      void corsOriginResolver
        .isAllowed(origin)
        .then((allowed) => callback(null, allowed))
        .catch(() => callback(new Error('CORS origin validation failed'), false));
    },
    credentials: true,
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.useGlobalFilters(new AuthAccessExceptionFilter());
  
  const configSwagger = new DocumentBuilder()
    .setTitle('ERPFood API')
    .setDescription('Documentação da API do ERPFood')
    .setVersion('1.0-BETA')
    .addBearerAuth()
    .build();

  const documentSwagger = SwaggerModule.createDocument(app, configSwagger, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup('api-docs', app, documentSwagger, {
    jsonDocumentUrl: 'api-docs.json',
    yamlDocumentUrl: 'api-docs.yaml',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
