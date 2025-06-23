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
  private comm_client: WebSocket;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly jwtService: JwtService,
  ) { }

  onModuleInit() {
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();

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
          this.logger.log(`Client authenticated: ${user.id}`);
        } catch (err) {
          this.logger.error('Client connection rejected: Invalid token');
          client.close(4001, 'Invalid token')
          return;
        }
      }

      client.on('message', (data) => {
        const message = data.toString();
        this.logger.log(`Received from client: ${message}`);

        if (this.comm_client?.readyState === WebSocket.OPEN) {
          this.comm_client.send(message);
        } else {
          this.logger.warn('Communication websocket not connected');
        }
      });

      client.on('close', () => {
        this.logger.log('Client disconnected');
      });

      this.connect(user);
    });
  }

  // connect to communication websocket
  connect(user: User) {
    const comm_ws_addr = this.configService.get<string>("COMMUNICATION_WS_ADDR") || "ws://127.0.0.1:3005/ws";
    // put user id in header
    this.comm_client = new WebSocket(comm_ws_addr, {
      headers: {
        "X-user-id": user.id
      }
    });

    this.comm_client.on("open", () => {
      this.logger.log('Connected to Communication WebSocket server');
    });

    // handle received messages
    this.comm_client.on("message", (data: Buffer) => {
      // received messages from communication service
      const message = data.toString();
      this.logger.log("Received: ", message);

      // send communication's message to clients
      this.server.clients.forEach((client) => {
        if (client.readyState == client.OPEN) {
          client.send(message);
        }
      });
    });

    // handle errors
    this.comm_client.on("error", (error) => {
      this.logger.error(`Communication websocket error: ${error.message}`,);
    });

    this.comm_client.on("close", () => {
      this.logger.warn('Disconnected from Communication webSocket server');
      // Close all client connections
      this.server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close(1011, 'Communication backend disconnected'); // 1011 = internal error
        }
      });
    });
  }
}
