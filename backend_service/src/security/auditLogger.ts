import crypto from 'crypto';
import { db } from '../db/database.js';

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_entity: string;
  details: string;
  ip_address: string;
  previous_hash: string;
  current_hash: string;
}

/**
 * Appends a tamper-evident entry to the audit log using cryptographic SHA-256 hash chaining.
 * This ensures that if any row in the database is modified or deleted, the cryptographic chain breaks.
 */
export function recordAuditLog(
  actorId: string,
  actorRole: string,
  action: string,
  targetEntity: string,
  details: object,
  ipAddress: string = '127.0.0.1'
): void {
  // 1. Fetch the last hash in the chain
  const lastRow = db.prepare('SELECT current_hash FROM audit_logs ORDER BY id DESC LIMIT 1').get() as { current_hash: string } | undefined;
  const previousHash = lastRow?.current_hash || '0000000000000000000000000000000000000000000000000000000000000000'; // Genesis Hash

  const timestamp = new Date().toISOString();
  const payloadJson = JSON.stringify(details);

  // 2. Cryptographic SHA-256 calculation over all fields + previous hash
  const dataToHash = `${timestamp}|${actorId}|${actorRole}|${action}|${targetEntity}|${payloadJson}|${ipAddress}|${previousHash}`;
  const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

  // 3. Parameterized secure insert
  const stmt = db.prepare(`
    INSERT INTO audit_logs (timestamp, actor_id, actor_role, action, target_entity, details, ip_address, previous_hash, current_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(timestamp, actorId, actorRole, action, targetEntity, payloadJson, ipAddress, previousHash, currentHash);
}

/**
 * Forensic Verification Function:
 * Re-computes SHA-256 hashes sequentially from row 1 to the end to mathematically prove
 * that no logs were manipulated, inserted, or retroactively edited.
 */
export function verifyAuditLedgerIntegrity(): { isValid: boolean; checkedCount: number; brokenRowId?: number } {
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY id ASC').all() as AuditLogEntry[];
  
  let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';

  for (const row of rows) {
    if (row.previous_hash !== expectedPrevHash) {
      return { isValid: false, checkedCount: rows.length, brokenRowId: row.id };
    }

    const dataToHash = `${row.timestamp}|${row.actor_id}|${row.actor_role}|${row.action}|${row.target_entity}|${row.details}|${row.ip_address}|${row.previous_hash}`;
    const calculatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    if (calculatedHash !== row.current_hash) {
      return { isValid: false, checkedCount: rows.length, brokenRowId: row.id };
    }

    expectedPrevHash = row.current_hash;
  }

  return { isValid: true, checkedCount: rows.length };
}
