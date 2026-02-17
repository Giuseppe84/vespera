import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() rende PrismaService disponibile in tutti i moduli
// senza doverlo importare ogni volta
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}