import 'dotenv/config';
import type { Prisma } from '@prisma/client';
import { createPrismaClient } from '../src/lib/server/prisma-client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run prisma/seed.ts');
}

const db = createPrismaClient(databaseUrl);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const DEMO_PASSWORD = 'demo1234';
const BASE_URL = process.env.PUBLIC_BASE_URL ?? 'http://localhost:5173';
const MAGIC_SECRET =
  process.env.MAGIC_LINK_SECRET ?? 'dev-seed-secret-not-for-production-must-be-long';

type Role = 'MANAGER' | 'SUPERVISOR' | 'WORKER';
type PlanType = 'STARTER' | 'PRO';
type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'INCOMPLETE' | 'PAST_DUE' | 'CANCELLED';
type TurnoverStatus = 'NOT_READY' | 'IN_PROGRESS' | 'READY' | 'VERIFIED';
type ItemStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';
type WorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type ActivityActionType =
  | 'TURNOVER_SCHEDULED'
  | 'TURNOVER_ASSIGNED'
  | 'TURNOVER_READY'
  | 'TURNOVER_VERIFIED'
  | 'READINESS_STEP_COMPLETED'
  | 'CHECKLIST_ITEM_COMPLETED'
  | 'PHOTO_UPLOADED'
  | 'TEMPLATE_CREATED'
  | 'TEMPLATE_EDITED'
  | 'WORKER_ADDED'
  | 'WORKER_SMS_PREF_UPDATED'
  | 'PROPERTY_ADDED'
  | 'MAGIC_LINK_SENT'
  | 'MAGIC_LINK_USED';

type TemplateItemSeed = {
  title: string;
  description?: string;
  photoRequired?: boolean;
};

type TemplateSeed = {
  name: string;
  items: TemplateItemSeed[];
};

type UserSeed = {
  name: string;
  role: Role;
  email?: string;
  phone?: string;
  smsOptIn?: boolean;
};

type PropertySeed = {
  name: string;
  address: string;
  notes: string;
  slaOffsetHours?: number;
  verificationRequired?: boolean;
};

type PhotoSeed = {
  label: string;
  color?: string;
};

type ItemDetailSeed = {
  status?: ItemStatus;
  notes?: string;
  photos?: PhotoSeed[];
  completedOffsetHours?: number;
};

type SmsSeed = {
  toWorker?: string;
  to?: string;
  body: string;
  offsetHours: number;
  status?: string;
  provider?: string;
  deliveredOffsetHours?: number | null;
  errorMessage?: string | null;
};

type ActivitySeed = {
  actionType: ActivityActionType;
  offsetHours: number;
  user?: string | null;
  entityType?: string;
  metadata?: Prisma.JsonObject;
};

type ScenarioSeed = {
  title: string;
  property: string;
  template: string;
  assignedTo: string;
  createdBy: string;
  verifiedBy?: string;
  status: TurnoverStatus;
  guestArrivalOffsetHours: number;
  scheduledStartOffsetHours?: number | null;
  progressCompletedCount?: number;
  autoPhotoProof?: boolean;
  readyOffsetHours?: number | null;
  verifiedOffsetHours?: number | null;
  itemDetails?: Record<string, ItemDetailSeed>;
  sms?: SmsSeed[];
  activity?: ActivitySeed[];
  ownerReport?: boolean;
  reportLink?: boolean;
  ownerReportRecipient?: string;
};

type OrganizationSeed = {
  name: string;
  slug: string;
  planType: PlanType;
  subscriptionStatus: SubscriptionStatus;
  maxWorkers: number;
  maxProperties: number;
  slaDefaultOffsetHours: number;
  verificationRequired: boolean;
  brandName?: string;
  brandAccentColor?: string;
  brandContactInfo?: string;
  users: UserSeed[];
  properties: PropertySeed[];
  templates: TemplateSeed[];
  scenarios: ScenarioSeed[];
  featured?: boolean;
};

type OrgContext = {
  id: string;
  name: string;
  slug: string;
  planType: PlanType;
  users: Record<string, { id: string; name: string; role: Role; phone: string | null }>;
  properties: Record<
    string,
    { id: string; name: string; slaOffsetHours: number | null; verificationRequired: boolean | null }
  >;
  templates: Record<string, { id: string; name: string; items: TemplateItemSeed[] }>;
  featuredReportUrl?: string;
};

function atOffset(hours: number) {
  return new Date(Date.now() + hours * HOUR);
}

function randomToken(length = 10) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function photoDataUrl(label: string, color = '#0f766e') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="#f7f1e8"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><rect x="72" y="72" width="1056" height="756" rx="36" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.65)" stroke-width="4"/><text x="96" y="136" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700">SBA Proof Photo</text><text x="96" y="780" fill="#113b3b" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700">${label}</text><text x="96" y="824" fill="#244f4f" font-family="Arial, Helvetica, sans-serif" font-size="26">Seeded demo evidence for live walkthroughs</text></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    filename: `${slugify(label)}.svg`,
    mimeType: 'image/svg+xml',
    sizeBytes: Buffer.byteLength(svg)
  };
}

function property(
  name: string,
  address: string,
  descriptor: string,
  opsNotes: string,
  options: { slaOffsetHours?: number; verificationRequired?: boolean } = {}
): PropertySeed {
  return {
    name,
    address,
    notes: `${descriptor}. ${opsNotes}`,
    slaOffsetHours: options.slaOffsetHours,
    verificationRequired: options.verificationRequired
  };
}

const sharedTemplates: TemplateSeed[] = [
  {
    name: 'Standard Turnover',
    items: [
      { title: 'Strip and bag used linens', description: 'Bag by room so missing sets are obvious.' },
      { title: 'Make all beds with fresh linens' },
      { title: 'Sanitize bathrooms', description: 'Tubs, sinks, toilets, mirrors, and fixtures.' },
      { title: 'Vacuum rugs and floors' },
      { title: 'Mop hard floors' },
      { title: 'Wipe kitchen surfaces and appliances' },
      { title: 'Remove all trash and recycling' },
      { title: 'Restock bath towel sets' },
      { title: 'Restock kitchen starter kit', description: 'Paper towels, dish soap, sponge, dishwasher tab.' },
      { title: 'Confirm Wi-Fi card and welcome binder visible' },
      { title: 'Upload final kitchen photo', photoRequired: true },
      { title: 'Upload front-entry proof photo', photoRequired: true }
    ]
  },
  {
    name: 'Deep Clean',
    items: [
      { title: 'Dust ceiling fans and vents' },
      { title: 'Clean behind toilets and baseboards' },
      { title: 'Wash inside microwave and fridge shelves' },
      { title: 'Spot-clean walls and door frames' },
      { title: 'Clean window tracks' },
      { title: 'Clean slider glass' },
      { title: 'Treat shower mildew if present' },
      { title: 'Wipe outdoor furniture' },
      { title: 'Sweep porch and entry path' },
      { title: 'Confirm grill propane level' },
      { title: 'Upload living room wide-angle photo', photoRequired: true },
      { title: 'Upload primary bath photo', photoRequired: true },
      { title: 'Upload patio photo', photoRequired: true },
      { title: 'Log any damage found', photoRequired: true }
    ]
  },
  {
    name: 'Linen & Supply Reset',
    items: [
      { title: 'Count fitted sheets by room' },
      { title: 'Count pillowcases by room' },
      { title: 'Restock bath towel sets' },
      { title: 'Restock hand towels and washcloths' },
      { title: 'Refill paper goods' },
      { title: 'Replace dish sponge and soap' },
      { title: 'Stage amenity basket' },
      { title: 'Upload linen closet photo', photoRequired: true },
      { title: 'Note missing owner supplies' }
    ]
  },
  {
    name: 'Damage Inspection',
    items: [
      { title: 'Check refrigerator and freezer' },
      { title: 'Test stovetop and oven' },
      { title: 'Run dishwasher quick cycle' },
      { title: 'Inspect patio furniture' },
      { title: 'Inspect grill ignition' },
      { title: 'Check smoke and CO alarms' },
      { title: 'Check locks and sliders' },
      { title: 'Photograph any damage found', photoRequired: true },
      { title: 'Upload appliance panel photo', photoRequired: true },
      { title: 'Log maintenance follow-up' }
    ]
  },
  {
    name: 'Pre-Arrival Final Check',
    items: [
      { title: 'Set thermostat to arrival setting' },
      { title: 'Turn on entry lights if late arrival' },
      { title: 'Place parking placard and welcome folder' },
      { title: 'Remove sand from entry and porch' },
      { title: 'Confirm trash bins are tucked away' },
      { title: 'Confirm owner closet is locked', photoRequired: true },
      { title: 'Upload front-entry proof photo', photoRequired: true },
      { title: 'Upload living room proof photo', photoRequired: true }
    ]
  }
];

