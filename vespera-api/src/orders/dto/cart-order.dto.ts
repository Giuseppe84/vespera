import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── CART ────────────────────────────────────────────────────

export class AddToCartDto {
  @ApiProperty({ example: 'cuid-della-lampada' })
  @IsString()
  lampId: string;

  @ApiPropertyOptional({ example: 'cuid-della-variante' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ example: 'cuid-della-configurazione' })
  @IsOptional()
  @IsString()
  configurationId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity?: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

// ─── ORDER ───────────────────────────────────────────────────

export class CreateOrderDto {
  @ApiProperty({ example: 'cuid-indirizzo-spedizione' })
  @IsString()
  shippingAddressId: string;

  @ApiProperty({ example: 'cuid-indirizzo-fatturazione' })
  @IsString()
  billingAddressId: string;

  @ApiPropertyOptional({ example: 'SCONTO10' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ example: 'Lasciare il pacco al piano terra' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  })
  @IsEnum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status: string;

  @ApiPropertyOptional({ example: 'Ordine spedito con GLS' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddShipmentDto {
  @ApiProperty({ example: 'cuid-del-corriere' })
  @IsString()
  providerId: string;

  @ApiPropertyOptional({ example: '1Z999AA10123456784' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: 'https://tracking.gls.it/...' })
  @IsOptional()
  @IsString()
  trackingUrl?: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}