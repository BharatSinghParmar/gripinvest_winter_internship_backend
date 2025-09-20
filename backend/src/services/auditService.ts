import { prisma } from '../prisma/client';
import { AuditTrail } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AuditService {
  /**
   * Log user action to audit trail
   */
  static async logUserAction(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId: string | null,
    details: Record<string, unknown>,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    try {
      await prisma.audit_trails.create({
        data: {
          id: uuidv4(),
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details: JSON.stringify(details),
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
        },
      });
    } catch (error) {
      // Silently fail for audit logging to avoid breaking the main application
      if (process.env['NODE_ENV'] === 'development') {
        console.warn('Audit logging failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Log system event to audit trail
   */
  static async logSystemEvent(
    action: string,
    resourceType: string,
    resourceId: string | null,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      await prisma.audit_trails.create({
        data: {
          id: uuidv4(),
          user_id: null, // System event
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details: JSON.stringify(details),
          ip_address: null,
          user_agent: null,
        },
      });
    } catch (error) {
      if (process.env['NODE_ENV'] === 'development') {
        console.warn('System audit logging failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Get audit trail with filtering and pagination
   */
  static async getAuditTrail(
    filters: {
      userId?: string;
      action?: string;
      resourceType?: string;
      resourceId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    pageSize: number = 50
  ): Promise<{
    items: AuditTrail[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const whereClause: any = {};

    if (filters.userId) {
      whereClause.user_id = filters.userId;
    }
    if (filters.action) {
      whereClause.action = filters.action;
    }
    if (filters.resourceType) {
      whereClause.resource_type = filters.resourceType;
    }
    if (filters.resourceId) {
      whereClause.resource_id = filters.resourceId;
    }
    if (filters.startDate || filters.endDate) {
      whereClause.created_at = {};
      if (filters.startDate) {
        whereClause.created_at.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.created_at.lte = filters.endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.audit_trails.findMany({
        where: whereClause,
        orderBy: {
          created_at: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.audit_trails.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: items.map(item => ({
        id: item.id,
        user_id: item.user_id,
        action: item.action,
        resource_type: item.resource_type,
        resource_id: item.resource_id,
        details: JSON.parse(item.details as string),
        ip_address: item.ip_address,
        user_agent: item.user_agent,
        created_at: item.created_at,
      })),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Get audit trail for a specific user
   */
  static async getUserAuditTrail(
    userId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{
    items: AuditTrail[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    return this.getAuditTrail({ userId }, page, pageSize);
  }

  /**
   * Get audit trail for a specific resource
   */
  static async getResourceAuditTrail(
    resourceType: string,
    resourceId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{
    items: AuditTrail[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    return this.getAuditTrail({ resourceType, resourceId }, page, pageSize);
  }

  /**
   * Get audit trail statistics
   */
  static async getAuditStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total_actions: number;
    user_actions: number;
    system_actions: number;
    top_actions: Array<{ action: string; count: number }>;
    top_users: Array<{ user_id: string; count: number }>;
    top_resources: Array<{ resource_type: string; count: number }>;
  }> {
    const whereClause: any = {};
    
    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) {
        whereClause.created_at.gte = startDate;
      }
      if (endDate) {
        whereClause.created_at.lte = endDate;
      }
    }

    const [
      totalActions,
      userActions,
      systemActions,
      actionStats,
      userStats,
      resourceStats,
    ] = await Promise.all([
      prisma.audit_trails.count({ where: whereClause }),
      prisma.audit_trails.count({
        where: {
          ...whereClause,
          user_id: { not: null },
        },
      }),
      prisma.audit_trails.count({
        where: {
          ...whereClause,
          user_id: null,
        },
      }),
      prisma.audit_trails.groupBy({
        by: ['action'],
        where: whereClause,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.audit_trails.groupBy({
        by: ['user_id'],
        where: {
          ...whereClause,
          user_id: { not: null },
        },
        _count: { user_id: true },
        orderBy: { _count: { user_id: 'desc' } },
        take: 10,
      }),
      prisma.audit_trails.groupBy({
        by: ['resource_type'],
        where: whereClause,
        _count: { resource_type: true },
        orderBy: { _count: { resource_type: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total_actions: totalActions,
      user_actions: userActions,
      system_actions: systemActions,
      top_actions: actionStats.map(stat => ({
        action: stat.action,
        count: stat._count.action,
      })),
      top_users: userStats.map(stat => ({
        user_id: stat.user_id || 'unknown',
        count: stat._count.user_id,
      })),
      top_resources: resourceStats.map(stat => ({
        resource_type: stat.resource_type,
        count: stat._count.resource_type,
      })),
    };
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(
    userId: string | null,
    action: 'login' | 'logout' | 'token_refresh' | 'password_reset',
    details: Record<string, unknown>,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    await this.logUserAction(
      userId,
      action,
      'authentication',
      null,
      details,
      ipAddress,
      userAgent
    );
  }

  /**
   * Log investment events
   */
  static async logInvestmentEvent(
    userId: string,
    action: 'create' | 'update' | 'delete' | 'view',
    investmentId: string,
    details: Record<string, unknown>,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    await this.logUserAction(
      userId,
      action,
      'investment',
      investmentId,
      details,
      ipAddress,
      userAgent
    );
  }

  /**
   * Log product events
   */
  static async logProductEvent(
    userId: string | null,
    action: 'create' | 'update' | 'delete' | 'view',
    productId: string,
    details: Record<string, unknown>,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    await this.logUserAction(
      userId,
      action,
      'product',
      productId,
      details,
      ipAddress,
      userAgent
    );
  }

  /**
   * Log system startup/shutdown events
   */
  static async logSystemLifecycleEvent(
    action: 'startup' | 'shutdown' | 'restart',
    details: Record<string, unknown>
  ): Promise<void> {
    await this.logSystemEvent(
      action,
      'system',
      null,
      details
    );
  }

  /**
   * Log database migration events
   */
  static async logMigrationEvent(
    action: 'migration_start' | 'migration_complete' | 'migration_failed',
    migrationName: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await this.logSystemEvent(
      action,
      'migration',
      migrationName,
      details
    );
  }

  /**
   * Log configuration changes
   */
  static async logConfigChange(
    userId: string | null,
    configKey: string,
    oldValue: unknown,
    newValue: unknown,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    await this.logUserAction(
      userId,
      'config_change',
      'configuration',
      configKey,
      {
        config_key: configKey,
        old_value: oldValue,
        new_value: newValue,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    userId: string | null,
    action: 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'unauthorized_access',
    details: Record<string, unknown>,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    await this.logUserAction(
      userId,
      action,
      'security',
      null,
      details,
      ipAddress,
      userAgent
    );
  }
}