const smallOrg: OrganizationSeed = {
  name: 'Pine Tide Cottage Co.',
  slug: 'pine-tide-cottage-co',
  planType: 'STARTER',
  subscriptionStatus: 'TRIAL',
  maxWorkers: 8,
  maxProperties: 10,
  slaDefaultOffsetHours: 3,
  verificationRequired: true,
  brandName: 'Pine Tide Cottage Co.',
  brandAccentColor: '#0b6c5c',
  brandContactInfo: 'Operations desk: (508) 555-2100',
  users: [
    { name: 'Elena Mercer', role: 'MANAGER', email: 'elena@pinetidecottages.com' },
    { name: 'Tom Halley', role: 'SUPERVISOR', email: 'tom@pinetidecottages.com' },
    { name: 'Rosa Duarte', role: 'WORKER', phone: '+15085552101' },
    { name: 'Ben Harkin', role: 'WORKER', phone: '+15085552102' },
    { name: 'Marisol Vega', role: 'WORKER', phone: '+15085552103' },
    { name: 'Owen Cabral', role: 'WORKER', phone: '+15085552104' },
    { name: 'Kate Ellis', role: 'WORKER', phone: '+15085552105' }
  ],
  properties: [
    property(
      'Pleasant Bay Cottage',
      '18 Cedar Bank Rd, Harwich, MA 02645',
      '3BR cottage near Pleasant Bay',
      'Saturday turnovers. Porch cushions stored in the bench box.'
    ),
    property(
      'Wychmere Hideaway',
      '7 Salt Spray Ln, Harwich Port, MA 02646',
      '2BR harbor-side condo',
      'Shared stairwell. Entry photo matters because guests arrive after dark.',
      { verificationRequired: false }
    ),
    property(
      'Captain Ellis House',
      '34 Shore Rd, Dennis Port, MA 02639',
      '4BR family beach house',
      'Check outdoor shower sand trap before leaving.'
    ),
    property(
      'Seagrass Cottage',
      '12 Bank St, Harwich, MA 02646',
      '2BR cottage with screened porch',
      'Owner stores spare bath mats in hallway bench.'
    ),
    property(
      'Kettle Pond Retreat',
      '5 Fern Hollow Dr, Brewster, MA 02631',
      '3BR woods-facing home',
      'Extra trash bags in utility closet.'
    ),
    property(
      'Old Wharf Bungalow',
      '21 Wharf Ln, Dennis, MA 02638',
      '2BR bungalow',
      'Guests often request early access; keep entry swept and photo ready.'
    ),
    property(
      'Hickory Hollow Cape',
      '88 Oak Ridge Rd, Brewster, MA 02631',
      '4BR classic Cape',
      'Pool gate must be latched in final photo.'
    ),
    property(
      'Quarterdeck Condo #2',
      '2 Quarterdeck Way Unit 2, Dennis Port, MA 02639',
      '1BR condo in a four-unit cluster',
      'Laundry is shared. Linen closet photo helps avoid owner texts.'
    )
  ],
  templates: sharedTemplates,
  scenarios: [
    {
      title: 'Saturday Arrival - Keane Family',
      property: 'Pleasant Bay Cottage',
      template: 'Standard Turnover',
      assignedTo: 'Rosa Duarte',
      createdBy: 'Elena Mercer',
      status: 'VERIFIED',
      guestArrivalOffsetHours: 26,
      autoPhotoProof: true,
      readyOffsetHours: -1.5,
      verifiedOffsetHours: -1,
      verifiedBy: 'Tom Halley',
      ownerReport: true
    },
    {
      title: 'Saturday Arrival - Mercer Family',
      property: 'Captain Ellis House',
      template: 'Deep Clean',
      assignedTo: 'Ben Harkin',
      createdBy: 'Elena Mercer',
      status: 'IN_PROGRESS',
      guestArrivalOffsetHours: 10,
      progressCompletedCount: 8,
      itemDetails: {
        'Confirm grill propane level': {
          notes: 'Tank reads low; replacement in truck but not swapped yet.'
        }
      }
    },
    {
      title: 'Friday Arrival - Nolan Family',
      property: 'Wychmere Hideaway',
      template: 'Pre-Arrival Final Check',
      assignedTo: 'Marisol Vega',
      createdBy: 'Tom Halley',
      status: 'READY',
      guestArrivalOffsetHours: 4,
      readyOffsetHours: -0.75,
      autoPhotoProof: true,
      itemDetails: {
        'Upload front-entry proof photo': {
          status: 'SKIPPED',
          notes: 'Missing because cellular signal dropped in the alley.'
        }
      }
    },
    {
      title: 'Friday Arrival - Brooks Family',
      property: 'Old Wharf Bungalow',
      template: 'Linen & Supply Reset',
      assignedTo: 'Kate Ellis',
      createdBy: 'Elena Mercer',
      status: 'NOT_READY',
      guestArrivalOffsetHours: 32
    },
    {
      title: 'Tonight Arrival - Archer Family',
      property: 'Quarterdeck Condo #2',
      template: 'Standard Turnover',
      assignedTo: 'Owen Cabral',
      createdBy: 'Tom Halley',
      status: 'IN_PROGRESS',
      guestArrivalOffsetHours: 2.5,
      progressCompletedCount: 5,
      itemDetails: {
        'Restock bath towel sets': {
          status: 'SKIPPED',
          notes: 'Only one clean bath set left in shared linen cage.'
        },
        'Upload final kitchen photo': {
          status: 'COMPLETED',
          photos: [{ label: 'Quarterdeck kitchen reset', color: '#437d74' }]
        }
      },
      sms: [
        {
          toWorker: 'Owen Cabral',
          body: 'Reminder: Quarterdeck Condo #2 needs bath towels before guest arrival at 6:30 PM.',
          offsetHours: -1.5,
          status: 'delivered'
        }
      ]
    },
    {
      title: 'Sunday Arrival - Blake Family',
      property: 'Hickory Hollow Cape',
      template: 'Damage Inspection',
      assignedTo: 'Ben Harkin',
      createdBy: 'Elena Mercer',
      status: 'VERIFIED',
      guestArrivalOffsetHours: 43,
      autoPhotoProof: true,
      readyOffsetHours: -6,
      verifiedOffsetHours: -5.5,
      verifiedBy: 'Elena Mercer',
      ownerReport: true,
      reportLink: true
    }
  ]
};

