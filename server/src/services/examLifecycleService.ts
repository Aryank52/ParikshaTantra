import { PrismaClient } from '@prisma/client';
import { AuditLedgerService } from './auditLedgerService';
import { WebSocketService } from './websocketService';

const prisma = new PrismaClient();

export type ExamLifecycleState =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'RELEASE_READY'
  | 'RELEASED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'FROZEN'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface TransitionResult {
  success: boolean;
  previousState: ExamLifecycleState;
  newState: ExamLifecycleState;
  message: string;
  auditEventId?: string;
  violations?: string[];
}

export class ExamLifecycleService {
  /**
   * Validates whether a state transition is permissible under security prerequisites.
   */
  static async validateTransitionPrerequisites(
    examId: string,
    targetState: ExamLifecycleState
  ): Promise<{ valid: boolean; violations: string[] }> {
    const violations: string[] = [];
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { blueprint: true, activations: true },
    });

    if (!exam) {
      return { valid: false, violations: ['Exam record not found'] };
    }

    switch (targetState) {
      case 'APPROVED':
        if (!exam.blueprint) {
          violations.push('Exam Blueprint must be created and signed before approval.');
        }
        break;

      case 'RELEASE_READY':
        if (!exam.blueprint) {
          violations.push('Missing signed Exam Blueprint package.');
        }
        break;

      case 'RELEASED':
        if (!exam.blueprint) {
          violations.push('Cannot release exam without signed cryptographic Blueprint.');
        }
        break;

      case 'ACTIVE':
        if (exam.status !== 'RELEASED' && exam.status !== 'RELEASE_READY') {
          violations.push('Exam must be in RELEASED state before activating CBT sessions.');
        }
        if (!exam.activations || exam.activations.length === 0) {
          violations.push('No Exam Centres have verified activation tokens.');
        }
        break;

      case 'COMPLETED':
        // Can transition from ACTIVE, RUNNING, or FROZEN
        break;
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Executes an operational state transition for an exam.
   */
  static async transitionState(params: {
    examId: string;
    targetState: ExamLifecycleState;
    actorUserId: string;
    actorRole: string;
    reason?: string;
  }): Promise<TransitionResult> {
    const exam = await prisma.exam.findUnique({ where: { id: params.examId } });
    if (!exam) {
      return {
        success: false,
        previousState: 'DRAFT',
        newState: params.targetState,
        message: 'Exam not found.',
      };
    }

    const currentState = exam.status as ExamLifecycleState;

    // Validate prerequisites
    const { valid, violations } = await this.validateTransitionPrerequisites(params.examId, params.targetState);
    if (!valid) {
      return {
        success: false,
        previousState: currentState,
        newState: params.targetState,
        message: `State transition to ${params.targetState} denied due to security violations.`,
        violations,
      };
    }

    // Perform database update
    const updatedExam = await prisma.exam.update({
      where: { id: params.examId },
      data: {
        status: params.targetState,
        releasedAt: params.targetState === 'RELEASED' ? new Date() : exam.releasedAt,
      },
    });

    // Record Immutable Audit Log
    const audit = await AuditLedgerService.logEvent({
      eventType: `EXAM_LIFECYCLE_TRANSITION_${params.targetState}`,
      actorId: params.actorUserId,
      actorRole: params.actorRole,
      action: `Transitioned exam ${exam.examCode} (${exam.title}) from ${currentState} -> ${params.targetState}. Reason: ${params.reason || 'Standard operational lifecycle action'}`,
      metadata: { examId: exam.id, previousState: currentState, newState: params.targetState, reason: params.reason },
    });

    // Broadcast WebSocket Event across active SOC & Centre Control Rooms
    WebSocketService.broadcast({
      type: 'EXAM_STATE_CHANGED',
      payload: {
        examId: exam.id,
        examCode: exam.examCode,
        previousState: currentState,
        newState: params.targetState,
        updatedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      previousState: currentState,
      newState: updatedExam.status as ExamLifecycleState,
      message: `Exam status successfully transitioned to ${params.targetState}.`,
      auditEventId: audit.id,
    };
  }
}
