import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { validate } from '@/utils/env';
import { BookingModule } from '@/booking/booking.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate
    }),
    BookingModule
],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