const midOrg: OrganizationSeed = {
  name: 'Driftline Vacation Homes',
  slug: 'driftline-vacation-homes',
  planType: 'PRO',
  subscriptionStatus: 'ACTIVE',
  maxWorkers: 99,
  maxProperties: -1,
  slaDefaultOffsetHours: 4,
  verificationRequired: true,
  brandName: 'Driftline Vacation Homes',
  brandAccentColor: '#136a5b',
  brandContactInfo: 'Readiness desk: readiness@driftlinehomes.com | (508) 555-3100',
  featured: true,
  users: [
    { name: 'Jordan Pierce', role: 'MANAGER', email: 'jordan@driftlinehomes.com' },
    { name: 'Leah Donnelly', role: 'MANAGER', email: 'leah@driftlinehomes.com' },
    { name: 'Miguel Santos', role: 'SUPERVISOR', email: 'miguel@driftlinehomes.com' },
    { name: 'Lena Pires', role: 'WORKER', phone: '+15085553101' },
    { name: 'Diego Avila', role: 'WORKER', phone: '+15085553102' },
    { name: 'Brooke Kelleher', role: 'WORKER', phone: '+15085553103' },
    { name: 'Nia Talbot', role: 'WORKER', phone: '+15085553104' },
    { name: 'Connor Rees', role: 'WORKER', phone: '+15085553105' },
    { name: 'April Moniz', role: 'WORKER', phone: '+15085553106' },
    { name: 'Marco Silva', role: 'WORKER', phone: '+15085553107' },
    { name: 'Tess Moran', role: 'WORKER', phone: '+15085553108' },
    { name: 'Jonah Pike', role: 'WORKER', phone: '+15085553109' },
    { name: 'Erin Doyle', role: 'WORKER', phone: '+15085553110' }
  ],
  properties: [
    property(
      'Harbor View Cottage',
      '12 Harbor Bluff Rd, Orleans, MA 02653',
      '3BR beachfront cottage',
      'Friday and Monday arrivals. Outdoor shower mat must be reset.'
    ),
    property(
      'Nauset Dune Escape',
      '42 Nauset Light Beach Rd, Eastham, MA 02642',
      '4BR dune house',
      'Owner closet is alarmed. Beach towels live in basement shelving.'
    ),
    property(
      'Chatham Bay House',
      '18 Salt Marsh Way, Chatham, MA 02633',
      '5BR family bayfront home',
      'Luxury arrival standard. Front walk, grill, and upper deck photos required.',
      { slaOffsetHours: 6 }
    ),
    property(
      'Seaside Retreat #3',
      '3 Seaside Ln Unit 3, Dennis Port, MA 02639',
      '2BR condo in a four-unit cluster',
      'Shared laundry room. Tight Saturday turn windows.'
    ),
    property(
      'Oyster Bend Cottage',
      '55 Cove Hollow Rd, Wellfleet, MA 02667',
      '3BR harbor-side cottage',
      'Guests often request early baggage drop. Entry photo matters.'
    ),
    property(
      'Salt Meadow House',
      '88 Meadow Lark Rd, Orleans, MA 02653',
      '4BR family rental near the marsh',
      'Trash day is Friday morning. Watch for bins left at curb.'
    ),
    property(
      'Millstone Family House',
      '14 Old Mill Rd, Brewster, MA 02631',
      '5BR multigenerational home',
      'Back patio toys must be binned before proof photo.'
    ),
    property(
      'Ocean Bluff Bungalow',
      '7 Ocean Bluff Dr, Truro, MA 02666',
      '2BR bluff-top bungalow',
      'Wind can slam the screen door. Check latch before departure.'
    ),
    property(
      'Shorebird Lane House',
      '29 Shorebird Ln, Harwich Port, MA 02646',
      '4BR family home',
      'Kids bunk room needs four matching pillow shams.'
    ),
    property(
      'Cedar Point Cottage',
      '11 Cedar Point Rd, Eastham, MA 02642',
      '3BR cottage',
      'Owner wants kitchen and porch proof every turn.'
    ),
    property(
      'Wellfleet Harbor Loft',
      '4 Commercial Wharf Unit 2, Wellfleet, MA 02667',
      '2BR harbor loft',
      'Tight parking. Dishwasher panel has a history of error codes.'
    ),
    property(
      'Breakwater Bungalow',
      '91 Ridgevale Rd, Chatham, MA 02633',
      '3BR bungalow',
      'Welcome basket staged on island, never on dining table.'
    ),
    property(
      'Bayberry Watch',
      '26 Bayberry Hill Rd, Yarmouth Port, MA 02675',
      '4BR hillside home',
      'Pool towels stay in mudroom cubbies.'
    ),
    property(
      'Gull Point Getaway',
      '63 Gull Point Rd, Dennis, MA 02638',
      '3BR cottage',
      'Shared path to beach. Remove wagons from driveway for arrival photo.'
    ),
    property(
      "Mariner's Rest",
      '15 Pilgrim Way, Brewster, MA 02631',
      '4BR Cape with screened porch',
      'Mosquito coils stored in porch trunk; do not leave out.'
    ),
    property(
      'Lighthouse Hill House',
      '101 Highland Light Rd, Truro, MA 02666',
      '5BR ocean-view home',
      'Property override requires 6h SLA and manager verification.',
      { slaOffsetHours: 6 }
    ),
    property(
      'Sandbar Studio #2',
      '2 Sandbar Ct Unit 2, Provincetown, MA 02657',
      '1BR studio',
      'Quick turns and no storage. Linen count is frequently tight.'
    ),
    property(
      'Blue Heron Haven',
      '76 Heron Marsh Rd, Orleans, MA 02653',
      '3BR marsh-front retreat',
      'Birdwatchers rent this one. Keep binocular basket on the shelf.'
    ),
    property(
      'Tern Point Cottage',
      '9 Tern Point Rd, Eastham, MA 02642',
      '2BR cottage',
      'Portable crib stored in guest closet.'
    ),
    property(
      'Windlass House',
      '48 Windlass Way, Chatham, MA 02633',
      '4BR family rental',
      'Formal owner photo expectations. Front hall must be lamp-lit after 4 PM.'
    ),
    property(
      'Cranberry Cove Cottage',
      '8 Cranberry Cove Rd, Brewster, MA 02631',
      '3BR cottage',
      'Check outside trash enclosure after windy days.'
    ),
    property(
      'Driftwood Landing',
      '51 Driftwood Ln, Eastham, MA 02642',
      '4BR beach house',
      'Shower curtain hooks go missing often in upstairs bath.'
    ),
    property(
      'Saltbox on Cove Road',
      '37 Cove Rd, Orleans, MA 02653',
      '4BR saltbox',
      'Coffee station inventory matters for owner scoring.'
    ),
    property(
      'Sea Glass Row #4',
      '4 Sea Glass Row, Dennis Port, MA 02639',
      '2BR townhouse in a six-unit row',
      'Cluster property. Entry + patio proof usually requested by owners.'
    ),
    property(
      'Harbor Lantern House',
      '66 Lantern Hill Rd, Wellfleet, MA 02667',
      '5BR harbor house',
      'Door code card sits in foyer bowl.'
    ),
    property(
      'Dunegrass Duplex #1',
      '1 Dunegrass Way, Eastham, MA 02642',
      '3BR duplex unit',
      'Shared driveway. Clear bins from both sides before photo.'
    ),
    property(
      'Pelham Pier House',
      '23 Pelham Rd, Chatham, MA 02633',
      '4BR arrival-heavy family home',
      'High owner scrutiny. Beds must match staging photos exactly.',
      { slaOffsetHours: 5 }
    ),
    property(
      'Tidepool Terrace',
      '84 Terrace View Rd, Orleans, MA 02653',
      '3BR terrace-level cottage',
      'Late arrivals common. Exterior path lights must be on.'
    )
  ],
  templates: sharedTemplates,
  scenarios: [
    {
      title: 'Saturday Arrival - Bennett Family',
      property: 'Harbor View Cottage',
      template: 'Standard Turnover',
      assignedTo: 'Lena Pires',
      createdBy: 'Jordan Pierce',
      status: 'NOT_READY',
      guestArrivalOffsetHours: 42,
      sms: [
        {
          toWorker: 'Lena Pires',
          body: 'New turnover assigned: Saturday Arrival - Bennett Family at Harbor View Cottage. Link inside.',
          offsetHours: -2,
          status: 'delivered'
        }
      ]
    },
    {
      title: 'Sunday Arrival - Callahan Family',
      property: 'Seaside Retreat #3',
      template: 'Linen & Supply Reset',
      assignedTo: 'Nia Talbot',
      createdBy: 'Leah Donnelly',
      status: 'NOT_READY',
      guestArrivalOffsetHours: 55
    },
    {
      title: 'Sunday Arrival - Patel Family',
      property: 'Blue Heron Haven',
      template: 'Pre-Arrival Final Check',
      assignedTo: 'Connor Rees',
      createdBy: 'Jordan Pierce',
      status: 'NOT_READY',
      guestArrivalOffsetHours: 68
    },
    {
      title: 'Tomorrow Arrival - Ross Family',
      property: 'Nauset Dune Escape',
      template: 'Standard Turnover',
      assignedTo: 'Diego Avila',
      createdBy: 'Jordan Pierce',
      status: 'IN_PROGRESS',
      guestArrivalOffsetHours: 9,
      progressCompletedCount: 7,
      itemDetails: {
        'Restock bath towel sets': {
          status: 'SKIPPED',
          notes: 'Only six bath towels clean; owner closet is short two sets.'
        },
        'Upload final kitchen photo': {
          status: 'COMPLETED',
          photos: [{ label: 'Nauset kitchen counters reset', color: '#356d73' }]
        }
      },
      sms: [
        {
          toWorker: 'Diego Avila',
          body: 'Reminder: Nauset Dune Escape is due ready by 12:00 PM. Reply ETA if towel delivery is late.',
          offsetHours: -0.75,
          status: 'delivered'
        }
      ]
    },
    {
      title: 'Friday Arrival - Holloway Family',
      property: 'Chatham Bay House',
      template: 'Deep Clean',
      assignedTo: 'April Moniz',
      createdBy: 'Leah Donnelly',
      status: 'IN_PROGRESS',
      guestArrivalOffsetHours: 14,
      progressCompletedCount: 9,
      autoPhotoProof: true,
      itemDetails: {
        'Confirm grill propane level': {
          notes: 'Swapped to backup tank. Old tank tagged empty.'
        },
        'Log any damage found': {
          notes: 'Kitchen island stool has a loose rung; safe for arrival but owner should replace soon.',
          photos: [{ label: 'Chatham stool issue', color: '#7d5d3b' }]
        }
      }
    },
    {
      title: 'Tonight Arrival - Soto Family',
      property: 'Wellfleet Harbor Loft',
      template: 'Damage Inspection',
      assignedTo: 'Erin Doyle',
      createdBy: 'Jordan Pierce',
      status: 'IN_PROGRESS',
      guestArrivalOffsetHours: 3,
      progressCompletedCount: 4,
      itemDetails: {
        'Run dishwasher quick cycle': {
          status: 'SKIPPED',
          notes: 'Dishwasher threw E24 again. Maintenance needed before next back-to-back stay.'
        },
        'Upload appliance panel photo': {
          status: 'COMPLETED',
          photos: [{ label: 'Dishwasher E24 panel', color: '#8c5f3f' }]
        }
      },
      sms: [
        {
          toWorker: 'Erin Doyle',
          body: 'Overdue alert: Wellfleet Harbor Loft is past SLA. Prioritize dishwasher evidence and final disposition.',
          offsetHours: -0.5,
          status: 'delivered'
        }
      ]
    },
    {
      title: 'Tonight Arrival - Greene Family',
      property: 'Ocean Bluff Bungalow',
      template: 'Pre-Arrival Final Check',
      assignedTo: 'Brooke Kelleher',
      createdBy: 'Leah Donnelly',
      status: 'READY',
      guestArrivalOffsetHours: 5,
      readyOffsetHours: -0.5,
      autoPhotoProof: true,
      itemDetails: {
        'Upload front-entry proof photo': {
          status: 'SKIPPED',
          notes: 'Bluff staircase had no signal. Brooke texted that she will retry from road turnout.'
        }
      },
      activity: [
        {
          actionType: 'MAGIC_LINK_SENT',
          offsetHours: -4,
          user: 'Leah Donnelly',
          metadata: { title: 'Tonight Arrival - Greene Family', workerName: 'Brooke Kelleher' }
        }
      ]
    },
    {
      title: 'Tonight Arrival - Adler Family',
      property: 'Oyster Bend Cottage',
      template: 'Standard Turnover',
      assignedTo: 'Jonah Pike',
      createdBy: 'Jordan Pierce',
      status: 'READY',
      guestArrivalOffsetHours: -0.75,
      readyOffsetHours: -0.25,
      autoPhotoProof: true,
      itemDetails: {
        'Restock bath towel sets': {
          status: 'SKIPPED',
          notes: 'Guest-approved exception: owner delivery coming with beach chairs within the hour.'
        }
      },
      activity: [
        {
          actionType: 'TURNOVER_READY',
          offsetHours: -0.25,
          user: 'Jonah Pike',
          metadata: { title: 'Tonight Arrival - Adler Family', exception: 'Late towel exception' }
        }
      ]
    },
    {
      title: 'Tonight Arrival - Walsh Family',
      property: 'Millstone Family House',
      template: 'Standard Turnover',
      assignedTo: 'Tess Moran',
      createdBy: 'Leah Donnelly',
      status: 'IN_PROGRESS',
      guestArrivalOffsetHours: 1.5,
      progressCompletedCount: 5,
      itemDetails: {
        'Remove all trash and recycling': {
          status: 'SKIPPED',
          notes: 'Driveway barrels still full from prior guest; hauler delayed.'
        },
        'Upload front-entry proof photo': {
          status: 'PENDING',
          notes: 'Waiting until toys are cleared from patio.'
        }
      },
      sms: [
        {
          toWorker: 'Marco Silva',
          body: 'Original assignment: Millstone Family House. Replying because flat tire delayed you?',
          offsetHours: -4,
          status: 'delivered'
        },
        {
          toWorker: 'Tess Moran',
          body: 'Reassigned: Millstone Family House is now yours. Trash barrels still out and arrival is tight.',
          offsetHours: -2,
          status: 'delivered'
        },
        {
          toWorker: 'Tess Moran',
          body: 'Overdue alert: Millstone Family House missed its readiness deadline. Send ETA after patio reset.',
          offsetHours: -0.25,
          status: 'delivered'
        }
      ],
      activity: [
        {
          actionType: 'TURNOVER_ASSIGNED',
          offsetHours: -4,
          user: 'Leah Donnelly',
          metadata: { title: 'Tonight Arrival - Walsh Family', workerName: 'Marco Silva' }
        },
        {
          actionType: 'TURNOVER_ASSIGNED',
          offsetHours: -2,
          user: 'Leah Donnelly',
          metadata: { title: 'Tonight Arrival - Walsh Family', workerName: 'Tess Moran', note: 'Last-minute reassignment' }
        }
      ]
    },
    {
      title: 'Tonight Arrival - Kim Family',
      property: 'Salt Meadow House',
      template: 'Standard Turnover',
      assignedTo: 'Marco Silva',
      createdBy: 'Jordan Pierce',
      status: 'NOT_READY',
      guestArrivalOffsetHours: 2,
      sms: [
        {
          toWorker: 'Marco Silva',
          body: 'Overdue alert: Salt Meadow House has not been started and the guest window is two hours out.',
          offsetHours: -0.4,
          status: 'delivered'
        }
      ]
    },
    {
      title: 'Friday Arrival - Porter Family',
      property: 'Cedar Point Cottage',
      template: 'Standard Turnover',
      assignedTo: 'Lena Pires',
      createdBy: 'Jordan Pierce',
      status: 'VERIFIED',
      guestArrivalOffsetHours: 20,
      readyOffsetHours: -3,
      verifiedOffsetHours: -2.5,
      verifiedBy: 'Miguel Santos',
      autoPhotoProof: true,
      ownerReport: true,
      ownerReportRecipient: 'owner+cedarpoint@example.com'
    },
    {
      title: 'Saturday Arrival - Dyer Family',
      property: 'Shorebird Lane House',
      template: 'Standard Turnover',
      assignedTo: 'April Moniz',
      createdBy: 'Leah Donnelly',
      status: 'VERIFIED',
      guestArrivalOffsetHours: 29,
      readyOffsetHours: -4,
      verifiedOffsetHours: -3.5,
      verifiedBy: 'Jordan Pierce',
      autoPhotoProof: true,
      ownerReport: true
    },
    {
      title: 'Sunday Arrival - Foster Family',
      property: 'Breakwater Bungalow',
      template: 'Pre-Arrival Final Check',
      assignedTo: 'Nia Talbot',
      createdBy: 'Jordan Pierce',
      status: 'VERIFIED',
      guestArrivalOffsetHours: 46,
      readyOffsetHours: -8,
      verifiedOffsetHours: -7.5,
      verifiedBy: 'Miguel Santos',
      autoPhotoProof: true,
      ownerReport: true,
      reportLink: true
    },
    {
      title: 'Saturday Arrival - Varela Family',
      property: 'Lighthouse Hill House',
      template: 'Deep Clean',
      assignedTo: 'Connor Rees',
      createdBy: 'Leah Donnelly',
      status: 'VERIFIED',
      guestArrivalOffsetHours: 33,
      readyOffsetHours: -1.25,
      verifiedOffsetHours: -0.75,
      verifiedBy: 'Jordan Pierce',
      autoPhotoProof: true,
      itemDetails: {
        'Confirm grill propane level': {
          status: 'SKIPPED',
          notes: 'Manager approved swap tomorrow; guest noted they will not use grill tonight.'
        }
      },
      ownerReport: true
    }
  ]
};

