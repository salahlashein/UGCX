import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import AppDataSource from '../config/data-source';
import {
  User,
  UserRole,
  UserLocale,
} from '../modules/users/entities/user.entity';
import { Brand } from '../modules/brands/entities/brand.entity';
import {
  BrandMember,
  BrandMemberRole,
  BrandMemberStatus,
} from '../modules/brands/entities/brand-member.entity';
import {
  Creator,
  VettingStatus,
} from '../modules/creators/entities/creator.entity';
import { Product } from '../modules/products/entities/product.entity';
import {
  Campaign,
  CampaignStatus,
  VideoType,
  ScriptMode,
} from '../modules/campaigns/entities/campaign.entity';
import {
  Proposal,
  ProposalStatus,
} from '../modules/proposals/entities/proposal.entity';
import {
  Collaboration,
  CollaborationStatus,
} from '../modules/collaborations/entities/collaboration.entity';
import {
  Deliverable,
  DeliverableStatus,
} from '../modules/deliverables/entities/deliverable.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../modules/transactions/entities/transaction.entity';
import { Message } from '../modules/messages/entities/message.entity';

import { Niche } from '../common/enums/niche.enum';
import { Language } from '../common/enums/language.enum';

async function seed() {
  console.log('Initializing database connection...');
  await AppDataSource.initialize();
  console.log('Database connected.');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('Clearing existing data...');
    // We clear in reverse dependency order
    await queryRunner.query(`TRUNCATE TABLE messages CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE transactions CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE deliverables CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE collaborations CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE proposals CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE campaigns CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE products CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE creators CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE brands CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE users CASCADE`);

    console.log('Inserting mock data...');
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Create a Creator
    const creatorUser = AppDataSource.manager.create(User, {
      email: 'creator@example.com',
      phone: '+201000000001',
      passwordHash,
      role: UserRole.CREATOR,
      locale: UserLocale.EN,
    });
    await AppDataSource.manager.save(creatorUser);

    const creator = AppDataSource.manager.create(Creator, {
      userId: creatorUser.id,
      displayName: 'Nour Hassan',
      city: 'Cairo',
      country: 'EG',
      niches: [Niche.BEAUTY_PERSONAL_CARE, Niche.FASHION, Niche.OTHER],
      basePrice: '3000',
      vettingStatus: VettingStatus.APPROVED,
    });
    await AppDataSource.manager.save(creator);

    // 2. Create a Brand
    const brandUser = AppDataSource.manager.create(User, {
      email: 'brand@example.com',
      phone: '+201000000002',
      passwordHash,
      role: UserRole.BRAND,
      locale: UserLocale.EN,
    });
    await AppDataSource.manager.save(brandUser);

    const brand = AppDataSource.manager.create(Brand, {
      userId: brandUser.id,
      companyName: 'Glow Lab',
      country: 'EG',
    });
    await AppDataSource.manager.save(brand);

    const brandMember = AppDataSource.manager.create(BrandMember, {
      brandId: brand.id,
      userId: brandUser.id,
      role: BrandMemberRole.OWNER,
      status: BrandMemberStatus.ACTIVE,
      acceptedAt: new Date(),
    });
    await AppDataSource.manager.save(brandMember);

    // No mock campaigns, proposals, collaborations, transactions, or messages are seeded initially.

    console.log('✅ Seeding completed successfully!');
    console.log('Login credentials:');
    console.log('  Creator: creator@example.com / Password123!');
    console.log('  Brand: brand@example.com / Password123!');
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed();
