import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LampsModule } from './lamps/lamps.module';
import { CategoriesModule } from './lamps/categories.module';
import { ConfiguratorModule } from './configurator/configurator.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    // Configurazione globale — legge il .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Prisma globale — disponibile ovunque
    PrismaModule,

    AuthModule,

    LampsModule,

    CategoriesModule,

    ConfiguratorModule,

    CartModule,

    OrdersModule,

    // I moduli verranno aggiunti qui man mano:
    // AuthModule,
    // UsersModule,
    // LampsModule,
    // ComponentsModule,
    // ConfiguratorModule,
    // CartModule,
    // OrdersModule,
  ],
})
export class AppModule {}