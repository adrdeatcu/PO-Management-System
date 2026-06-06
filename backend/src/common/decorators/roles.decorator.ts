import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Usage on a controller or route: @Roles('admin', 'finance')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
