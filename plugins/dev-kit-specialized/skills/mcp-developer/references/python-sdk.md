# Python SDK Implementation

## Installation

```bash
pip install mcp pydantic
```

## Basic Server Setup

`FastMCP` (`mcp.server.fastmcp`) is the recommended high-level API — it derives
tool/resource/prompt schemas from type hints and docstrings instead of requiring
manual schema wiring.

```python
from mcp.server.fastmcp import FastMCP
from pydantic import Field
from typing import Literal

# Create server instance
mcp = FastMCP("example-server")

# Register a tool — schema is inferred from the type hints
@mcp.tool()
async def get_weather(
    location: str = Field(..., description="City name or zip code"),
    units: Literal["celsius", "fahrenheit"] = "celsius",
) -> str:
    """Get current weather for a location."""
    weather_data = await fetch_weather(location, units)
    unit_symbol = "C" if units == "celsius" else "F"
    return f"Weather in {location}: {weather_data['temp']}°{unit_symbol}"

# Run server (defaults to stdio transport)
if __name__ == "__main__":
    mcp.run()
```

## Resource Provider

```python
import json

@mcp.resource("file:///config/settings.json")
async def app_settings() -> str:
    """Current application configuration."""
    settings = await load_settings()
    return json.dumps(settings, indent=2)

# Dynamic resource with a URI template
@mcp.resource("db://users/{table}/schema")
async def database_schema(table: str) -> str:
    """Database schema for a given table."""
    return await get_database_schema(table)
```

## Prompt Templates

```python
@mcp.prompt()
def code_review(language: str, code: str) -> str:
    """Generate code review comments."""
    return f"Review this {language} code and provide feedback:\n\n{code}"
```

## Input Validation with Pydantic

FastMCP validates tool arguments against the function's type hints automatically.
For validation rules beyond a plain type (patterns, ranges, custom checks),
declare a Pydantic model and accept it as the tool's argument:

```python
from pydantic import BaseModel, Field, field_validator

class DatabaseQueryArgs(BaseModel):
    table: str = Field(..., pattern="^[a-zA-Z_][a-zA-Z0-9_]*$")
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)

    @field_validator("table")
    @classmethod
    def validate_table(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Table name cannot be empty")
        return v.strip()

@mcp.tool()
async def query_database(args: DatabaseQueryArgs) -> str:
    """Query a database table with pagination."""
    results = await execute_query(args.table, args.limit, args.offset)
    return json.dumps(results)
```

## Error Handling

```python
from mcp.shared.exceptions import McpError
from mcp.types import ErrorData, INTERNAL_ERROR, INVALID_PARAMS

@mcp.tool()
async def get_weather_safe(location: str, units: str = "celsius") -> str:
    """Get current weather, with explicit error handling."""
    try:
        if not location:
            raise ValueError("location parameter is required")

        result = await fetch_weather(location, units)
        return str(result)

    except ValueError as e:
        # Validation or bad input
        raise McpError(ErrorData(code=INVALID_PARAMS, message=str(e)))

    except Exception as e:
        # Unexpected errors
        raise McpError(ErrorData(code=INTERNAL_ERROR, message=f"Tool execution failed: {e}"))
```

## Logging

```python
import logging
import sys

# Configure logging to stderr (stdout is used for protocol)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stderr,
)

logger = logging.getLogger("mcp-server")

@mcp.tool()
async def logged_tool(name: str, arguments: dict) -> str:
    """Example tool that logs its own execution."""
    logger.info(f"Tool called: {name} with args: {arguments}")

    try:
        result = await execute_tool(name, arguments)
        logger.info(f"Tool {name} completed successfully")
        return str(result)
    except Exception as e:
        logger.error(f"Tool {name} failed: {e}", exc_info=True)
        raise
```

## Context, Progress, and Cleanup

FastMCP tools can accept a `Context` parameter to access the session — for
logging, progress reporting, LLM sampling, or reading other resources — without
any extra wiring:

```python
from mcp.server.fastmcp import Context
from contextlib import asynccontextmanager

@asynccontextmanager
async def database_connection():
    """Manage database connection lifecycle."""
    db = await connect_to_database()
    try:
        yield db
    finally:
        await db.close()

@mcp.tool()
async def query_database(query: str, ctx: Context) -> str:
    """Run a query against the database, reporting progress to the client."""
    async with database_connection() as db:
        await ctx.report_progress(progress=0, total=1)
        result = await db.execute(query)
        await ctx.report_progress(progress=1, total=1)
        return str(result)
```

## Basic Client Setup

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run_client():
    server_params = StdioServerParameters(
        command="python",
        args=["server.py"],
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize connection
            await session.initialize()

            # List available tools
            tools = await session.list_tools()
            print(f"Available tools: {[t.name for t in tools.tools]}")

            # Call a tool
            result = await session.call_tool(
                "get_weather",
                arguments={"location": "San Francisco"},
            )
            print(f"Result: {result.content}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_client())
```

## Notifications

```python
@mcp.tool()
async def update_config(config: dict, ctx: Context) -> str:
    """Update configuration and notify clients that a resource changed."""
    await save_config(config)

    # Notify clients of resource update
    await ctx.session.send_resource_updated(
        uri="file:///config/settings.json"
    )

    return "Configuration updated"
```

## When to Use the Low-Level `Server` Class

`FastMCP` covers the vast majority of servers. Drop to the low-level `mcp.server.Server`
class (with `@app.list_tools()`/`@app.call_tool()` handlers and `app.run(...)`
against raw streams) only when you need full control over the request/response
cycle or initialization options that `FastMCP` doesn't expose.

## Best Practices

1. **Type Safety**: Use type hints (and Pydantic models where extra validation is needed)
2. **Async/Await**: All handlers must be async
3. **Validation**: Validate inputs early
4. **Logging**: Log to stderr, never stdout
5. **Error Handling**: Wrap errors in McpError
6. **Resource Cleanup**: Use context managers
7. **Testing**: Use pytest-asyncio for async tests
8. **Performance**: Cache expensive operations
9. **Security**: Sanitize all inputs and outputs
10. **Documentation**: Include docstrings and type hints
