import { describe, it, expect } from 'vitest';
import { generatePdf } from '../../src/lib/server/pdf';

const mockOrg = {
  id: 'org-1',
  name: 'Cape Cod Stays',
  slug: 'cape-cod-stays',
  createdAt: new Date(),
  planType: 'STARTER' as const,
  subscriptionStatus: 'TRIAL' as const,
  trialEndsAt: null,
  maxWorkers: 5,
  maxProperties: 3
};

const mockWorkOrder = {
  id: 'wo-1',
  organizationId: 'org-1',
  propertyId: 'prop-1',
  templateId: null,
  assignedToId: null,
  createdById: 'user-1',
  title: 'Summer Turnover',
  scheduledFor: new Date('2026-06-21'),
  status: 'COMPLETED' as const,
  magicToken: null,
  tokenExpiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  property: {
    id: 'prop-1',
    organizationId: 'org-1',
    name: 'Nauset Cottage',
    address: '42 Nauset Rd',
    notes: null,
    createdAt: new Date()
  },
  checklistRun: {
    id: 'run-1',
    workOrderId: 'wo-1',
    startedAt: new Date(),
    completedAt: new Date(),
    createdAt: new Date(),
    items: [
      {
        id: 'item-1',
        runId: 'run-1',
        title: 'Strip beds',
        description: null,
        photoRequired: false,
        sortOrder: 0,
        status: 'COMPLETED' as const,
        completedAt: new Date(),
        notes: 'All done',
        attachments: [{ id: 'att-1' }]
      },
      {
        id: 'item-2',
        runId: 'run-1',
        title: 'Clean bathrooms',
        description: 'Scrub everything',
        photoRequired: true,
        sortOrder: 1,
        status: 'PENDING' as const,
        completedAt: null,
        notes: null,
        attachments: []
      }
    ]
  }
};

describe('generatePdf', () => {
  it('generates a PDF without throwing', async () => {
    const bytes = await generatePdf(mockWorkOrder, mockOrg);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(100);
  });

  it('PDF starts with PDF magic bytes', async () => {
    const bytes = await generatePdf(mockWorkOrder, mockOrg);
    const header = String.fromCharCode(...bytes.slice(0, 4));
    expect(header).toBe('%PDF');
  });

  it('generates PDF when checklistRun is null', async () => {
    const workOrderNoRun = { ...mockWorkOrder, checklistRun: null };
    const bytes = await generatePdf(workOrderNoRun, mockOrg);
    expect(bytes).toBeInstanceOf(Uint8Array);
  });
});
