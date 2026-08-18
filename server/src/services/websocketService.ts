import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

interface ConnectedClient {
  socket: WebSocket;
  role?: string;
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
      const clientRecord: ConnectedClient = { socket };
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
