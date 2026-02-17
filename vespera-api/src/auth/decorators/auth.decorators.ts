import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

// ─── @Public() ───────────────────────────────────────────────
// Marca una route come pubblica (bypassa JwtAuthGuard)
// Esempio: @Public() @Get('health')
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ─── @Roles() ────────────────────────────────────────────────
// Limita l'accesso a ruoli specifici
// Esempio: @Roles('ADMIN', 'MANAGER')
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// ─── @CurrentUser() ──────────────────────────────────────────
// Inietta l'utente autenticato dal request
// Esempio: @CurrentUser() user: User
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
