import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from '../../../files/orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  AddShipmentDto,
  OrderQueryDto,
} from './dto/cart-order.dto';
import { CurrentUser, Roles } from '../auth/decorators/auth.decorators';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // ─── UTENTE ───────────────────────────────────────────────

  // POST /api/v1/orders
  @Post()
  @ApiOperation({ summary: 'Crea ordine dal carrello' })
  createFromCart(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createFromCart(userId, dto);
  }

  // GET /api/v1/orders/my
  @Get('my')
  @ApiOperation({ summary: 'I miei ordini' })
  findMyOrders(
    @CurrentUser('id') userId: string,
    @Query() query: OrderQueryDto,
  ) {
    return this.ordersService.findAllByUser(userId, query);
  }

  // GET /api/v1/orders/my/:id
  @Get('my/:id')
  @ApiOperation({ summary: 'Dettaglio di un mio ordine' })
  findMyOrder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.findOne(id, userId);
  }

  // PATCH /api/v1/orders/my/:id/cancel
  @Patch('my/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancella un mio ordine (solo se PENDING)' })
  cancelOrder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.cancel(id, userId);
  }

  // ─── ADMIN ───────────────────────────────────────────────

  // GET /api/v1/orders
  @Get()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '[ADMIN] Lista tutti gli ordini' })
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAllAdmin(query);
  }

  // GET /api/v1/orders/stats
  @Get('stats')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '[ADMIN] Statistiche ordini dashboard' })
  getStats() {
    return this.ordersService.getStats();
  }

  // PATCH /api/v1/orders/:id/status
  @Patch(':id/status')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '[ADMIN] Aggiorna stato ordine' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  // POST /api/v1/orders/:id/shipments
  @Post(':id/shipments')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '[ADMIN] Aggiungi tracking spedizione' })
  addShipment(
    @Param('id') id: string,
    @Body() dto: AddShipmentDto,
  ) {
    return this.ordersService.addShipment(id, dto);
  }
}
