import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LampsModule } from './lamps/lamps.module';
import { ConfiguratorModule } from './configurator/configurator.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AuthModule,
    LampsModule,
    ConfiguratorModule,
    CartModule,
    OrdersModule,
  ],
})
export class AppModule {}