function makeClusterProperties(
  baseName: string,
  count: number,
  streetName: string,
  town: string,
  zip: string,
  descriptor: string,
  opsNotes: string,
  startNumber = 10
) {
  return Array.from({ length: count }, (_, index) =>
    property(
      `${baseName} #${index + 1}`,
      `${startNumber + index} ${streetName}, ${town}, MA ${zip}`,
      descriptor,
      opsNotes
    )
  );
}

const largeOrg: OrganizationSeed = {
  name: 'Blue Harbor Collection',
  slug: 'blue-harbor-collection',
  planType: 'PRO',
  subscriptionStatus: 'ACTIVE',
  maxWorkers: 150,
  maxProperties: -1,
  slaDefaultOffsetHours: 4,
  verificationRequired: true,
  brandName: 'Blue Harbor Collection',
  brandAccentColor: '#215b8a',
  brandContactInfo: 'Portfolio operations: (508) 555-4100',
  users: [
    { name: 'Nina Patel', role: 'MANAGER', email: 'nina@blueharborcollection.com' },
    { name: 'Wes Carver', role: 'MANAGER', email: 'wes@blueharborcollection.com' },
    { name: 'Carla Mendes', role: 'SUPERVISOR', email: 'carla@blueharborcollection.com' },
    { name: 'Pablo Reyes', role: 'WORKER', phone: '+15085554101' },
    { name: 'Jamie Hart', role: 'WORKER', phone: '+15085554102' },
    { name: 'Sofia Costa', role: 'WORKER', phone: '+15085554103' },
    { name: 'Derek Walsh', role: 'WORKER', phone: '+15085554104' },
    { name: 'Kira Lowell', role: 'WORKER', phone: '+15085554105' },
    { name: 'Bryce Norton', role: 'WORKER', phone: '+15085554106' },
    { name: 'Maya Torres', role: 'WORKER', phone: '+15085554107' },
    { name: 'Colin Sweeney', role: 'WORKER', phone: '+15085554108' },
    { name: 'Gina Russo', role: 'WORKER', phone: '+15085554109' },
    { name: 'Adrian Pike', role: 'WORKER', phone: '+15085554110' },
    { name: 'Shay Oconnor', role: 'WORKER', phone: '+15085554111' },
    { name: 'Rita Gomes', role: 'WORKER', phone: '+15085554112' },
    { name: 'Noah Bissett', role: 'WORKER', phone: '+15085554113' },
    { name: 'Paige Donahue', role: 'WORKER', phone: '+15085554114' },
    { name: 'Victor Lima', role: 'WORKER', phone: '+15085554115' }
  ],
  properties: [
    property(
      'Gull Point Manor',
      '91 Gull Point Rd, Orleans, MA 02653',
      '6BR signature home',
      'Flagship owner. Formal proof expectations and 5h SLA.',
      { slaOffsetHours: 5 }
    ),
    property(
      'Provincetown Harbor House',
      '188 Commercial St, Provincetown, MA 02657',
      '5BR harbor-front rental',
      'Parking coordination notes in owner binder.'
    ),
    property(
      'Longshore Lodge',
      '14 Longshore Way, Chatham, MA 02633',
      '5BR family home',
      'Outdoor kitchen must be reset and covered.'
    ),
    property(
      'Bay Ledger House',
      '44 Ledgerock Ln, Brewster, MA 02631',
      '4BR luxury family home',
      'Spa controls photographed on every deep-clean turnover.'
    ),
    property(
      'Saltworks Inn #1',
      '1 Saltworks Ln, Dennis Port, MA 02639',
      '3BR inn-style unit',
      'One of eight in a managed cluster.'
    ),
    property(
      'Saltworks Inn #2',
      '2 Saltworks Ln, Dennis Port, MA 02639',
      '3BR inn-style unit',
      'One of eight in a managed cluster.'
    ),
    property(
      'Saltworks Inn #3',
      '3 Saltworks Ln, Dennis Port, MA 02639',
      '3BR inn-style unit',
      'One of eight in a managed cluster.'
    ),
    property(
      'Saltworks Inn #4',
      '4 Saltworks Ln, Dennis Port, MA 02639',
      '3BR inn-style unit',
      'One of eight in a managed cluster.'
    ),
    ...makeClusterProperties(
      'Bayberry Row',
      12,
      'Bayberry Row',
      'Hyannis',
      '02601',
      '2BR townhouse in a managed row',
      'Cluster arrivals stack on Fridays. Entry proof keeps owner messages down.',
      20
    ),
    ...makeClusterProperties(
      'Wharfside Suites',
      10,
      'Wharfside Ct',
      'Provincetown',
      '02657',
      '1BR harbor suite',
      'Tight turnaround windows and minimal storage.'
    ),
    ...makeClusterProperties(
      'Salt Pond Cottages',
      8,
      'Salt Pond Rd',
      'Eastham',
      '02642',
      '2BR cottage cluster',
      'Beach chairs must be stacked in owner shed before photo.'
    ),
    ...makeClusterProperties(
      "Captain's Walk",
      10,
      "Captain's Walk",
      'Harwich Port',
      '02646',
      '3BR townhouse cluster',
      'Front step photos are required due to shared entries.'
    ),
    ...makeClusterProperties(
      'Shoreline Court',
      8,
      'Shoreline Ct',
      'Dennis Port',
      '02639',
      '2BR condo cluster',
      'Laundry runs across units, so linen resets need proof.'
    ),
    ...makeClusterProperties(
      'Sandbar Lanes',
      8,
      'Sandbar Ln',
      'Wellfleet',
      '02667',
      '3BR cottage cluster',
      'Trash enclosure is a common failure point across the row.'
    )
  ],
  templates: sharedTemplates,
  scenarios: [
    {
      title: 'Friday Arrival - Neal Group',
      property: 'Gull Point Manor',
      template: 'Deep Clean',
      assignedTo: 'Maya Torres',
      createdBy: 'Nina Patel',
      status: 'IN_PROGRESS',
      guestArrivalOffsetHours: 12,
      progressCompletedCount: 10,
      autoPhotoProof: true,
      itemDetails: {
        'Log any damage found': {
          notes: 'Minor scuff on upstairs hallway wall documented for owner file.',
          photos: [{ label: 'Gull Point hallway scuff', color: '#76533d' }]
        }
      }
    },
    {
      title: 'Saturday Arrival - Crane Family',
      property: 'Bayberry Row #4',
      template: 'Standard Turnover',
      assignedTo: 'Rita Gomes',
      createdBy: 'Wes Carver',
      status: 'READY',
      guestArrivalOffsetHours: 7,
      readyOffsetHours: -1,
      autoPhotoProof: true,
      itemDetails: {
        'Remove all trash and recycling': {
          status: 'SKIPPED',
          notes: 'City pickup missed the cluster this morning; enclosure photographed for audit trail.'
        }
      }
    },
    {
      title: 'Tonight Arrival - Deluca Family',
      property: 'Wharfside Suites #3',
      template: 'Linen & Supply Reset',
      assignedTo: 'Pablo Reyes',
      createdBy: 'Carla Mendes',
      status: 'NOT_READY',
      guestArrivalOffsetHours: 6
    },
    {
      title: 'Sunday Arrival - Kim Party',
      property: 'Longshore Lodge',
      template: 'Pre-Arrival Final Check',
      assignedTo: 'Victor Lima',
      createdBy: 'Nina Patel',
      status: 'VERIFIED',
      guestArrivalOffsetHours: 36,
      readyOffsetHours: -5,
      verifiedOffsetHours: -4.5,
      verifiedBy: 'Carla Mendes',
      autoPhotoProof: true,
      ownerReport: true
    },
    {
      title: 'Saturday Arrival - Hsu Family',
      property: 'Sandbar Lanes #5',
      template: 'Standard Turnover',
      assignedTo: 'Paige Donahue',
      createdBy: 'Wes Carver',
      status: 'IN_PROGRESS',
      guestArrivalOffsetHours: 4,
      progressCompletedCount: 6,
      itemDetails: {
        'Remove all trash and recycling': {
          status: 'SKIPPED',
          notes: 'Repeat enclosure overflow in Sandbar row. Supervisor notified.'
        }
      }
    },
    {
      title: 'Saturday Arrival - Foster Group',
      property: 'Bay Ledger House',
      template: 'Damage Inspection',
      assignedTo: 'Sofia Costa',
      createdBy: 'Nina Patel',
      status: 'VERIFIED',
      guestArrivalOffsetHours: 28,
      readyOffsetHours: -3,
      verifiedOffsetHours: -2.5,
      verifiedBy: 'Nina Patel',
      autoPhotoProof: true,
      ownerReport: true
    },
    {
      title: 'Friday Arrival - Gordon Family',
      property: 'Captain\'s Walk #6',
      template: 'Standard Turnover',
      assignedTo: 'Derek Walsh',
      createdBy: 'Carla Mendes',
      status: 'READY',
      guestArrivalOffsetHours: -0.5,
      readyOffsetHours: -0.2,
      autoPhotoProof: true,
      itemDetails: {
        'Upload front-entry proof photo': {
          status: 'SKIPPED',
          notes: 'Worker took patio shot instead of front stoop; still awaiting proper proof.'
        }
      }
    },
    {
      title: 'Monday Arrival - Santos Family',
      property: 'Shoreline Court #2',
      template: 'Linen & Supply Reset',
      assignedTo: 'Kira Lowell',
      createdBy: 'Wes Carver',
      status: 'NOT_READY',
      guestArrivalOffsetHours: 62
    }
  ]
};

