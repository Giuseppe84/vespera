import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart-order.dto';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@ApiTags('cart')
@ApiBearerAuth('access-token')
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  // GET /api/v1/cart
  @Get()
  @ApiOperation({ summary: 'Contenuto del carrello' })
  getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  // GET /api/v1/cart/count
  @Get('count')
  @ApiOperation({ summary: 'Numero articoli nel carrello (per badge)' })
  getCount(@CurrentUser('id') userId: string) {
    return this.cartService.getCount(userId);
  }

  // POST /api/v1/cart
  @Post()
  @ApiOperation({ summary: 'Aggiungi articolo al carrello' })
  addItem(
    @CurrentUser('id') userId: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.cartService.addItem(userId, dto);
  }

  // PATCH /api/v1/cart/:itemId
  @Patch(':itemId')
  @ApiOperation({ summary: 'Aggiorna quantità articolo' })
  updateItem(
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(itemId, userId, dto);
  }

  // DELETE /api/v1/cart/:itemId
  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Rimuovi articolo dal carrello' })
  removeItem(
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.cartService.removeItem(itemId, userId);
  }

  // DELETE /api/v1/cart
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Svuota il carrello' })
  clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
