import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthUser } from '../common/types/user-context.type';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private supabase!: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');

    if (!url || !serviceRoleKey) {
      throw new Error('Supabase URL or Service Role Key is not configured');
    }

    this.supabase = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Supabase service-role client initialized');
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  async getUserWithRoles(userId: string): Promise<AuthUser | null> {
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('id, full_name, email, department_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      this.logger.warn(`Profile not found for user ${userId}`);
      return null;
    }

    const { data: userRoles, error: rolesError } = await this.supabase
      .from('user_roles')
      .select('roles(code)')
      .eq('user_id', userId);

    if (rolesError) {
      this.logger.warn(`Could not load roles for user ${userId}`);
    }

    const roles: string[] = (userRoles ?? []).flatMap((ur: any) =>
      ur.roles ? [ur.roles.code as string] : [],
    );

    return {
      id: profile.id as string,
      email: profile.email as string,
      fullName: profile.full_name as string,
      departmentId: (profile.department_id as string) ?? null,
      roles,
    };
  }
}