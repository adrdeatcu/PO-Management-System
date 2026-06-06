import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../types/user-context.type';

// Usage in a controller: @CurrentUser() user: AuthUser
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
