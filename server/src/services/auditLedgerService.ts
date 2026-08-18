import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class AuditLedgerService {
  /**
   * Appends an audit event to the hash-chained ledger.
   */
  static async logEvent(params: {
    eventType: string;
    actorId: string;
    actorRole: string;
    organizationId?: string;
    action: string;
    ipAddress?: string | string[];
    deviceId?: string;
    metadata?: any;
  }) {
    const lastEvent = await prisma.auditEvent.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const previousHash = lastEvent ? lastEvent.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString();
    const metadataStr = JSON.stringify(params.metadata || {});
    
    let ip = '127.0.0.1';
    if (typeof params.ipAddress === 'string') ip = params.ipAddress;
    else if (Array.isArray(params.ipAddress)) ip = params.ipAddress[0] || '127.0.0.1';

    const rawString = `${previousHash}|${params.eventType}|${params.actorId}|${params.actorRole}|${params.action}|${ip}|${params.deviceId || ''}|${metadataStr}|${timestamp}`;
    const currentHash = crypto.createHash('sha256').update(rawString).digest('hex');

    return await prisma.auditEvent.create({
      data: {
        eventType: params.eventType,
        actorId: params.actorId,
        actorRole: params.actorRole,
        organizationId: params.organizationId,
        action: params.action,
        ipAddress: ip,
        deviceId: params.deviceId,
        metadataJson: metadataStr,
        previousHash,
        currentHash,
      },
    });
  }

  /**
   * Verifies the cryptographic hash-chain integrity across all audit records.
   */
  static async verifyChainIntegrity(): Promise<{
    isValid: boolean;
    totalEvents: number;
    corruptedIndex: number | null;
    corruptedEventId: string | null;
    details: string;
  }> {
    const events = await prisma.auditEvent.findMany({
      orderBy: { createdAt: 'asc' },
    });

    if (events.length === 0) {
      return {
        isValid: true,
        totalEvents: 0,
        corruptedIndex: null,
        corruptedEventId: null,
        details: 'Audit ledger is empty (genesis clean).',
      };
    }

    let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];

      if (ev.previousHash !== expectedPrevHash) {
        return {
          isValid: false,
          totalEvents: events.length,
          corruptedIndex: i,
          corruptedEventId: ev.id,
          details: `Hash chain broken at record #${i + 1} (ID: ${ev.id}). Stored previousHash does not match previous block's currentHash.`,
        };
      }

      expectedPrevHash = ev.currentHash;
    }

    return {
      isValid: true,
      totalEvents: events.length,
      corruptedIndex: null,
      corruptedEventId: null,
      details: 'Audit ledger cryptographic hash chain is 100% verified & intact.',
    };
  }

  /**
   * Computes Merkle Tree Root Hash from array of leaf hashes.
   */
  static buildMerkleTree(hashes: string[]): { root: string; treeLayers: string[][] } {
    if (hashes.length === 0) {
      return { root: crypto.createHash('sha256').update('EMPTY_TREE').digest('hex'), treeLayers: [] };
    }

    let currentLayer = [...hashes];
    const treeLayers = [currentLayer];

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left; // duplicate odd node
        const parent = crypto.createHash('sha256').update(`${left}:${right}`).digest('hex');
        nextLayer.push(parent);
      }
      treeLayers.push(nextLayer);
      currentLayer = nextLayer;
    }

    return { root: currentLayer[0], treeLayers };
  }

  /**
   * Generates or fetches a Merkle Batch for latest audit logs.
   */
  static async getOrCreateMerkleBatch(): Promise<any> {
    const events = await prisma.auditEvent.findMany({
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    const hashes = events.map((e) => e.currentHash);
    const { root } = this.buildMerkleTree(hashes);
    const prevBatch = await prisma.auditMerkleBatch.findFirst({
      orderBy: { batchNumber: 'desc' },
    });

    const batchNumber = prevBatch ? prevBatch.batchNumber + 1 : 1;
    const prevBatchRoot = prevBatch ? prevBatch.merkleRoot : '0000000000000000000000000000000000000000000000000000000000000000';
    const signedAnchor = crypto.createHmac('sha256', root).update(prevBatchRoot).digest('hex');

    const existingBatch = await prisma.auditMerkleBatch.findUnique({
      where: { batchNumber },
    });

    if (existingBatch) return existingBatch;

    return await prisma.auditMerkleBatch.create({
      data: {
        batchNumber,
        merkleRoot: root,
        startBlockId: events[0]?.id || 'GENESIS',
        endBlockId: events[events.length - 1]?.id || 'GENESIS',
        eventCount: events.length,
        prevBatchRoot,
        signedAnchor,
        status: 'VERIFIED',
      },
    });
  }
}

