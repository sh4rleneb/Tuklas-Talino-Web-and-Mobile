import { AuditLog } from '../models/index.js';

export async function audit(actorUserId, action, entityType = null, entityId = null, metadata = {}) {
  try {
    await AuditLog.create({ actorUserId, action, entityType, entityId, metadata });
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
}
