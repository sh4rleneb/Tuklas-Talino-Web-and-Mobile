import { Op } from 'sequelize';
import { AuditLog } from '../models/index.js';

const AUDIT_RETENTION_DAYS = 30;
const AUDIT_MAX_RECORDS = 5000;

let lastCleanup = 0;

async function cleanupAuditLogs() {

  const now = Date.now();

  if (now - lastCleanup < 60 * 60 * 1000) {
    return;
  }

  lastCleanup = now;

  try {
    const cutoff = new Date(
      Date.now() -
      AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000
    );

    await AuditLog.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoff,
        },
      },
    });

    const total = await AuditLog.count();

    if (total > AUDIT_MAX_RECORDS) {
      const excess = total - AUDIT_MAX_RECORDS;

      const oldestLogs = await AuditLog.findAll({
        attributes: ['id'],
        order: [['createdAt', 'ASC']],
        limit: excess,
      });

      if (oldestLogs.length) {
        await AuditLog.destroy({
          where: {
            id: oldestLogs.map((log) => log.id),
          },
        });
      }
    }
  } catch (error) {
    console.error(
      'Audit cleanup failed:',
      error.message
    );
  }
}


export async function audit(
  actorUserId,
  action,
  entityType = null,
  entityId = null,
  metadata = {}
) {
  try {
    await AuditLog.create({
      actorUserId,
      action,
      entityType,
      entityId,
      metadata,
    });

    await cleanupAuditLogs();

  } catch (error) {
    console.error(
      'Audit logging failed:',
      error.message
    );
  }
}