const premiumOrg: OrganizationSeed = {
  name: 'Shoreline Reserve',
  slug: 'shoreline-reserve',
  planType: 'PRO',
  subscriptionStatus: 'ACTIVE',
  maxWorkers: 40,
  maxProperties: -1,
  slaDefaultOffsetHours: 6,
  verificationRequired: true,
  brandName: 'Shoreline Reserve Private Rentals',
  brandAccentColor: '#214a72',
  brandContactInfo: 'Private owner desk: concierge@shorelinereserve.com | (508) 555-5100',
  users: [
    { name: 'Claire Beaumont', role: 'MANAGER', email: 'claire@shorelinereserve.com' },
    { name: 'Ava Sinclair', role: 'SUPERVISOR', email: 'ava@shorelinereserve.com' },
    { name: 'Noelle Carter', role: 'WORKER', phone: '+15085555101' },
    { name: 'Isaac Boone', role: 'WORKER', phone: '+15085555102' },
    { name: 'Celeste Vega', role: 'WORKER', phone: '+15085555103' },
    { name: 'Miles Renaud', role: 'WORKER', phone: '+15085555104' },
    { name: 'Helena Frost', role: 'WORKER', phone: '+15085555105' },
    { name: 'Grant Walsh', role: 'WORKER', phone: '+15085555106' }
  ],
  properties: [
    property(
      'Eastward Estate',
      '4 Eastward Rd, Chatham, MA 02633',
      '7BR luxury estate',
      'Every turnover gets owner-ready proof. Spa terrace and wine fridge matter.',
      { slaOffsetHours: 8 }
    ),
    property(
      'Grey Shingle Manor',
      '18 Grey Shingle Ln, Orleans, MA 02653',
      '6BR shingle-style residence',
      'Owner requests bed symmetry and foyer styling on every photo.'
    ),
    property(
      'Oyster Moon Villa',
      '51 Moon Shell Rd, Truro, MA 02666',
      '5BR villa with pool',
      'Outdoor lounge is high-scrutiny. Cushions must be aligned.'
    ),
    property(
      'The Breakers at Chatham',
      '92 Shore Cliff Dr, Chatham, MA 02633',
      '6BR oceanfront home',
      'Manager verification required before every arrival.'
    ),
    property(
      'Dunecrest Residence',
      '33 Dunecrest Path, Eastham, MA 02642',
      '5BR elevated residence',
      'Glass railings must be spotless for arrival photography.'
    ),
    property(
      'Seaward Glass House',
      '11 Panorama Way, Wellfleet, MA 02667',
      '4BR architectural rental',
      'Fingerprint cleanup on sliders is a known repeat issue.'
    ),
    property(
      'Cove House at Stage Neck',
      '7 Stage Neck Rd, Chatham, MA 02633',
      '5BR executive family home',
      'Children often arrive early. Final staging is non-negotiable.'
    ),
    property(
      'Salt Air Manor',
      '64 Harbor Gate Rd, Orleans, MA 02653',
      '6BR luxury manor',
      'Owner receives same-day turnover readiness report every Saturday.'
    ),
    property(
      'The Lantern House',
      '9 Lantern Bluff Rd, Provincetown, MA 02657',
      '4BR design-forward rental',
      'Entry lanterns, living room styling, and scent diffusers must be reset.'
    )
  ],
  templates: sharedTemplates,
  scenarios: [
    {
      title: 'Friday Arrival - Lowell Family',
      property: 'Eastward Estate',
      template: 'Deep Clean',
      assignedTo: 'Helena Frost',
      createdBy: 'Claire Beaumont',
      status: 'VERIFIED',
      guestArrivalOffsetHours: 24,
      readyOffsetHours: -4,
      verifiedOffsetHours: -3.5,
      verifiedBy: 'Ava Sinclair',
      autoPhotoProof: true,
      ownerReport: true,
      reportLink: true,
      ownerReportRecipient: 'estate-owner@example.com'
    },
    {
      title: 'Saturday Arrival - Grant Family',
      property: 'The Breakers at Chatham',
      template: 'Pre-Arrival Final Check',
      assignedTo: 'Celeste Vega',
      createdBy: 'Claire Beaumont',
      status: 'READY',
      guestArrivalOffsetHours: 8,
      readyOffsetHours: -0.8,
      autoPhotoProof: true,
      itemDetails: {
        'Upload living room proof photo': {
          status: 'SKIPPED',
          notes: 'Luxury throw blanket still being steamed. Awaiting final styling shot.'
        }
      }
    },
    {
      title: 'Tonight Arrival - Wren Family',
      property: 'Seaward Glass House',
      template: 'Standard Turnover',
      assignedTo: 'Noelle Carter',
      createdBy: 'Ava Sinclair',
      status: 'IN_PROGRESS',
      guestArrivalOffsetHours: 5,
      progressCompletedCount: 8,
      itemDetails: {
        'Upload final kitchen photo': {
          status: 'COMPLETED',
          photos: [{ label: 'Seaward kitchen proof', color: '#4e6887' }]
        },
        'Upload front-entry proof photo': {
          status: 'PENDING',
          notes: 'Waiting for florist to finish the entry arrangement.'
        }
      }
    },
    {
      title: 'Sunday Arrival - Porter Family',
      property: 'Cove House at Stage Neck',
      template: 'Damage Inspection',
      assignedTo: 'Grant Walsh',
      createdBy: 'Claire Beaumont',
      status: 'VERIFIED',
      guestArrivalOffsetHours: 40,
      readyOffsetHours: -6,
      verifiedOffsetHours: -5,
      verifiedBy: 'Claire Beaumont',
      autoPhotoProof: true,
      ownerReport: true
    },
    {
      title: 'Saturday Arrival - Harding Family',
      property: 'Dunecrest Residence',
      template: 'Pre-Arrival Final Check',
      assignedTo: 'Miles Renaud',
      createdBy: 'Ava Sinclair',
      status: 'NOT_READY',
      guestArrivalOffsetHours: 30
    },
    {
      title: 'Tonight Arrival - Benson Family',
      property: 'The Lantern House',
      template: 'Standard Turnover',
      assignedTo: 'Isaac Boone',
      createdBy: 'Claire Beaumont',
      status: 'READY',
      guestArrivalOffsetHours: -0.25,
      readyOffsetHours: -0.1,
      autoPhotoProof: true,
      itemDetails: {
        'Confirm Wi-Fi card and welcome binder visible': {
          notes: 'Binder replaced after owner revised theater instructions.'
        }
      }
    }
  ]
};

