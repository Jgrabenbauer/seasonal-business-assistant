import type { User, Organization } from '@prisma/client';

declare global {
  namespace App {
    interface Locals {
      user: (User & { organization: Organization }) | null;
    }
    // interface Error {}
    // interface PageData {}
    // interface Platform {}
  }
}

export {};
