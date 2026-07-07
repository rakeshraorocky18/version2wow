import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatServiceTypeorm } from './chat.service.typeorm';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  constructor(private readonly chatService: ChatServiceTypeorm) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user_${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.delete(userId);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; content: string; type?: string },
  ) {
    const senderId = client.handshake.query.userId as string;

    const message = await this.chatService.sendMessage(senderId, {
      receiverId: data.receiverId,
      content: data.content,
      type: data.type,
    });

    // Send to receiver if online
    this.server.to(`user_${data.receiverId}`).emit('newMessage', message);

    return message;
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageIds: string[] },
  ) {
    // markAsRead not yet implemented in TypeORM service
    return { success: true };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string },
  ) {
    const senderId = client.handshake.query.userId as string;
    this.server.to(`user_${data.receiverId}`).emit('userTyping', { userId: senderId });
  }
}
