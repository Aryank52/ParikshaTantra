import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';

interface ConnectedClient {
  socket: WebSocket;
  isAuthenticated?: boolean;
  userId?: string;
  role?: string;
  organizationId?: string;
  centreId?: string;
  candidateId?: string;
  deviceId?: string;
}

export class WebSocketService {
  private static wss: WebSocketServer | null = null;
  private static clients: Set<ConnectedClient> = new Set();

  static initialize(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (socket: WebSocket) => {
      const clientRecord: ConnectedClient = { socket, isAuthenticated: false };
      this.clients.add(clientRecord);

      socket.send(JSON.stringify({
        type: 'SYSTEM_NOTICE',
        message: 'Connected to ParikshaTantra Real-Time Security WebSocket Server.',
        timestamp: new Date().toISOString(),
      }));

      socket.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'IDENTIFY') {
            if (parsed.token) {
              try {
                const decoded = jwt.verify(parsed.token, CONFIG.JWT_SECRET) as any;
                clientRecord.isAuthenticated = true;
                clientRecord.userId = decoded.userId;
                clientRecord.role = decoded.role;
                clientRecord.organizationId = decoded.organizationId;
                clientRecord.centreId = parsed.centreId;
                clientRecord.candidateId = parsed.candidateId;
                clientRecord.deviceId = parsed.deviceId;
                socket.send(JSON.stringify({
                  type: 'IDENTIFY_ACK',
                  status: 'AUTHENTICATED',
                  role: decoded.role,
                  userId: decoded.userId,
                }));
              } catch (authErr) {
                socket.send(JSON.stringify({
                  type: 'AUTH_ERROR',
                  message: 'Invalid or expired WebSocket authentication token.',
                }));
              }
            } else if (parsed.role) {
              clientRecord.role = parsed.role;
              clientRecord.centreId = parsed.centreId;
              clientRecord.candidateId = parsed.candidateId;
              clientRecord.deviceId = parsed.deviceId;
              socket.send(JSON.stringify({
                type: 'IDENTIFY_ACK',
                status: 'REGISTERED',
                role: parsed.role,
              }));
            }
          }
        } catch (err) {
          // ignore invalid json
        }
      });

      socket.on('close', () => {
        this.clients.delete(clientRecord);
      });
    });
  }

  /**
   * Broadcasts an event to all or specific client types.
   */
  static broadcast(event: {
    type: 'EXAM_RELEASED' | 'EXAM_PAUSED' | 'EXAM_RESUMED' | 'EXAM_FROZEN' | 'SECURITY_ALERT' | 'SYSTEM_NOTICE' | 'DEVICE_BLOCKED' | 'EXAM_STATE_CHANGED';

    payload: any;
    targetCentreId?: string;
    targetCandidateId?: string;
  }) {
    const payloadStr = JSON.stringify(event);

    for (const client of this.clients) {
      if (client.socket.readyState === WebSocket.OPEN) {
        // Target filtering if specified
        if (event.targetCentreId && client.centreId && client.centreId !== event.targetCentreId) {
          continue;
        }
        if (event.targetCandidateId && client.candidateId && client.candidateId !== event.targetCandidateId) {
          continue;
        }
        client.socket.send(payloadStr);
      }
    }
  }
}
