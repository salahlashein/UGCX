import 'reflect-metadata';

import AppDataSource from '../config/data-source';
import { User, UserRole } from '../modules/users/entities/user.entity';

/**
 * Creates the admin account. Self sign-up cannot create one.
 * The admin signs in with an emailed OTP, so the account has no password.
 *
 * Usage: ADMIN_EMAIL=you@example.com ADMIN_PHONE=+2010... pnpm --filter api admin:create
 * The script uses DATABASE_URL from apps/api/.env.
 */
async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const phone = process.env.ADMIN_PHONE?.trim();
  if (!email || !phone) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PHONE.');
  }

  await AppDataSource.initialize();
  try {
    const users = AppDataSource.getRepository(User);
    const existing = await users.findOne({ where: { email } });

    if (existing) {
      if (existing.role !== UserRole.ADMIN) {
        // Never promote an account that a brand or creator owns.
        throw new Error(
          `${email} already exists as ${existing.role}. Use another email.`,
        );
      }
      console.log(`Admin ${email} already exists. Nothing changed.`);
      return;
    }

    await users.save(
      users.create({
        email,
        phone,
        role: UserRole.ADMIN,
        emailVerifiedAt: new Date(),
      }),
    );
    console.log(`Admin ${email} created. Sign in with the email OTP.`);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
