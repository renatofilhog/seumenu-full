import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

const runDbE2e = process.env.RUN_DB_E2E === 'true';
const describeDbE2e = runDbE2e ? describe : describe.skip;

describeDbE2e('TenantAdmin License Renewal (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks anonymous renewal requests', async () => {
    await request(app.getHttpServer())
      .post('/tenant-admin/licenses/1/renew')
      .send({ addedDays: 30 })
      .expect(401);
  });
});
