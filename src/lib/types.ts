import type {
  Organization,
  User,
  Property,
  WorkOrder,
  Turnover,
  ChecklistTemplate,
  ChecklistItemTemplate,
  ChecklistRun,
  ChecklistItemRun,
  Attachment,
  SmsMessage
} from '@prisma/client';

export type {
  Organization,
  User,
  Property,
  WorkOrder,
  Turnover,
  ChecklistTemplate,
  ChecklistItemTemplate,
  ChecklistRun,
  ChecklistItemRun,
  Attachment,
  SmsMessage
};

export type WorkOrderWithRelations = WorkOrder & {
  property: Property;
  assignedTo: User | null;
  createdBy: User;
  template: ChecklistTemplate | null;
  checklistRun:
    | (ChecklistRun & {
        items: (ChecklistItemRun & { attachments: Attachment[] })[];
      })
    | null;
};

export type TurnoverWithRelations = Turnover & {
  property: Property;
  assignedTo: User | null;
  createdBy: User;
  template: ChecklistTemplate | null;
  workOrder: WorkOrder | null;
};

export type ChecklistRunWithItems = ChecklistRun & {
  items: (ChecklistItemRun & { attachments: Attachment[] })[];
};
