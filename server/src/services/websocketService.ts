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
  lastPing?: number;
  connectedAt: number;
}

type WSEventType =
  | 'EXAM_RELEASED'
  | 'EXAM_PAUSED'
  | 'EXAM_RESUMED'
  | 'EXAM_FROZEN'
  | 'SECURITY_ALERT'
  | 'SYSTEM_NOTICE'
  | 'DEVICE_BLOCKED'
  | 'EXAM_STATE_CHANGED'
  | 'CLIENT_JOINED'
  | 'CLIENT_LEFT';

interface WSEvent {
  type: WSEventType;
  payload: any;
  targetCentreId?: string;
  targetCandidateId?: string;
}

export class WebSocketService {
  private static wss: WebSocketServer | null = null;
  private static clients: Map<string, ConnectedClient> = new Map();
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  private static readonly HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
  private static readonly STALE_THRESHOLD_MS = 120000; // 2 minutes

  static initialize(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (socket: WebSocket, req) => {
      const clientId = this.generateClientId();
      const clientRecord: ConnectedClient = {
        socket,
        isAuthenticated: false,
        lastPing: Date.now(),
        connectedAt: Date.now(),
      };
      this.clients.set(clientId, clientRecord);

      // Send welcome message
      socket.send(JSON.stringify({
        type: 'SYSTEM_NOTICE',
        message: 'Connected to ParikshaTantra Real-Time Security WebSocket Server.',
        timestamp: new Date().toISOString(),
        clientId,
      }));

      // Handle incoming messages
      socket.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          this.handleMessage(clientId, parsed);
        } catch (err) {
          // Ignore invalid JSON
        }
      });

      // Handle pong responses
      socket.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
        }
      });

      // Handle close
      socket.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Handle errors
      socket.on('error', (err) => {
        console.error(`WebSocket error for client ${clientId}:`, err);
        this.handleDisconnect(clientId);
      });
    });

    // Start heartbeat interval
    this.startHeartbeat();
  }

  private static generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private static handleMessage(clientId: string, parsed: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (parsed.type === 'IDENTIFY') {
      if (parsed.token) {
        try {
          const decoded = jwt.verify(parsed.token, CONFIG.JWT_SECRET) as any;
          client.isAuthenticated = true;
          client.userId = decoded.userId;
          client.role = decoded.role;
          client.organizationId = decoded.organizationId;
          client.centreId = parsed.centreId;
          client.candidateId = parsed.candidateId;
          client.deviceId = parsed.deviceId;

          client.socket.send(JSON.stringify({
            type: 'IDENTIFY_ACK',
            status: 'AUTHENTICATED',
            role: decoded.role,
            userId: decoded.userId,
            clientId,
          }));

          // Broadcast join event
          this.broadcastPresence('CLIENT_JOINED', {
            clientId,
            userId: decoded.userId,
            role: decoded.role,
            centreId: parsed.centreId,
            candidateId: parsed.candidateId,
            deviceId: parsed.deviceId,
          });
        } catch (authErr) {
          client.socket.send(JSON.stringify({
            type: 'AUTH_ERROR',
            message: 'Invalid or expired WebSocket authentication token.',
          }));
        }
      } else if (parsed.role) {
        client.role = parsed.role;
        client.centreId = parsed.centreId;
        client.candidateId = parsed.candidateId;
        client.deviceId = parsed.deviceId;

        client.socket.send(JSON.stringify({
          type: 'IDENTIFY_ACK',
          status: 'REGISTERED',
          role: parsed.role,
          clientId,
        }));

        this.broadcastPresence('CLIENT_JOINED', {
          clientId,
          role: parsed.role,
          centreId: parsed.centreId,
          candidateId: parsed.candidateId,
          deviceId: parsed.deviceId,
        });
      } else if (parsed.type === 'PING') {
        // Client-initiated ping
        client.socket.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    }
  }

  private static handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      this.broadcastPresence('CLIENT_LEFT', {
        clientId,
        userId: client.userId,
        role: client.role,
        centreId: client.centreId,
        candidateId: client.candidateId,
        deviceId: client.deviceId,
      });
      this.clients.delete(clientId);
    }
  }

  private static startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleClients: string[] = [];

      for (const [clientId, client] of this.clients.entries()) {
        if (client.socket.readyState !== WebSocket.OPEN) {
          staleClients.push(clientId);
          continue;
        }

        // Check if client is stale (no pong received within threshold)
        if (client.lastPing && now - client.lastPing > this.STALE_THRESHOLD_MS) {
          console.log(`Closing stale WebSocket connection: ${clientId}`);
          client.socket.close(1001, 'Stale connection - no pong received');
          staleClients.push(clientId);
          continue;
        }

        // Send ping
        try {
          client.socket.ping();
        } catch (err) {
          console.error(`Failed to ping client ${clientId}:`, err);
          staleClients.push(clientId);
        }
      }

      // Clean up stale clients
      for (const clientId of staleClients) {
        this.handleDisconnect(clientId);
      }
    }, this.HEARTBEAT_INTERVAL_MS);
  }

  private static broadcastPresence(eventType: 'CLIENT_JOINED' | 'CLIENT_LEFT', payload: any) {
    const event: WSEvent = {
      type: eventType,
      payload,
    };
    const payloadStr = JSON.stringify(event);

    for (const client of this.clients.values()) {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(payloadStr);
      }
    }
  }

  /**
   * Broadcasts an event to all or specific client types.
   */
  static broadcast(event: {
    type: WSEventType;
    payload: any;
    targetCentreId?: string;
    targetCandidateId?: string;
  }) {
    const payloadStr = JSON.stringify(event);

    for (const client of this.clients.values()) {
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

  /**
   * Get current connection statistics
   */
  static getStats(): { total: number; authenticated: number; byRole: Record<string, number> } {
    let authenticated = 0;
    const byRole: Record<string, number> = {};

    for (const client of this.clients.values()) {
      if (client.isAuthenticated) authenticated++;
      if (client.role) {
        byRole[client.role] = (byRole[client.role] || 0) + 1;
      }
    }

    return {
      total: this.clients.size,
      authenticated,
      byRole,
    };
  }

  /**
   * Graceful shutdown
   */
  static shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const client of this.clients.values()) {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.close(1001, 'Server shutting down');
      }
    }
    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}