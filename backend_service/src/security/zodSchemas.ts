import { z } from 'zod';

/**
 * SECURE CODING: MASS ASSIGNMENT & INJECTION DEFENSE SCHEMAS
 * By invoking `.strict()` on Zod schemas, we mathematically reject or strip any unauthorized fields
 * that an attacker attempts to inject into the request payload.
 */

// Schema 1: Issuing Equipment (Coordinator Only)
export const IssueEquipmentSchema = z.object({
  student_id: z.number().int().positive('Valid Student ID is required'),
  item_id: z.number().int().positive('Valid Item ID is required'),
  asset_id: z.string().trim().regex(/^DB-\d{3}$/, 'Asset ID format must match DB-XXX').optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Excessive quantity requested'),
  purpose: z.string().trim().min(3).max(200, 'Purpose must be between 3 and 200 characters'),
  issuing_staff: z.string().trim().min(2).max(100),
  // Optional simulated custom issue date (useful for demoing overdue items)
  custom_issue_date: z.string().datetime().optional()
}).strict();

// Schema 2: Request Renewal (Student Only)
// Notice: Students CANNOT send `extended_due_date` or `status: "APPROVED"`. Any attempt will fail validation.
export const RenewalRequestSchema = z.object({
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(300, 'Reason cannot exceed 300 characters')
}).strict();

// Schema 3: Approve/Reject Renewal (Coordinator Only)
export const RenewalActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], { errorMap: () => ({ message: "Action must be APPROVE or REJECT" }) }),
  remarks: z.string().trim().max(300).optional(),
  coordinator_name: z.string().trim().min(2).max(100)
}).strict();

// Schema 4: Return Equipment (Full or Partial Return)
export const ReturnEquipmentSchema = z.object({
  quantity_returned: z.number().int().positive('Quantity returned must be positive'),
  condition: z.enum(['USABLE', 'DAMAGED', 'MAINTENANCE'], {
    errorMap: () => ({ message: "Condition must be USABLE, DAMAGED, or MAINTENANCE" })
  }),
  receiving_staff: z.string().trim().min(2).max(100),
  remarks: z.string().trim().max(300).optional()
}).strict();

// Schema 5: IDOR Defense Guard
export interface AuthenticatedUser {
  id: string; // e.g. "COORDINATOR_1" or "STUDENT_1"
  role: 'COORDINATOR' | 'STUDENT';
  studentId?: number; // Primary key in students table if student
}
