import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebSocket, WebSocketServer } from 'ws';
import { HttpAdapterHost } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IncomingMessage } from 'http';
import { User } from 'src/common/interfaces/user.interface';

@Injectable()
export class CommunicationGateway implements OnModuleInit {

  private server: WebSocketServer;
  private readonly logger: Logger = new Logger("Websocket Gateway");
  private userConnections: Map<string, { comm_client: WebSocket }>;
  private clientUser: Map<WebSocket, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly jwtService: JwtService,
  ) { }

  onModuleInit() {
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();

    this.userConnections = new Map();
    this.clientUser = new Map();

    this.server = new WebSocketServer({ server: httpServer });

    this.logger.log(`WebSocket server started`);

    this.server.on("connection", (client: WebSocket, request: IncomingMessage) => {
      // parse token in query
      const url = new URL(request.url ?? "", `http://${request.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        this.logger.error('Client connection rejected: No token provided');
        client.close(4001, 'Authentication token required');
        return;
      }

      let user: User = null;

      if (token) {
        try {
          user = this.jwtService.verify(token);
          this.clientUser.set(client, user.id);
          this.logger.log(`Client authenticated: ${user.id}`);
        } catch (err) {
          this.logger.error('Client connection rejected: Invalid token', err);
          client.close(4001, 'Invalid token')
          return;
        }
      }

      client.on('message', (data) => {
        console.log(user.id);
        const message = data.toString();
        this.logger.debug(`Received from client: ${message}`);

        if (this.userConnections.get(user.id).comm_client?.readyState === WebSocket.OPEN) {
          this.userConnections.get(user.id).comm_client.send(message);
        } else {
          this.logger.debug('Communication websocket not connected');
        }
      });

      client.on('close', () => {
        this.disconnectUser(user.id);
        this.clientUser.delete(client);
        this.logger.debug(`Client ${user.id} disconnected`);
      });

      this.connect(user);
    });
  }

  // connect to communication websocket
  connect(user: User) {
    const comm_ws_addr = this.configService.get<string>("COMMUNICATION_WS_ADDR") || "ws://127.0.0.1:3005/ws";
    // put user id in header
    let comm_client = new WebSocket(comm_ws_addr, {
      headers: {
        "X-user-id": user.id
      }
    });

    this.userConnections.set(user.id, { comm_client: comm_client });

    comm_client.on("open", () => {
      this.logger.debug('Connected to Communication WebSocket server');
    });

    // handle received messages
    comm_client.on("message", (data: Buffer) => {
      // received messages from communication service
      const message = data.toString();
      this.logger.debug("Received: ", message);

      this.server.clients.forEach((client) => {
        if (this.clientUser.get(client) === user.id && client.readyState == client.OPEN) {
          client.send(message);
        }
      });
    });

    // handle errors
    comm_client.on("error", (error) => {
      this.logger.error(`Communication websocket error: ${error.message}`,);
    });

    comm_client.on("close", () => {
      this.logger.warn('Disconnected from Communication webSocket server');
      // Close all client connections
      this.server.clients.forEach((client) => {
        if (this.clientUser.get(client) === user.id && client.readyState === WebSocket.OPEN) {
          client.close(1011, 'Communication backend disconnected'); // 1011 = internal error
        }
      });
    });
  }

  private disconnectUser(userId: string) {
    const connection = this.userConnections.get(userId);
    if (connection) {
      // Close the comm_client if open
      if (connection.comm_client.readyState === WebSocket.OPEN) {
        connection.comm_client.close(1000, 'User disconnected');
      }
      // Remove from map
      this.userConnections.delete(userId);
      this.logger.debug(`Cleaned up connections for user ${userId}`);
    }
  }
}
