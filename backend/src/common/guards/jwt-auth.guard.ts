import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Extract Bearer token from Authorization header
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }
    const token = authHeader.split(' ')[1];

    // 2. Verify token against Supabase Auth (live check — catches revoked sessions)
    const supabaseUrl = this.configService.get<string>('supabase.url') ?? '';
    const supabaseAnonKey =
      this.configService.get<string>('supabase.anonKey') ?? '';

    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error,
    } = await authClient.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // 3. Load enriched user (profile + roles) from the database
    const enrichedUser = await this.databaseService.getUserWithRoles(user.id);
    if (!enrichedUser) {
      throw new UnauthorizedException('User profile not found');
    }

    // 4. Attach to request so controllers/guards can access it
    (request as Request & { user: unknown }).user = enrichedUser;
    return true;
  }
}
