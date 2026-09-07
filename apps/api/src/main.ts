import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3002',
    credentials: true,
  });
  
  // Global prefix
  app.setGlobalPrefix('api/v1');
  
  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 3001);
  
  try {
    await app.listen(port);
    console.log(`🚀 Apointli API running on http://localhost:${port}/api/v1`);
    console.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use.`);
      console.log(`💡 Try: fuser -k ${port}/tcp`);
      console.log(`💡 Or use a different port: PORT=3003 npm run start:dev`);
    } else {
      console.error('❌ Failed to start server:', error);
    }
  }
}
bootstrap();
