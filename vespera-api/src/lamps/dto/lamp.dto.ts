import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  IsDecimal,
  MinLength,
  Min,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ─── Lamp ────────────────────────────────────────────────────

export class CreateLampDto {
  @ApiProperty({ example: 'Lampada Vespera X1' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'lampada-vespera-x1' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Lampada da tavolo in PLA' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ example: 'Descrizione completa della lampada...' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'cuid-della-categoria' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 79.99 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  basePrice: number;

  @ApiProperty({ example: 'VES-X1-001' })
  @IsString()
  sku: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isConfigurable?: boolean;

  @ApiPropertyOptional({ example: 1.2 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ type: [String], example: ['industrial', 'moderno'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateLampDto extends PartialType(CreateLampDto) {}

// ─── Lamp Query / Filters ────────────────────────────────────

export class LampQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 12;

  @ApiPropertyOptional({ example: 'vespera' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMin?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isConfigurable?: boolean;

  @ApiPropertyOptional({ enum: ['price_asc', 'price_desc', 'newest', 'name'] })
  @IsOptional()
  @IsString()
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'name';
}

// ─── Category ────────────────────────────────────────────────

export class CreateCategoryDto {
  @ApiProperty({ example: 'Lampade da Tavolo' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'lampade-da-tavolo' })
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

// ─── Variant ─────────────────────────────────────────────────

export class CreateVariantDto {
  @ApiProperty({ example: 'Nero / Large' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'VES-X1-001-NL' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 89.99 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: 99.99 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  comparePrice?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  stockQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: [{ key: 'Colore', value: 'Nero' }, { key: 'Dimensione', value: 'Large' }],
  })
  @IsOptional()
  @IsArray()
  options?: { key: string; value: string }[];
}

export class UpdateVariantDto extends PartialType(CreateVariantDto) {}

// ─── Media ───────────────────────────────────────────────────

export class AddMediaDto {
  @ApiProperty({ example: 'https://cdn.vespera.it/lamps/x1.jpg' })
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ enum: ['image', 'video', 'model3d'], example: 'image' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;
}
