import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface SocketIdentity {
  socketId: string;
  tenantId?: string;
  userId?: string;
}

@WebSocketGateway({
  namespace: 'events',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly identities = new Map<string, SocketIdentity>();

  handleConnection(client: Socket): void {
    this.identities.set(client.id, { socketId: client.id });
    this.logger.log(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.identities.delete(client.id);
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('auth:join-tenant')
  joinTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { tenantId: string; userId: string },
  ) {
    if (!body?.tenantId) {
      return { success: false, message: 'tenantId is required' };
    }

    client.join(`tenant:${body.tenantId}`);
    this.identities.set(client.id, {
      socketId: client.id,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    return { success: true };
  }

  emitTenant(tenantId: string, event: string, data: unknown): void {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  emitSystem(event: string, data: unknown): void {
    this.server.emit(event, data);
  }
}