function buildSeedDeck(): OrganizationSeed[] {
  return [midOrg, smallOrg, largeOrg, premiumOrg];
}

async function createOrganization(seed: OrganizationSeed, passwordHash: string): Promise<OrgContext> {
  const now = new Date();
  const trialEndsAt = seed.subscriptionStatus === 'TRIAL' ? new Date(now.getTime() + 14 * DAY) : null;

  const organization = await db.organization.create({
    data: {
      name: seed.name,
      slug: seed.slug,
      planType: seed.planType,
      subscriptionStatus: seed.subscriptionStatus,
      trialEndsAt,
      maxWorkers: seed.maxWorkers,
      maxProperties: seed.maxProperties,
      brandName: seed.brandName,
      brandAccentColor: seed.brandAccentColor,
      brandContactInfo: seed.brandContactInfo,
      slaDefaultOffsetHours: seed.slaDefaultOffsetHours,
      verificationRequired: seed.verificationRequired,
      createdAt: new Date(now.getTime() - 90 * DAY)
    }
  });

  await db.subscription.create({
    data: {
      organizationId: organization.id,
      stripeCustomerId: `cus_seed_${seed.slug}`,
      stripeSubscriptionId: `sub_seed_${seed.slug}`,
      priceId: seed.planType === 'PRO' ? 'price_seed_pro' : 'price_seed_starter',
      status: seed.subscriptionStatus,
      currentPeriodEnd: new Date(now.getTime() + 30 * DAY),
      trialEndsAt
    }
  });

  const users: OrgContext['users'] = {};
  for (const user of seed.users) {
    const created = await db.user.create({
      data: {
        organizationId: organization.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        smsOptIn: user.smsOptIn ?? true,
        passwordHash: user.email ? passwordHash : null,
        createdAt: new Date(now.getTime() - 75 * DAY)
      }
    });
    users[user.name] = {
      id: created.id,
      name: created.name,
      role: created.role,
      phone: created.phone
    };

    if (user.role === 'WORKER') {
      await db.activityLog.create({
        data: {
          organizationId: organization.id,
          userId: seed.users.find((candidate) => candidate.role === 'MANAGER')?.name
            ? users[seed.users.find((candidate) => candidate.role === 'MANAGER')!.name].id
            : null,
          actionType: 'WORKER_ADDED',
          entityType: 'User',
          entityId: created.id,
          metadata: { workerName: created.name },
          createdAt: new Date(now.getTime() - 60 * DAY)
        }
      });
    }
  }

  const properties: OrgContext['properties'] = {};
  for (const item of seed.properties) {
    const created = await db.property.create({
      data: {
        organizationId: organization.id,
        name: item.name,
        address: item.address,
        notes: item.notes,
        slaOffsetHours: item.slaOffsetHours ?? null,
        verificationRequired: item.verificationRequired ?? null,
        createdAt: new Date(now.getTime() - 60 * DAY)
      }
    });
    properties[item.name] = {
      id: created.id,
      name: created.name,
      slaOffsetHours: created.slaOffsetHours,
      verificationRequired: created.verificationRequired
    };
  }

  const templates: OrgContext['templates'] = {};
  for (const template of seed.templates) {
    const created = await db.checklistTemplate.create({
      data: {
        organizationId: organization.id,
        name: template.name,
        createdAt: new Date(now.getTime() - 50 * DAY),
        items: {
          create: template.items.map((item, index) => ({
            title: item.title,
            description: item.description,
            photoRequired: item.photoRequired ?? false,
            sortOrder: index
          }))
        }
      }
    });
    templates[template.name] = {
      id: created.id,
      name: created.name,
      items: template.items
    };

    const manager = seed.users.find((candidate) => candidate.role === 'MANAGER');
    await db.activityLog.create({
      data: {
        organizationId: organization.id,
        userId: manager ? users[manager.name].id : null,
        actionType: 'TEMPLATE_CREATED',
        entityType: 'ChecklistTemplate',
        entityId: created.id,
        metadata: { name: created.name },
        createdAt: new Date(now.getTime() - 49 * DAY)
      }
    });
  }

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    planType: organization.planType,
    users,
    properties,
    templates
  };
}

