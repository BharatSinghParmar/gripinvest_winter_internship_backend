import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hashPassword('Admin123!');
  await prisma.users.upsert({
    where: { email: 'admin@gripinvest.com' },
    update: {},
    create: {
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@gripinvest.com',
      password_hash: adminPassword,
      risk_appetite: 'moderate',
      role: 'admin',
    },
  });

  // Create test users
  const user1Password = await hashPassword('User123!');
  await prisma.users.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'user1@example.com',
      password_hash: user1Password,
      risk_appetite: 'moderate',
      role: 'user',
    },
  });

  const user2Password = await hashPassword('User123!');
  await prisma.users.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'user2@example.com',
      password_hash: user2Password,
      risk_appetite: 'high',
      role: 'user',
    },
  });

  // Create sample investment products
  const products = [
    {
      name: 'Government Bond 2024',
      investment_type: 'bond',
      tenure_months: 12,
      annual_yield: 7.5,
      risk_level: 'low',
      min_investment: 1000,
      max_investment: 100000,
      description: 'Secure government bond with guaranteed returns',
    },
    {
      name: 'Fixed Deposit Premium',
      investment_type: 'fd',
      tenure_months: 24,
      annual_yield: 8.2,
      risk_level: 'low',
      min_investment: 5000,
      max_investment: 500000,
      description: 'High-yield fixed deposit with bank guarantee',
    },
    {
      name: 'Equity Mutual Fund',
      investment_type: 'mf',
      tenure_months: 36,
      annual_yield: 12.5,
      risk_level: 'high',
      min_investment: 1000,
      max_investment: 1000000,
      description: 'Diversified equity fund with growth potential',
    },
    {
      name: 'Tech ETF',
      investment_type: 'etf',
      tenure_months: 18,
      annual_yield: 15.0,
      risk_level: 'high',
      min_investment: 2000,
      max_investment: 200000,
      description: 'Technology sector ETF with high growth potential',
    },
    {
      name: 'Corporate Bond Fund',
      investment_type: 'bond',
      tenure_months: 30,
      annual_yield: 9.8,
      risk_level: 'moderate',
      min_investment: 3000,
      max_investment: 300000,
      description: 'Corporate bond fund with moderate risk',
    },
  ];

  for (const product of products) {
    await prisma.investment_products.create({
      data: {
        name: product.name,
        investment_type: product.investment_type as any,
        tenure_months: product.tenure_months,
        annual_yield: product.annual_yield,
        risk_level: product.risk_level as any,
        min_investment: product.min_investment,
        max_investment: product.max_investment,
        description: product.description,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Admin user: admin@gripinvest.com / Admin123!`);
  console.log(`👤 Test user 1: user1@example.com / User123!`);
  console.log(`👤 Test user 2: user2@example.com / User123!`);
  console.log(`📈 Created ${products.length} investment products`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
