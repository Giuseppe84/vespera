import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/lamp.dto';
import { Public, Roles } from '../auth/decorators/auth.decorators';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista categorie con sottocategorie' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Dettaglio categoria per slug' })
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findOne(slug);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Crea categoria' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Aggiorna categoria' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Elimina categoria' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
