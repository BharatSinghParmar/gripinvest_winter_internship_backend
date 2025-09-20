import { AuditService } from '../../services/auditService';
import { prisma } from '../../prisma/client';

// Mock Prisma
jest.mock('../../prisma/client', () => ({
  prisma: {
    audit_trails: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logUserAction', () => {
    it('should log user action successfully', async () => {
      const mockAuditTrail = {
        id: 'audit-1',
        user_id: 'user-1',
        action: 'login',
        resource_type: 'authentication',
        resource_id: null,
        details: JSON.stringify({ ip_address: '127.0.0.1' }),
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        created_at: new Date(),
      };

      (prisma.audit_trails.create as jest.Mock).mockResolvedValue(mockAuditTrail);

      await AuditService.logUserAction(
        'user-1',
        'login',
        'authentication',
        null,
        { ip_address: '127.0.0.1' },
        '127.0.0.1',
        'Test Agent'
      );

      expect(prisma.audit_trails.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          user_id: 'user-1',
          action: 'login',
          resource_type: 'authentication',
          resource_id: null,
          details: JSON.stringify({ ip_address: '127.0.0.1' }),
          ip_address: '127.0.0.1',
          user_agent: 'Test Agent',
        },
      });
    });

    it('should handle logging errors gracefully', async () => {
      (prisma.audit_trails.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(AuditService.logUserAction(
        'user-1',
        'login',
        'authentication',
        null,
        { ip_address: '127.0.0.1' }
      )).resolves.toBeUndefined();
    });
  });

  describe('logSystemEvent', () => {
    it('should log system event successfully', async () => {
      const mockAuditTrail = {
        id: 'audit-1',
        user_id: null,
        action: 'startup',
        resource_type: 'system',
        resource_id: null,
        details: JSON.stringify({ version: '1.0.0' }),
        ip_address: null,
        user_agent: null,
        created_at: new Date(),
      };

      (prisma.audit_trails.create as jest.Mock).mockResolvedValue(mockAuditTrail);

      await AuditService.logSystemEvent(
        'startup',
        'system',
        null,
        { version: '1.0.0' }
      );

      expect(prisma.audit_trails.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          user_id: null,
          action: 'startup',
          resource_type: 'system',
          resource_id: null,
          details: JSON.stringify({ version: '1.0.0' }),
          ip_address: null,
          user_agent: null,
        },
      });
    });
  });

  describe('getAuditTrail', () => {
    it('should return audit trail with pagination', async () => {
      const mockItems = [
        {
          id: 'audit-1',
          user_id: 'user-1',
          action: 'login',
          resource_type: 'authentication',
          resource_id: null,
          details: JSON.stringify({ ip_address: '127.0.0.1' }),
          ip_address: '127.0.0.1',
          user_agent: 'Test Agent',
          created_at: new Date(),
        },
      ];

      (prisma.audit_trails.findMany as jest.Mock).mockResolvedValue(mockItems);
      (prisma.audit_trails.count as jest.Mock).mockResolvedValue(1);

      const result = await AuditService.getAuditTrail({}, 1, 50);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('totalPages');
      expect(result.items).toHaveLength(1);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        userId: 'user-1',
        action: 'login',
        resourceType: 'authentication',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      (prisma.audit_trails.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.audit_trails.count as jest.Mock).mockResolvedValue(0);

      await AuditService.getAuditTrail(filters, 1, 50);

      expect(prisma.audit_trails.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user-1',
          action: 'login',
          resource_type: 'authentication',
          created_at: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 50,
      });
    });
  });

  describe('getAuditStatistics', () => {
    it('should return audit statistics', async () => {
      const mockStats = {
        totalActions: 100,
        userActions: 80,
        systemActions: 20,
        actionStats: [
          { action: 'login', _count: { action: 50 } },
          { action: 'logout', _count: { action: 30 } },
        ],
        userStats: [
          { user_id: 'user-1', _count: { user_id: 40 } },
          { user_id: 'user-2', _count: { user_id: 40 } },
        ],
        resourceStats: [
          { resource_type: 'authentication', _count: { resource_type: 80 } },
          { resource_type: 'product', _count: { resource_type: 20 } },
        ],
      };

      (prisma.audit_trails.count as jest.Mock)
        .mockResolvedValueOnce(mockStats.totalActions)
        .mockResolvedValueOnce(mockStats.userActions)
        .mockResolvedValueOnce(mockStats.systemActions);
      
      (prisma.audit_trails.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockStats.actionStats)
        .mockResolvedValueOnce(mockStats.userStats)
        .mockResolvedValueOnce(mockStats.resourceStats);

      const statistics = await AuditService.getAuditStatistics();

      expect(statistics).toHaveProperty('total_actions');
      expect(statistics).toHaveProperty('user_actions');
      expect(statistics).toHaveProperty('system_actions');
      expect(statistics).toHaveProperty('top_actions');
      expect(statistics).toHaveProperty('top_users');
      expect(statistics).toHaveProperty('top_resources');
    });
  });

  describe('specialized logging methods', () => {
    beforeEach(() => {
      (prisma.audit_trails.create as jest.Mock).mockResolvedValue({});
    });

    it('should log auth events', async () => {
      await AuditService.logAuthEvent(
        'user-1',
        'login',
        { ip_address: '127.0.0.1' },
        '127.0.0.1',
        'Test Agent'
      );

      expect(prisma.audit_trails.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-1',
          action: 'login',
          resource_type: 'authentication',
        }),
      });
    });

    it('should log investment events', async () => {
      await AuditService.logInvestmentEvent(
        'user-1',
        'create',
        'investment-1',
        { amount: 1000 },
        '127.0.0.1',
        'Test Agent'
      );

      expect(prisma.audit_trails.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-1',
          action: 'create',
          resource_type: 'investment',
          resource_id: 'investment-1',
        }),
      });
    });

    it('should log product events', async () => {
      await AuditService.logProductEvent(
        'user-1',
        'view',
        'product-1',
        { product_name: 'Test Product' },
        '127.0.0.1',
        'Test Agent'
      );

      expect(prisma.audit_trails.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-1',
          action: 'view',
          resource_type: 'product',
          resource_id: 'product-1',
        }),
      });
    });

    it('should log system lifecycle events', async () => {
      await AuditService.logSystemLifecycleEvent(
        'startup',
        { version: '1.0.0' }
      );

      expect(prisma.audit_trails.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: null,
          action: 'startup',
          resource_type: 'system',
        }),
      });
    });

    it('should log migration events', async () => {
      await AuditService.logMigrationEvent(
        'migration_start',
        'add_audit_trails',
        { version: '1.0.0' }
      );

      expect(prisma.audit_trails.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: null,
          action: 'migration_start',
          resource_type: 'migration',
          resource_id: 'add_audit_trails',
        }),
      });
    });

    it('should log config changes', async () => {
      await AuditService.logConfigChange(
        'user-1',
        'max_upload_size',
        '10MB',
        '20MB',
        '127.0.0.1',
        'Test Agent'
      );

      expect(prisma.audit_trails.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-1',
          action: 'config_change',
          resource_type: 'configuration',
          resource_id: 'max_upload_size',
        }),
      });
    });

    it('should log security events', async () => {
      await AuditService.logSecurityEvent(
        'user-1',
        'failed_login',
        { attempts: 5 },
        '127.0.0.1',
        'Test Agent'
      );

      expect(prisma.audit_trails.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-1',
          action: 'failed_login',
          resource_type: 'security',
        }),
      });
    });
  });
});
