# Microservices GRPC Development Guide
This guide will help you set up and develop the gRPC server service and client service in Rust and Node.js (NestJS).

---
## Project Structure
```
farmera-microservices/
├── docs/         # Documentation files
├── services/     # Microservices source code
├── shared/       # Shared protobuf and generated code
├── tools/
    └── setup.sh  # Setup script for generating proto code
```

## Prerequisites

Ensure the following tools are installed:

- **buf**: For linting, validating, and generating gRPC code. Install it from [buf.build/docs/installation](https://buf.build/docs/installation).
- **protoc**: Protocol Buffers compiler. Install it from [protobuf.dev/installation](https://protobuf.dev/installation/).
- **Node.js**: Required for TypeScript/JavaScript services. Install from [nodejs.org](https://nodejs.org/).
- **Rust**: Require

## Setup Instructions

Run the setup script:
```bash
cd tools
./setup.sh
```

This will generate gRPC code from `.proto` files for both Rust and Node.js:

- Rust output: `./shared/generated/rust`

- Node.js/TypeScript output: `./shared/generated/nodejs`

> These generated directories include `Cargo.toml`, `package.json`, and `tsconfig.json`, making them usable as libraries.

***Important:*** Don't forget to install required dependencies when consuming these libraries. See the full setup guide here: [Setup Documentation](../tools/README.md)


## Using gRPC with Node.js / NestJS

### Server 

#### 1. Server setup
```TypeScript
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'your.package.name',
      protoPath: join(__dirname, '../shared/grpc-protos/service/service.proto'),
      url: '0.0.0.0:50051',
    },
  });

  await app.listen();
}
bootstrap();

```

#### 2. Implementing a gRPC Controller
The generated gRPC code provides TypeScript interfaces and decorators. To implement a controller:

- Add the auto-generated decorator to your controller:

```TypeScript
@YourServiceControllerMethods()
```

- Implement the interface provided:

```TypeScript
@Controller()
@YourServiceControllerMethods()
export class YourController implements YourServiceController {
  async yourMethod(request: YourRequestType): Promise<YourResponseType> {
    // Your logic here (e.g., validate, access DB)
    return {
      // Response data
    };
  }
}

```
Example:
```TypeScript
@Controller()
@CommunicationServiceControllerMethods()
export class CommunicationController implements CommunicationServiceController {
  async createConversation(request: CreateConversationRequest): Promise<CreateConversationResponse> {
    if (!request.title) {
      throw new RpcException('Title is required');
    }

    return {
      conversationId: 123,
      title: request.title,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
    };
  }
```
**Notes:**

- Generated proto clients are fully typed and auto-annotated.

- Setup is shared and unified across Rust and Node.js.

### Client

#### 1. Register the gRPC Client

Use `ClientsModule.registerAsync()` in your module to register the gRPC client dynamically using configuration.

```TypeScript
@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'YOUR_PACKAGE_NAME',
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'your.package.namespace',
            protoPath: join(__dirname, '../shared/grpc-protos/service/service.proto'),
            url: configService.get<string>('GRPC_TARGET_URL', 'localhost:50051'),
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
              includeDirs: [join(__dirname, '../shared/grpc-protos')],
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
})
export class YourModule {}
```
This allows dynamic endpoint config and support for shared .proto imports.

#### 2. Inject the gRPC Client into a Service

Bind the gRPC service client once the module is initialized:
```TypeScript
import { YourGrpcServiceClient } from '@farmera/grpc-proto/dist/service/service';


@Injectable()
export class YourService implements OnModuleInit {
  private grpcService: YourGrpcServiceClient;

  constructor(@Inject('YOUR_PACKAGE_NAME') private client: ClientGrpc) {}

  onModuleInit() {
    this.grpcService = this.client.getService<YourGrpcServiceClient>('YourServiceName');
  }

  async callGrpcMethod(payload: YourRequestType): Promise<YourResponseType> {
    return firstValueFrom(this.grpcService.yourMethod(payload));
  }
}
```

**Notes on Type & Import Management**

- All gRPC service interfaces and message classes are generated from .proto files.

- If names clash with local code, alias them:
```TypeScript
import { YourService as GrpcYourService } from '@farmera/grpc-proto/dist/service/service';

```

### Understanding the gRPC Interfaces

**Server Interface**

This defines all RPC endpoints the server implements:

```TypeScript
export interface YourServiceController {
  yourMethod(request: YourRequestType):
    | Promise<YourResponseType>
    | Observable<YourResponseType>
    | YourResponseType;
}
```

Methods are decorated automatically using:
```TypeScript
@YourServiceControllerMethods()
export class YourController implements YourServiceController { ... }
```

**Client Interface**
This is used by the client to call gRPC methods:
```TypeScript
export interface YourServiceClient {
  yourMethod(request: YourRequestType): Observable<YourResponseType>;
}
```
### What the Generated Code Includes
From .proto, the code generator provides:

- Typed message classes (e.g. YourRequest, YourResponse)

- gRPC service interfaces (Controller, Client)

- Decorators for automatic method binding

These allow full type safety, autocompletion, and clean separation between transport layer and business logic.

## Using gRPC with Rust
Will be updated later