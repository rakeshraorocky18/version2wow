import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const details = errors.map((err) => ({
          property: err.property,
          value: err.value,
          constraints: err.constraints,
        }));
        // Surface the real validation failure in the Nest terminal (not just HTTP 400).
        console.error(
          '[ValidationPipe] Bad Request — validation failed:',
          JSON.stringify(details, null, 2),
        );
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: details,
        });
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('WOW - World of Weddings API')
    .setDescription('API documentation for the WOW platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('matches', 'Matchmaking')
    .addTag('chat', 'Communication')
    .addTag('vendors', 'Vendor marketplace')
    .addTag('planner', 'Wedding planner')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🎉 WOW API running on http://localhost:${port}`);
  console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
