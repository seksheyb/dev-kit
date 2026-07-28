# TypeScript SDK Implementation

## Installation

```bash
npm install @modelcontextprotocol/sdk zod
```

## Basic Server Setup

The high-level `McpServer` API (not the low-level `Server` class) is the recommended
entry point — it handles capability negotiation, request routing, and schema
conversion for you.

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server instance
const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
});

// Register a tool
server.registerTool(
  "get_weather",
  {
    description: "Get current weather for a location",
    inputSchema: {
      location: z.string().min(1).describe("City name or zip code"),
      units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
    },
  },
  async ({ location, units }) => {
    // Your tool logic here
    const weatherData = await fetchWeather(location, units);

    return {
      content: [
        {
          type: "text",
          text: `Weather in ${location}: ${weatherData.temp}°${units === "celsius" ? "C" : "F"}`,
        },
      ],
    };
  }
);

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch(console.error);
```

## Resource Provider

```typescript
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

// Static resource
server.registerResource(
  "app-settings",
  "file:///config/settings.json",
  {
    name: "Application Settings",
    description: "Current application configuration",
    mimeType: "application/json",
  },
  async (uri) => {
    const settings = await loadSettings();
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(settings, null, 2),
        },
      ],
    };
  }
);

// Dynamic resource with a URI template
server.registerResource(
  "user-schema",
  new ResourceTemplate("db://users/{table}/schema", { list: undefined }),
  {
    name: "Database Schema",
    description: "Schema for a database table",
    mimeType: "text/plain",
  },
  async (uri, { table }) => {
    const schema = await getDatabaseSchema(table as string);
    return {
      contents: [{ uri: uri.href, mimeType: "text/plain", text: schema }],
    };
  }
);
```

## Prompt Templates

```typescript
server.registerPrompt(
  "code_review",
  {
    description: "Generate code review comments",
    argsSchema: {
      language: z.string().describe("Programming language"),
      code: z.string().describe("Code to review"),
    },
  },
  ({ language, code }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Review this ${language} code and provide feedback:\n\n${code}`,
        },
      },
    ],
  })
);
```

## Input Validation with Zod

`registerTool`'s `inputSchema` accepts a plain object of Zod schemas — the SDK
converts it to JSON Schema and validates incoming arguments before your handler
runs, so parsed, typed values arrive directly in the handler's destructured
argument (as in the `get_weather` example above). For validation beyond what
the schema shape expresses, refine within the handler:

```typescript
const WeatherArgsSchema = z.object({
  location: z.string().min(1),
  units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
});

server.registerTool(
  "get_weather_strict",
  {
    description: "Get current weather (with extra validation)",
    inputSchema: WeatherArgsSchema.shape,
  },
  async (args) => {
    const { location, units } = WeatherArgsSchema.parse(args);
    const weatherData = await fetchWeather(location, units);

    return {
      content: [
        {
          type: "text",
          text: `Temperature: ${weatherData.temp}°${units === "celsius" ? "C" : "F"}`,
        },
      ],
    };
  }
);
```

## Error Handling

```typescript
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

server.registerTool(
  "get_weather_safe",
  {
    description: "Get current weather with explicit error handling",
    inputSchema: { location: z.string().min(1) },
  },
  async ({ location }) => {
    try {
      if (!location) {
        throw new McpError(ErrorCode.InvalidParams, "location parameter is required");
      }

      const result = await fetchWeather(location, "celsius");
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      if (error instanceof McpError) {
        throw error; // Re-throw MCP errors
      }

      // Wrap other errors
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error.message}`
      );
    }
  }
);
```

## Basic Client Setup

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client(
  {
    name: "example-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

// Connect to server
const transport = new StdioClientTransport({
  command: "node",
  args: ["./server.js"],
});

await client.connect(transport);

// List available tools
const toolsResponse = await client.listTools();
console.log("Available tools:", toolsResponse.tools);

// Call a tool
const result = await client.callTool({
  name: "get_weather",
  arguments: { location: "San Francisco" },
});

console.log("Result:", result.content);
```

## Notifications

```typescript
// Server notifies clients that a resource changed
await server.server.notification({
  method: "notifications/resources/updated",
  params: {
    uri: "file:///config/settings.json",
  },
});

// Client handles notifications
client.setNotificationHandler(
  { method: "notifications/resources/updated" },
  (notification) => {
    console.log("Resource updated:", notification.params.uri);
  }
);
```

## When to Use the Low-Level `Server` Class

`McpServer` covers the vast majority of servers. Drop to the low-level `Server`
class (`@modelcontextprotocol/sdk/server/index.js`, with `setRequestHandler` for
schemas like `CallToolRequestSchema`/`ListToolsRequestSchema`) only when you need
full control over the request/response cycle — for example, custom capability
negotiation or protocol behavior `McpServer` doesn't expose.

## Best Practices

1. **Type Safety**: Use Zod for runtime validation
2. **Error Handling**: Always wrap errors in McpError
3. **Async/Await**: Use async/await throughout
4. **Logging**: Log to stderr, not stdout (stdio transport)
5. **Cleanup**: Handle graceful shutdown
6. **Testing**: Use unit tests with mock transports
7. **Performance**: Cache expensive operations
8. **Security**: Validate all inputs, sanitize outputs
