# gRPC and Microservices

## Service Definition (Protocol Buffers)

```protobuf
// api/proto/user/v1/user.proto
syntax = "proto3";

package user.v1;

option go_package = "github.com/user/myproject/gen/user/v1;userv1";

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc ListUsers(ListUsersRequest) returns (stream User);
}

message User {
  string id = 1;
  string email = 2;
}

message GetUserRequest {
  string id = 1;
}

message GetUserResponse {
  User user = 1;
}

message ListUsersRequest {
  int32 page_size = 1;
}
```

```bash
# Generate Go code (requires protoc + plugins on PATH)
# go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
# go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    api/proto/user/v1/user.proto
```

## Server Implementation

```go
package server

import (
    "context"
    "log/slog"
    "net"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/health"
    "google.golang.org/grpc/health/grpc_health_v1"
    "google.golang.org/grpc/reflection"
    "google.golang.org/grpc/status"

    userv1 "github.com/user/myproject/gen/user/v1"
)

type UserServer struct {
    userv1.UnimplementedUserServiceServer // forward compatibility
    repo UserRepository
}

func (s *UserServer) GetUser(ctx context.Context, req *userv1.GetUserRequest) (*userv1.GetUserResponse, error) {
    if req.GetId() == "" {
        return nil, status.Error(codes.InvalidArgument, "id is required")
    }

    u, err := s.repo.GetByID(ctx, req.GetId())
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            return nil, status.Errorf(codes.NotFound, "user %s not found", req.GetId())
        }
        return nil, status.Error(codes.Internal, "failed to fetch user")
    }

    return &userv1.GetUserResponse{User: &userv1.User{Id: u.ID, Email: u.Email}}, nil
}

func Run(ctx context.Context, addr string, repo UserRepository) error {
    lis, err := net.Listen("tcp", addr)
    if err != nil {
        return fmt.Errorf("listen %s: %w", addr, err)
    }

    grpcServer := grpc.NewServer(
        grpc.ChainUnaryInterceptor(loggingInterceptor, recoveryInterceptor),
    )
    userv1.RegisterUserServiceServer(grpcServer, &UserServer{repo: repo})

    // Health checks (for k8s readiness/liveness probes and LB health)
    healthSrv := health.NewServer()
    healthSrv.SetServingStatus("", grpc_health_v1.HealthCheckResponse_SERVING)
    grpc_health_v1.RegisterHealthServer(grpcServer, healthSrv)

    reflection.Register(grpcServer) // enables grpcurl/evans introspection

    go func() {
        <-ctx.Done()
        grpcServer.GracefulStop()
    }()

    slog.Info("grpc server listening", "addr", addr)
    return grpcServer.Serve(lis)
}
```

## Client with Timeout and Retry

```go
import (
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
)

func NewClient(addr string) (userv1.UserServiceClient, func() error, error) {
    conn, err := grpc.NewClient(addr,
        grpc.WithTransportCredentials(insecure.NewCredentials()), // use TLS creds in production
        grpc.WithChainUnaryInterceptor(clientLoggingInterceptor),
    )
    if err != nil {
        return nil, nil, fmt.Errorf("dial %s: %w", addr, err)
    }
    return userv1.NewUserServiceClient(conn), conn.Close, nil
}

func fetchUser(ctx context.Context, client userv1.UserServiceClient, id string) (*userv1.User, error) {
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()

    resp, err := client.GetUser(ctx, &userv1.GetUserRequest{Id: id})
    if err != nil {
        if st, ok := status.FromError(err); ok && st.Code() == codes.NotFound {
            return nil, ErrNotFound
        }
        return nil, fmt.Errorf("get user: %w", err)
    }
    return resp.GetUser(), nil
}
```

## Unary Interceptors (Logging, Recovery, Auth)

```go
func loggingInterceptor(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
    start := time.Now()
    resp, err := handler(ctx, req)
    slog.Info("grpc call", "method", info.FullMethod, "duration", time.Since(start), "err", err)
    return resp, err
}

func recoveryInterceptor(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = status.Errorf(codes.Internal, "panic: %v", r)
        }
    }()
    return handler(ctx, req)
}
```

## Microservices Patterns

- **Service boundaries**: one gRPC service per bounded context; keep `.proto` files versioned (`user/v1`, `user/v2`) so breaking changes ship as a new package rather than mutating a live contract.
- **Service discovery**: resolve peers via DNS SRV records or a client-side resolver (`grpc.WithResolvers`) backed by Kubernetes Service DNS or Consul; avoid hardcoded addresses.
- **Resilience**: pair timeouts (`context.WithTimeout` per call, not just per connection) with a circuit breaker (e.g., `sony/gobreaker`) around outbound clients to avoid cascading failures under a dependent service's latency spike.
- **Observability**: propagate `context.Context` trace metadata through interceptors using OpenTelemetry's `otelgrpc` instrumentation; correlate gRPC status codes with HTTP status codes at the edge (gRPC-Gateway or a manual translation layer) if the service is also exposed over REST.
- **Deadline propagation**: forward the caller's remaining deadline to downstream calls instead of issuing a fresh timeout, so a slow leaf call fails fast under the top-level budget.

## Quick Reference

| Concern | Tool/Pattern |
|---------|--------------|
| Codegen | `protoc` + `protoc-gen-go` + `protoc-gen-go-grpc` |
| Error semantics | `status.Error(codes.X, msg)` / `status.FromError` |
| Forward compatibility | Embed `UnimplementedXServer` in service structs |
| Cross-cutting concerns | `grpc.ChainUnaryInterceptor` (logging, recovery, auth) |
| Health checks | `google.golang.org/grpc/health` + `grpc_health_v1` |
| Introspection | `google.golang.org/grpc/reflection` (pair with `grpcurl`) |
| Resilience | Per-call context deadlines + circuit breaker on clients |
| Tracing | OpenTelemetry `otelgrpc` interceptors |