async function createMagicLink(workOrderId: string, expiresAt: Date, usedAt: Date | null) {
  const record = await db.magicLinkToken.create({
    data: {
      workOrderId,
      token: '',
      expiresAt,
      usedAt
    }
  });

  const token = jwt.sign(
    { workOrderId, type: 'worker', jti: record.id },
    MAGIC_SECRET,
    { expiresIn: '72h' }
  );

  await db.magicLinkToken.update({
    where: { id: record.id },
    data: { token }
  });

  return token;
}

async function createReportShortLink(orgId: string, turnoverId: string) {
  const token = randomToken(10);
  await db.shortLink.create({
    data: {
      organizationId: orgId,
      purpose: 'REPORT_LINK',
      target: turnoverId,
      token,
      expiresAt: new Date(Date.now() + 7 * DAY)
    }
  });
  return `${BASE_URL}/reports/${token}`;
}

function computeSlaDeadline(
  guestArrivalAt: Date,
  orgOffsetHours: number,
  propertyOffsetHours: number | null
) {
  const offsetHours = propertyOffsetHours ?? orgOffsetHours;
  return new Date(guestArrivalAt.getTime() - offsetHours * HOUR);
}

function buildChecklistItems(
  propertyName: string,
  template: TemplateSeed,
  scenario: ScenarioSeed
) {
  const defaultCompleted =
    scenario.status === 'READY' || scenario.status === 'VERIFIED'
      ? template.items.length
      : scenario.progressCompletedCount ?? 0;

  return template.items.map((item, index) => {
    const detail = scenario.itemDetails?.[item.title];
    let status: ItemStatus = 'PENDING';

    if (scenario.status === 'READY' || scenario.status === 'VERIFIED') {
      status = 'COMPLETED';
    } else if (scenario.status === 'IN_PROGRESS' && index < defaultCompleted) {
      status = 'COMPLETED';
    }

    if (detail?.status) status = detail.status;

    const completedAt =
      status === 'COMPLETED'
        ? atOffset(detail?.completedOffsetHours ?? (scenario.readyOffsetHours ?? -1.5) - index * 0.05)
        : null;

    const attachments =
      detail?.photos ??
      (scenario.autoPhotoProof && item.photoRequired && status === 'COMPLETED'
        ? [
            {
              label: `${propertyName} - ${item.title}`,
              color: ['#0f766e', '#295f87', '#8c5f3f', '#5d7f5d'][index % 4]
            }
          ]
        : []);

    return {
      title: item.title,
      description: item.description ?? null,
      photoRequired: item.photoRequired ?? false,
      sortOrder: index,
      status,
      completedAt,
      notes: detail?.notes ?? null,
      attachments
    };
  });
}

function computeReadinessScore(items: { status: ItemStatus }[]) {
  if (items.length === 0) return 0;
  const completed = items.filter((item) => item.status === 'COMPLETED').length;
  return Math.round((completed / items.length) * 100);
}

