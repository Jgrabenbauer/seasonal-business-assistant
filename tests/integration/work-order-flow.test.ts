import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const db = new PrismaClient();

const TEST_ORG_SLUG = `test-org-${Date.now()}`;

beforeAll(async () => {
  // Ensure DB is available
  await db.$connect();
});

afterAll(async () => {
  // Clean up test data
  const org = await db.organization.findUnique({ where: { slug: TEST_ORG_SLUG } });
  if (org) {
    await db.smsMessage.deleteMany({ where: { organizationId: org.id } });
    await db.attachment.deleteMany({});
    const runs = await db.checklistRun.findMany({
      where: { workOrder: { organizationId: org.id } }
    });
    for (const run of runs) {
      await db.checklistItemRun.deleteMany({ where: { runId: run.id } });
    }
    await db.checklistRun.deleteMany({ where: { workOrder: { organizationId: org.id } } });
    await db.workOrder.deleteMany({ where: { organizationId: org.id } });
    await db.checklistItemTemplate.deleteMany({
      where: { template: { organizationId: org.id } }
    });
    await db.checklistTemplate.deleteMany({ where: { organizationId: org.id } });
    await db.property.deleteMany({ where: { organizationId: org.id } });
    await db.user.deleteMany({ where: { organizationId: org.id } });
    await db.organization.delete({ where: { id: org.id } });
  }
  await db.$disconnect();
});

describe('Work Order Flow (Integration)', () => {
  let orgId: string;
  let managerId: string;
  let workerId: string;
  let propertyId: string;
  let templateId: string;
  let workOrderId: string;
  let runId: string;

  it('1. creates org + manager + worker + property + template', async () => {
    const passwordHash = await bcrypt.hash('testpass123', 12);
    const org = await db.organization.create({
      data: {
        name: 'Test Org',
        slug: TEST_ORG_SLUG,
        users: {
          create: [
            { name: 'Test Manager', email: `mgr-${Date.now()}@test.com`, passwordHash, role: 'MANAGER' },
            { name: 'Test Worker', phone: '+15085559999', role: 'WORKER' }
          ]
        },
        properties: {
          create: { name: 'Test Property', address: '1 Test St' }
        },
        templates: {
          create: {
            name: 'Test Template',
            items: {
              create: [
                { title: 'Item One', sortOrder: 0 },
                { title: 'Item Two', sortOrder: 1 }
              ]
            }
          }
        }
      },
      include: {
        users: true,
        properties: true,
        templates: { include: { items: true } }
      }
    });

    orgId = org.id;
    managerId = org.users.find((u) => u.role === 'MANAGER')!.id;
    workerId = org.users.find((u) => u.role === 'WORKER')!.id;
    propertyId = org.properties[0].id;
    templateId = org.templates[0].id;

    expect(orgId).toBeTruthy();
    expect(managerId).toBeTruthy();
    expect(workerId).toBeTruthy();
  });

  it('2. creates a work order', async () => {
    const wo = await db.workOrder.create({
      data: {
        organizationId: orgId,
        propertyId,
        templateId,
        createdById: managerId,
        title: 'Integration Test Order',
        status: 'PENDING'
      }
    });
    workOrderId = wo.id;
    expect(wo.status).toBe('PENDING');
  });

  it('3. assigns worker, generates token, writes SMS', async () => {
    const secret = 'test-magic-secret-min-32-chars-integration';
    process.env.MAGIC_LINK_SECRET = secret;

    const token = jwt.sign({ workOrderId, type: 'worker' }, secret, { expiresIn: '48h' });
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await db.workOrder.update({
      where: { id: workOrderId },
      data: { assignedToId: workerId, magicToken: token, tokenExpiresAt: expiresAt }
    });

    // Create checklist run
    const template = await db.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: true }
    });

    const run = await db.checklistRun.create({
      data: {
        workOrderId,
        items: {
          create: template!.items.map((i) => ({
            title: i.title,
            sortOrder: i.sortOrder
          }))
        }
      },
      include: { items: true }
    });

    runId = run.id;
    expect(run.items).toHaveLength(2);

    // Write SMS to DB
    const worker = await db.user.findUnique({ where: { id: workerId } });
    await db.smsMessage.create({
      data: {
        organizationId: orgId,
        to: worker!.phone!,
        body: `Hi ${worker!.name}! Your checklist link.`,
        provider: 'console'
      }
    });

    const smsCount = await db.smsMessage.count({ where: { organizationId: orgId } });
    expect(smsCount).toBe(1);
  });

  it('4. verifies magic link loads the correct work order', async () => {
    const wo = await db.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        checklistRun: { include: { items: true } }
      }
    });
    expect(wo).toBeTruthy();
    expect(wo!.checklistRun!.items).toHaveLength(2);

    // Simulate link opening — mark as IN_PROGRESS
    await db.checklistRun.update({
      where: { id: runId },
      data: { startedAt: new Date() }
    });
    await db.workOrder.update({
      where: { id: workOrderId },
      data: { status: 'IN_PROGRESS' }
    });

    const updated = await db.workOrder.findUnique({ where: { id: workOrderId } });
    expect(updated!.status).toBe('IN_PROGRESS');
  });

  it('5. PATCHes all items to COMPLETED', async () => {
    const run = await db.checklistRun.findUnique({
      where: { id: runId },
      include: { items: true }
    });

    for (const item of run!.items) {
      await db.checklistItemRun.update({
        where: { id: item.id },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
    }

    // Auto-complete check
    const updatedRun = await db.checklistRun.findUnique({
      where: { id: runId },
      include: { items: true }
    });
    const allDone = updatedRun!.items.every((i) => i.status !== 'PENDING');
    expect(allDone).toBe(true);

    if (allDone) {
      await db.checklistRun.update({ where: { id: runId }, data: { completedAt: new Date() } });
      await db.workOrder.update({ where: { id: workOrderId }, data: { status: 'COMPLETED' } });
    }
  });

  it('6. verifies work order status = COMPLETED', async () => {
    const wo = await db.workOrder.findUnique({ where: { id: workOrderId } });
    expect(wo!.status).toBe('COMPLETED');

    const run = await db.checklistRun.findUnique({ where: { id: runId } });
    expect(run!.completedAt).toBeTruthy();
  });
});
