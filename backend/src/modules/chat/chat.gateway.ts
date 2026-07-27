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
import { ChatServiceMongodb } from './chat.service.mongodb';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  constructor(private readonly chatService: ChatServiceMongodb) {}

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
    @MessageBody() data: { receiverId: string; content: string; type?: string; mediaUrl?: string },
  ) {
    const senderId = client.handshake.query.userId as string;

    try {
      const message = await this.chatService.sendMessage(senderId, {
        receiverId: data.receiverId,
        content: data.content,
        type: data.type,
        mediaUrl: data.mediaUrl,
      });

      this.server.to(`user_${data.receiverId}`).emit('newMessage', message);
      this.server.to(`user_${message.senderId}`).emit('newMessage', message);
      return message;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to send message';
      return { error: msg };
    }
  }

  notifyNewMessage(message: Record<string, unknown>) {
    this.server.to(`user_${message.senderId as string}`).emit('newMessage', message);
    this.server.to(`user_${message.receiverId as string}`).emit('newMessage', message);
  }

  notifyMessageDeleted(
    messageId: string,
    senderId: string,
    receiverId: string,
    mode: 'me' | 'everyone',
    requesterId: string,
  ) {
    if (mode === 'me') {
      this.server.to(`user_${requesterId}`).emit('messageDeleted', {
        messageId,
        senderId,
        receiverId,
      });
      return;
    }

    this.server.to(`user_${senderId}`).emit('messageDeleted', {
      messageId,
      senderId,
      receiverId,
    });
    this.server.to(`user_${receiverId}`).emit('messageDeleted', {
      messageId,
      senderId,
      receiverId,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string },
  ) {
    const senderId = client.handshake.query.userId as string;
    this.server.to(`user_${data.receiverId}`).emit('userTyping', { userId: senderId });
  }

  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; callType: 'audio' | 'video'; callId: string },
  ) {
    const callerId = client.handshake.query.userId as string;
    try {
      await this.chatService.canInitiateCall(callerId, data.receiverId, data.callType);
      this.server.to(`user_${data.receiverId}`).emit('call:incoming', {
        callId: data.callId,
        callerId,
        callType: data.callType,
      });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Call not allowed';
      return { error: msg };
    }
  }

  @SubscribeMessage('call:accept')
  handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; callerId: string },
  ) {
    this.server.to(`user_${data.callerId}`).emit('call:accepted', {
      callId: data.callId,
      accepterId: client.handshake.query.userId,
    });
  }

  @SubscribeMessage('call:reject')
  handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; callerId: string },
  ) {
    this.server.to(`user_${data.callerId}`).emit('call:rejected', { callId: data.callId });
  }

  @SubscribeMessage('call:end')
  handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; peerId: string },
  ) {
    this.server.to(`user_${data.peerId}`).emit('call:ended', { callId: data.callId });
  }

  @SubscribeMessage('call:offer')
  handleCallOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; peerId: string; sdp: unknown },
  ) {
    this.server.to(`user_${data.peerId}`).emit('call:offer', {
      callId: data.callId,
      sdp: data.sdp,
      from: client.handshake.query.userId,
    });
  }

  @SubscribeMessage('call:answer')
  handleCallAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; peerId: string; sdp: unknown },
  ) {
    this.server.to(`user_${data.peerId}`).emit('call:answer', {
      callId: data.callId,
      sdp: data.sdp,
      from: client.handshake.query.userId,
    });
  }

  @SubscribeMessage('call:ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; peerId: string; candidate: unknown },
  ) {
    this.server.to(`user_${data.peerId}`).emit('call:ice-candidate', {
      callId: data.callId,
      candidate: data.candidate,
      from: client.handshake.query.userId,
    });
  }
}
