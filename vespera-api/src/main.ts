import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefisso globale per tutte le route
  app.setGlobalPrefix('api/v1');

  // Validazione automatica dei DTO con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // rimuove campi non dichiarati nel DTO
      forbidNonWhitelisted: true, // lancia errore se arrivano campi extra
      transform: true,        // converte automaticamente i tipi (es. string → number)
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Vespera API')
    .setDescription('E-Commerce API per lampade 3D stampate')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Autenticazione e autorizzazione')
    .addTag('users', 'Gestione utenti')
    .addTag('lamps', 'Catalogo lampade')
    .addTag('components', 'Componenti 3D')
    .addTag('configurator', 'Configuratore lampade')
    .addTag('cart', 'Carrello')
    .addTag('orders', 'Ordini')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();