import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle(process.env.OPENAPI_TITLE as string)
    .setDescription(process.env.OPENAPI_DESCRIPTION as string)
    .setVersion(process.env.OPENAPI_VERSION as string)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(process.env.OPENAPI_ROUTE as string, app, document);

  await app.listen(3000);
}
bootstrap();
