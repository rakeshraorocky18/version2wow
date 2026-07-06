import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/planner',
})
export class PlannerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(`planner_${userId}`);
    }
  }

  handleDisconnect(_client: Socket) {
    /* rooms cleaned up automatically */
  }

  emitPlannerUpdate(userId: string, event: string, data: unknown) {
    this.server.to(`planner_${userId}`).emit(event, data);
  }

  emitTaskUpdate(userId: string, data: unknown) {
    this.emitPlannerUpdate(userId, 'taskUpdate', data);
  }

  emitRsvpUpdate(userId: string, data: unknown) {
    this.emitPlannerUpdate(userId, 'rsvpUpdate', data);
  }

  emitBudgetUpdate(userId: string, data: unknown) {
    this.emitPlannerUpdate(userId, 'budgetUpdate', data);
  }

  emitActivityUpdate(userId: string, data: unknown) {
    this.emitPlannerUpdate(userId, 'activityUpdate', data);
  }
}
