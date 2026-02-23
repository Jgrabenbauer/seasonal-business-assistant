import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing seed data
  await db.activityLog.deleteMany({});
  await db.ownerReport.deleteMany({});
  await db.readinessEvent.deleteMany({});
  await db.turnovernessCheck.deleteMany({});
  await db.turnover.deleteMany({});
  await db.magicLinkToken.deleteMany({});
  await db.smsMessage.deleteMany({});
  await db.attachment.deleteMany({});
  await db.checklistItemRun.deleteMany({});
  await db.checklistRun.deleteMany({});
  await db.workOrder.deleteMany({});
  await db.checklistItemTemplate.deleteMany({});
  await db.checklistTemplate.deleteMany({});
  await db.property.deleteMany({});
  await db.user.deleteMany({});
  await db.subscription.deleteMany({});
  await db.organization.deleteMany({});

  // Organization — trial ends 14 days after creation
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const org = await db.organization.create({
    data: {
      name: 'Cape Cod Stays',
      slug: 'cape-cod-stays',
      trialEndsAt,
      planType: 'STARTER',
      subscriptionStatus: 'TRIAL',
      maxWorkers: 5,
      maxProperties: 3
    }
  });

  const starterSubscription = await db.subscription.create({
    data: {
      organizationId: org.id,
      stripeCustomerId: 'cus_seed_cape_cod',
      stripeSubscriptionId: 'sub_seed_cape_cod',
      priceId: 'price_seed_starter',
      status: 'TRIAL',
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      trialEndsAt
    }
  });

  // Manager
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const sarah = await db.user.create({
    data: {
      organizationId: org.id,
      name: 'Sarah Manager',
      email: 'sarah@capecodstays.com',
      passwordHash,
      role: 'MANAGER'
    }
  });

  // Workers
  const mike = await db.user.create({
    data: {
      organizationId: org.id,
      name: 'Mike Cleaner',
      phone: '+15085550101',
      role: 'WORKER'
    }
  });

  await db.user.create({
    data: {
      organizationId: org.id,
      name: 'Tom Maintenance',
      phone: '+15085550202',
      role: 'WORKER'
    }
  });

  // Properties
  const nauset = await db.property.create({
    data: {
      organizationId: org.id,
      name: 'Nauset Cottage',
      address: '42 Nauset Rd, Eastham, MA 02642',
      notes: 'Key lockbox code: 4521. Pool towels in outdoor closet.'
    }
  });

  await db.property.create({
    data: {
      organizationId: org.id,
      name: 'Harbor View Inn',
      address: '7 Wharf St, Wellfleet, MA 02667'
    }
  });

  await db.property.create({
    data: {
      organizationId: org.id,
      name: 'Wellfleet Retreat',
      address: '15 Ocean View Dr, Wellfleet, MA 02667',
      notes: 'No parking on street. Use driveway only.'
    }
  });

  // Checklist template
  const template = await db.checklistTemplate.create({
    data: {
      organizationId: org.id,
      name: 'Standard Turnover',
      items: {
        create: [
          { title: 'Strip and remake all beds', sortOrder: 0 },
          { title: 'Clean all bathrooms', description: 'Scrub toilets, sinks, tub/shower', sortOrder: 1 },
          { title: 'Vacuum all carpets and rugs', sortOrder: 2 },
          { title: 'Mop hard floors', sortOrder: 3 },
          { title: 'Clean kitchen thoroughly', description: 'Wipe counters, clean appliances, empty trash', sortOrder: 4 },
          { title: 'Restock supplies', description: 'Toilet paper, paper towels, soap', sortOrder: 5 },
          { title: 'Check all windows and doors lock', photoRequired: true, sortOrder: 6 },
          { title: 'Take final walkthrough photo', photoRequired: true, sortOrder: 7 }
        ]
      }
    }
  });

  // Work order — use createWorkerToken pattern (DB-backed)
  const workOrder = await db.workOrder.create({
    data: {
      organizationId: org.id,
      propertyId: nauset.id,
      templateId: template.id,
      assignedToId: mike.id,
      createdById: sarah.id,
      title: 'Summer Turnover — June 21',
      scheduledFor: new Date('2026-06-21'),
      status: 'PENDING'
    }
  });

  const turnover = await db.turnover.create({
    data: {
      organizationId: org.id,
      propertyId: nauset.id,
      templateId: template.id,
      assignedToId: mike.id,
      createdById: sarah.id,
      title: 'Summer Turnover — June 21',
      scheduledStartAt: new Date('2026-06-21T09:00:00'),
      guestArrivalAt: new Date('2026-06-21T15:00:00'),
      slaDeadlineAt: new Date('2026-06-21T12:00:00'),
      status: 'NOT_READY'
    }
  });

  await db.workOrder.update({
    where: { id: workOrder.id },
    data: { turnoverId: turnover.id }
  });

  // Create magic link token using DB-backed approach
  const jwt = await import('jsonwebtoken');
  const secret = process.env.MAGIC_LINK_SECRET ?? 'dev-seed-secret-not-for-production-must-be-long';
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const tokenRecord = await db.magicLinkToken.create({
    data: { workOrderId: workOrder.id, token: '', expiresAt }
  });

  const token = jwt.default.sign(
    { workOrderId: workOrder.id, type: 'worker', jti: tokenRecord.id },
    secret,
    { expiresIn: '48h' }
  );

  await db.magicLinkToken.update({
    where: { id: tokenRecord.id },
    data: { token }
  });

  // Also set magicToken on work order for backward compat display in dashboard
  await db.workOrder.update({
    where: { id: workOrder.id },
    data: { magicToken: token, tokenExpiresAt: expiresAt }
  });

  // Create checklist run
  await db.checklistRun.create({
    data: {
      workOrderId: workOrder.id,
      items: {
        create: [
          { title: 'Strip and remake all beds', sortOrder: 0 },
          { title: 'Clean all bathrooms', description: 'Scrub toilets, sinks, tub/shower', sortOrder: 1 },
          { title: 'Vacuum all carpets and rugs', sortOrder: 2 },
          { title: 'Mop hard floors', sortOrder: 3 },
          { title: 'Clean kitchen thoroughly', description: 'Wipe counters, clean appliances, empty trash', sortOrder: 4 },
          { title: 'Restock supplies', description: 'Toilet paper, paper towels, soap', sortOrder: 5 },
          { title: 'Check all windows and doors lock', photoRequired: true, sortOrder: 6 },
          { title: 'Take final walkthrough photo', photoRequired: true, sortOrder: 7 }
        ]
      }
    }
  });

  // Seed initial activity logs
  await db.activityLog.create({
    data: {
      organizationId: org.id,
      userId: sarah.id,
      actionType: 'TURNOVER_SCHEDULED',
      entityType: 'Turnover',
      entityId: turnover.id,
      metadata: { title: turnover.title }
    }
  });

  // Second organization — PRO plan (active)
  const proOrg = await db.organization.create({
    data: {
      name: 'Harborline Rentals',
      slug: 'harborline-rentals',
      planType: 'PRO',
      subscriptionStatus: 'ACTIVE',
      maxWorkers: 999,
      maxProperties: -1
    }
  });

  const proSubscription = await db.subscription.create({
    data: {
      organizationId: proOrg.id,
      stripeCustomerId: 'cus_seed_harborline',
      stripeSubscriptionId: 'sub_seed_harborline',
      priceId: 'price_seed_pro',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false
    }
  });

  await db.user.create({
    data: {
      organizationId: proOrg.id,
      name: 'Priya Manager',
      email: 'priya@harborlinerentals.com',
      passwordHash,
      role: 'MANAGER'
    }
  });

  await db.user.create({
    data: {
      organizationId: proOrg.id,
      name: 'Alex Cleaner',
      phone: '+15085550303',
      role: 'WORKER'
    }
  });

  await db.user.create({
    data: {
      organizationId: proOrg.id,
      name: 'Jamie Maintenance',
      phone: '+15085550404',
      role: 'WORKER'
    }
  });

  await db.property.create({
    data: {
      organizationId: proOrg.id,
      name: 'Seagrass House',
      address: '88 Bayberry Ln, Chatham, MA 02633'
    }
  });

  await db.property.create({
    data: {
      organizationId: proOrg.id,
      name: 'Breakwater Bungalow',
      address: '11 Lighthouse Rd, Chatham, MA 02633'
    }
  });

  // Third organization — PAST_DUE (grace period)
  const pastDueOrg = await db.organization.create({
    data: {
      name: 'Coastline Co.',
      slug: 'coastline-co',
      planType: 'PRO',
      subscriptionStatus: 'PAST_DUE',
      maxWorkers: 999,
      maxProperties: -1,
      gracePeriodEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  const pastDueSubscription = await db.subscription.create({
    data: {
      organizationId: pastDueOrg.id,
      stripeCustomerId: 'cus_seed_coastline',
      stripeSubscriptionId: 'sub_seed_coastline',
      priceId: 'price_seed_pro',
      status: 'PAST_DUE',
      currentPeriodEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      gracePeriodEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  await db.user.create({
    data: {
      organizationId: pastDueOrg.id,
      name: 'Morgan Manager',
      email: 'morgan@coastlineco.com',
      passwordHash,
      role: 'MANAGER'
    }
  });

  // Fourth organization — CANCELLED
  const cancelledOrg = await db.organization.create({
    data: {
      name: 'Saltwind Lodging',
      slug: 'saltwind-lodging',
      planType: 'STARTER',
      subscriptionStatus: 'CANCELLED',
      maxWorkers: 5,
      maxProperties: 3
    }
  });

  const cancelledSubscription = await db.subscription.create({
    data: {
      organizationId: cancelledOrg.id,
      stripeCustomerId: 'cus_seed_saltwind',
      stripeSubscriptionId: 'sub_seed_saltwind',
      priceId: 'price_seed_starter',
      status: 'CANCELLED',
      currentPeriodEnd: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: true
    }
  });

  await db.user.create({
    data: {
      organizationId: cancelledOrg.id,
      name: 'Taylor Manager',
      email: 'taylor@saltwindlodging.com',
      passwordHash,
      role: 'MANAGER'
    }
  });

  const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://localhost:5173';
  console.log('\n✅ Seed complete!\n');
  console.log('  Login: sarah@capecodstays.com / demo1234');
  console.log('  Login: priya@harborlinerentals.com / demo1234');
  console.log('  Login: morgan@coastlineco.com / demo1234');
  console.log('  Login: taylor@saltwindlodging.com / demo1234');
  console.log(`  Worker link: ${baseUrl}/w/${token}`);
  console.log(`  Trial ends: ${trialEndsAt.toLocaleDateString()}`);
  console.log(`  Starter subscription: ${starterSubscription.stripeSubscriptionId}`);
  console.log(`  Pro subscription: ${proSubscription.stripeSubscriptionId}`);
  console.log(`  Past due subscription: ${pastDueSubscription.stripeSubscriptionId}`);
  console.log(`  Cancelled subscription: ${cancelledSubscription.stripeSubscriptionId}`);
  console.log('');
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
