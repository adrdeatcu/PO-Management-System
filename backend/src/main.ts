import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('frontendUrl');
  const port = configService.get<number>('port');

  // Global prefix — all routes will be /api/v1/...
  app.setGlobalPrefix('api/v1');

  // CORS — only allow requests from our Next.js frontend
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Global pipes and filters applied to every route
  app.useGlobalPipes(new GlobalValidationPipe());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  await app.listen(port ?? 3001);
  console.log(`Backend running on http://localhost:${port ?? 3001}/api/v1`);
}

bootstrap();