function buildActivityTrail(
  orgId: string,
  context: OrgContext,
  scenario: ScenarioSeed,
  turnoverId: string,
  checklistItems: { title: string; status: ItemStatus; attachments: PhotoSeed[] }[],
  magicLinkOpenedAt: Date | null
) {
  const createdById = context.users[scenario.createdBy].id;
  const logs: {
    organizationId: string;
    userId: string | null;
    actionType: ActivityActionType;
    entityType: string;
    entityId: string;
    metadata: Prisma.JsonObject;
    createdAt: Date;
  }[] = [];

  logs.push({
    organizationId: orgId,
    userId: createdById,
    actionType: 'TURNOVER_SCHEDULED',
    entityType: 'Turnover',
    entityId: turnoverId,
    metadata: { title: scenario.title, propertyName: scenario.property },
    createdAt: atOffset(Math.min(-24, scenario.guestArrivalOffsetHours - 36))
  });

  logs.push({
    organizationId: orgId,
    userId: createdById,
    actionType: 'TURNOVER_ASSIGNED',
    entityType: 'Turnover',
    entityId: turnoverId,
    metadata: { title: scenario.title, workerName: scenario.assignedTo },
    createdAt: atOffset(Math.min(-8, scenario.guestArrivalOffsetHours - 12))
  });

  logs.push({
    organizationId: orgId,
    userId: createdById,
    actionType: 'MAGIC_LINK_SENT',
    entityType: 'Turnover',
    entityId: turnoverId,
    metadata: { title: scenario.title, workerName: scenario.assignedTo },
    createdAt: atOffset(Math.min(-6, scenario.guestArrivalOffsetHours - 8))
  });

  if (magicLinkOpenedAt) {
    logs.push({
      organizationId: orgId,
      userId: null,
      actionType: 'MAGIC_LINK_USED',
      entityType: 'Turnover',
      entityId: turnoverId,
      metadata: { title: scenario.title },
      createdAt: magicLinkOpenedAt
    });
  }

  if (checklistItems.some((item) => item.attachments.length > 0)) {
    logs.push({
      organizationId: orgId,
      userId: null,
      actionType: 'PHOTO_UPLOADED',
      entityType: 'Turnover',
      entityId: turnoverId,
      metadata: { title: scenario.title },
      createdAt: atOffset((scenario.readyOffsetHours ?? -1) - 0.1)
    });
  }

  if (scenario.status === 'READY' || scenario.status === 'VERIFIED') {
    logs.push({
      organizationId: orgId,
      userId: context.users[scenario.verifiedBy ?? scenario.createdBy].id,
      actionType: 'TURNOVER_READY',
      entityType: 'Turnover',
      entityId: turnoverId,
      metadata: { title: scenario.title },
      createdAt: atOffset(scenario.readyOffsetHours ?? -1)
    });
  }

  if (scenario.status === 'VERIFIED') {
    logs.push({
      organizationId: orgId,
      userId: context.users[scenario.verifiedBy ?? scenario.createdBy].id,
      actionType: 'TURNOVER_VERIFIED',
      entityType: 'Turnover',
      entityId: turnoverId,
      metadata: { title: scenario.title },
      createdAt: atOffset(scenario.verifiedOffsetHours ?? -0.5)
    });
  }

  for (const extra of scenario.activity ?? []) {
    logs.push({
      organizationId: orgId,
      userId: extra.user ? context.users[extra.user].id : null,
      actionType: extra.actionType,
      entityType: extra.entityType ?? 'Turnover',
      entityId: turnoverId,
      metadata: { title: scenario.title, ...(extra.metadata ?? {}) },
      createdAt: atOffset(extra.offsetHours)
    });
  }

  return logs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

async function seedScenario(context: OrgContext, seed: OrganizationSeed, scenario: ScenarioSeed) {
  const property = context.properties[scenario.property];
  const template = context.templates[scenario.template];
  const assignedTo = context.users[scenario.assignedTo];
  const createdBy = context.users[scenario.createdBy];
  const verifiedBy = scenario.verifiedBy ? context.users[scenario.verifiedBy] : null;

  const guestArrivalAt = atOffset(scenario.guestArrivalOffsetHours);
  const scheduledStartAt =
    scenario.scheduledStartOffsetHours === null
      ? null
      : atOffset(
          scenario.scheduledStartOffsetHours ??
            Math.min(scenario.guestArrivalOffsetHours - 6, -2)
        );
  const slaDeadlineAt = computeSlaDeadline(
    guestArrivalAt,
    seed.slaDefaultOffsetHours,
    property.slaOffsetHours
  );

  const checklistItems = buildChecklistItems(property.name, template, scenario);
  const readinessScore = computeReadinessScore(checklistItems);
  const allDone = checklistItems.every((item) => item.status !== 'PENDING');
  const checklistStartedAt =
    scenario.status === 'NOT_READY'
      ? null
      : atOffset(Math.min((scenario.readyOffsetHours ?? -2) - 1.2, -0.5));
  const checklistCompletedAt =
    allDone && (scenario.status === 'READY' || scenario.status === 'VERIFIED')
      ? atOffset(scenario.readyOffsetHours ?? -1)
      : null;
  const readyAt =
    scenario.status === 'READY' || scenario.status === 'VERIFIED'
      ? atOffset(scenario.readyOffsetHours ?? -1)
      : null;
  const verifiedAt = scenario.status === 'VERIFIED' ? atOffset(scenario.verifiedOffsetHours ?? -0.5) : null;
  const workOrderStatus: WorkOrderStatus =
    scenario.status === 'NOT_READY'
      ? 'PENDING'
      : scenario.status === 'IN_PROGRESS'
        ? 'IN_PROGRESS'
        : 'COMPLETED';

  const turnover = await db.turnover.create({
    data: {
      organizationId: context.id,
      propertyId: property.id,
      templateId: template.id,
      assignedToId: assignedTo.id,
      createdById: createdBy.id,
      title: scenario.title,
      scheduledStartAt,
      guestArrivalAt,
      slaDeadlineAt,
      status: scenario.status,
      readinessScore,
      readyAt,
      verifiedAt,
      verifiedById: verifiedBy?.id ?? null,
      createdAt: atOffset(Math.min(-30, scenario.guestArrivalOffsetHours - 40))
    }
  });

  const workOrder = await db.workOrder.create({
    data: {
      organizationId: context.id,
      propertyId: property.id,
      templateId: template.id,
      turnoverId: turnover.id,
      assignedToId: assignedTo.id,
      createdById: createdBy.id,
      title: scenario.title,
      scheduledFor: slaDeadlineAt,
      status: workOrderStatus,
      createdAt: atOffset(Math.min(-30, scenario.guestArrivalOffsetHours - 40))
    }
  });

  const usedAt = checklistStartedAt;
  const tokenExpiresAt = new Date(Date.now() + 3 * DAY);
  const magicToken = await createMagicLink(workOrder.id, tokenExpiresAt, usedAt);

  await db.workOrder.update({
    where: { id: workOrder.id },
    data: {
      magicToken,
      tokenExpiresAt
    }
  });

  const run = await db.checklistRun.create({
    data: {
      workOrderId: workOrder.id,
      startedAt: checklistStartedAt,
      completedAt: checklistCompletedAt,
      createdAt: atOffset(Math.min(-18, scenario.guestArrivalOffsetHours - 12))
    }
  });

  for (const item of checklistItems) {
    const createdItem = await db.checklistItemRun.create({
      data: {
        runId: run.id,
        title: item.title,
        description: item.description,
        photoRequired: item.photoRequired,
        sortOrder: item.sortOrder,
        status: item.status,
        completedAt: item.completedAt,
        notes: item.notes
      }
    });

    for (const attachment of item.attachments) {
      const image = photoDataUrl(attachment.label, attachment.color);
      await db.attachment.create({
        data: {
          itemRunId: createdItem.id,
          url: image.url,
          filename: image.filename,
          mimeType: image.mimeType,
          sizeBytes: image.sizeBytes,
          capturedByName: assignedTo.name
        }
      });
    }
  }

  await db.turnovernessCheck.create({
    data: {
      turnoverId: turnover.id,
      checklistRunId: run.id,
      startedAt: checklistStartedAt,
      completedAt: checklistCompletedAt,
      readinessDelta: readinessScore
    }
  });

  const readinessHistory = [
    {
      status: 'NOT_READY' as TurnoverStatus,
      occurredAt: atOffset(Math.min(-24, scenario.guestArrivalOffsetHours - 24)),
      actorId: createdBy.id,
      note: 'Turnover created'
    }
  ];

  if (checklistStartedAt) {
    readinessHistory.push({
      status: 'IN_PROGRESS' as TurnoverStatus,
      occurredAt: checklistStartedAt,
      actorId: null,
      note: 'Field worker opened the SMS link'
    });
  }

  if (readyAt) {
    readinessHistory.push({
      status: 'READY' as TurnoverStatus,
      occurredAt: readyAt,
      actorId: verifiedBy?.id ?? createdBy.id,
      note: readinessScore < 100 ? 'Ready with exceptions logged' : 'Checklist completed'
    });
  }

  if (verifiedAt) {
    readinessHistory.push({
      status: 'VERIFIED' as TurnoverStatus,
      occurredAt: verifiedAt,
      actorId: verifiedBy?.id ?? createdBy.id,
      note: 'Manager verified photo proof'
    });
  }

  await db.readinessEvent.createMany({
    data: readinessHistory.map((event) => ({
      turnoverId: turnover.id,
      status: event.status,
      occurredAt: event.occurredAt,
      actorId: event.actorId,
      note: event.note
    }))
  });

  if (scenario.status === 'VERIFIED' || scenario.ownerReport) {
    await db.ownerReport.create({
      data: {
        turnoverId: turnover.id,
        generatedAt: verifiedAt ?? atOffset(-0.25),
        generatedById: verifiedBy?.id ?? createdBy.id,
        slaStatus: readyAt && readyAt <= slaDeadlineAt ? 'on-time' : 'late',
        readinessScore,
        verifiedAt,
        verifiedByName: verifiedBy?.name ?? createdBy.name
      }
    });
  }

  if (scenario.reportLink) {
    context.featuredReportUrl = await createReportShortLink(context.id, turnover.id);
  }

  for (const sms of scenario.sms ?? []) {
    const to =
      sms.to ??
      (sms.toWorker ? context.users[sms.toWorker].phone : null);
    if (!to) continue;
    const createdAt = atOffset(sms.offsetHours);
    await db.smsMessage.create({
      data: {
        organizationId: context.id,
        to,
        body: sms.body,
        provider: sms.provider ?? 'twilio',
        status: sms.status ?? 'delivered',
        externalId: `SM${randomToken(12)}`,
        deliveredAt:
          sms.deliveredOffsetHours === null
            ? null
            : atOffset(sms.deliveredOffsetHours ?? sms.offsetHours + 0.02),
        errorMessage: sms.errorMessage ?? null,
        sentAt: createdAt,
        createdAt
      }
    });
  }

  const activityTrail = buildActivityTrail(
    context.id,
    context,
    scenario,
    turnover.id,
    checklistItems.map((item) => ({
      title: item.title,
      status: item.status,
      attachments: item.attachments
    })),
    usedAt
  );

  await db.activityLog.createMany({
    data: activityTrail.map((log) => ({
      ...log,
      userId: log.userId ?? null
    }))
  });
}

async function main() {
  console.log('Seeding SBA demo data...');

  await db.activityLog.deleteMany({});
  await db.ownerReport.deleteMany({});
  await db.readinessEvent.deleteMany({});
  await db.turnovernessCheck.deleteMany({});
  await db.turnover.deleteMany({});
  await db.shortLink.deleteMany({});
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

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const seeds = buildSeedDeck();
  const contexts: OrgContext[] = [];

  for (const seed of seeds) {
    const context = await createOrganization(seed, passwordHash);
    for (const scenario of seed.scenarios) {
      await seedScenario(context, seed, scenario);
    }
    contexts.push(context);
  }

  console.log('\nSeed complete.\n');
  console.log(`Suggested demo login: jordan@driftlinehomes.com / ${DEMO_PASSWORD}`);
  console.log(`Small operator login: elena@pinetidecottages.com / ${DEMO_PASSWORD}`);
  console.log(`Large operator login: nina@blueharborcollection.com / ${DEMO_PASSWORD}`);
  console.log(`Premium operator login: claire@shorelinereserve.com / ${DEMO_PASSWORD}`);

  const featured = contexts.find((context) => context.slug === 'driftline-vacation-homes');
  if (featured?.featuredReportUrl) {
    console.log(`Featured report link: ${featured.featuredReportUrl}`);
  }

  console.log('\nSeeded organizations:');
  for (const seed of seeds) {
    console.log(
      `  - ${seed.name}: ${seed.properties.length} properties, ${seed.users.filter((user) => user.role === 'WORKER').length} workers, ${seed.scenarios.length} live turnovers`
    );
  }
  console.log('');
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
