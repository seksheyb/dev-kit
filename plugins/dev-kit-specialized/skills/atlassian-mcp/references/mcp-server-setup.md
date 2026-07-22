# MCP Server Setup

---

## Server Options Overview

### Official Atlassian Remote MCP Server

Atlassian runs a hosted, remote MCP server (`atlassian/atlassian-mcp-server`, GA
since 2026-02-04) covering Jira, Confluence, Jira Service Management, Bitbucket
Cloud, and Compass. There is nothing to install — clients connect directly to
Atlassian's endpoint over streamable HTTP:

```
https://mcp.atlassian.com/v1/mcp/authv2   # OAuth 2.1 (interactive)
https://mcp.atlassian.com/v1/mcp          # API token (headless/service)
```

The legacy `/v1/sse` endpoint is deprecated and unsupported after 2026-06-30 —
point any client still configured for SSE at `/mcp` or `/mcp/authv2` instead.

**Capabilities:**
- Jira Cloud, Confluence Cloud, JSM, Bitbucket Cloud, and Compass — Cloud only,
  no Data Center timeline
- OAuth 2.1 authentication flow, or API tokens for headless setups
- Read/write operations for issues and pages
- JQL and CQL query support

### Open-Source Alternative for Server/Data Center

**mcp-atlassian (sooperset)** - the right choice when you need Jira/Confluence
Server or Data Center (8.14+) support, PAT auth, or a local stdio server instead
of a hosted one:
```bash
# Install with uv (recommended)
uv tool install mcp-atlassian

# Or with pip
pip install mcp-atlassian
```

### Comparison Matrix

| Feature | Official (remote) | sooperset (local) |
|---------|----------|-----------|
| Jira Cloud | Yes | Yes |
| Jira Server/DC | No | Yes |
| Confluence Cloud | Yes | Yes |
| Confluence Server/DC | No | Yes |
| Bitbucket Cloud / Compass | Yes | No |
| OAuth 2.1 | Yes | Yes |
| API Token Auth | Yes | Yes |
| PAT (Server) | No | Yes |
| Deployment | Hosted, no install | Local process (stdio) |
| Rate Limiting | Built-in | Configurable |

## Claude Desktop Configuration

### Basic Setup

Edit your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/claude/claude_desktop_config.json`

### Configuration Examples

**Official Remote Server with OAuth:**
```json
{
  "mcpServers": {
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/mcp/authv2",
      "type": "http"
    }
  }
}
```

**sooperset with API Token:**
```json
{
  "mcpServers": {
    "atlassian": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "CONFLUENCE_URL": "https://your-company.atlassian.net/wiki",
        "CONFLUENCE_USERNAME": "your-email@company.com",
        "CONFLUENCE_API_TOKEN": "your-api-token",
        "JIRA_URL": "https://your-company.atlassian.net",
        "JIRA_USERNAME": "your-email@company.com",
        "JIRA_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

**Server/Data Center with PAT:**
```json
{
  "mcpServers": {
    "atlassian": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://jira.internal.company.com",
        "JIRA_PERSONAL_TOKEN": "your-personal-access-token",
        "CONFLUENCE_URL": "https://confluence.internal.company.com",
        "CONFLUENCE_PERSONAL_TOKEN": "your-personal-access-token"
      }
    }
  }
}
```

## Environment Variables Reference

### Jira Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `JIRA_URL` | Base URL of Jira instance | Yes |
| `JIRA_USERNAME` | Email for cloud, username for server | Cloud only |
| `JIRA_API_TOKEN` | API token (cloud) | Cloud only |
| `JIRA_PERSONAL_TOKEN` | PAT (server/DC) | Server only |
| `JIRA_SSL_VERIFY` | Verify SSL certificates (default: true) | No |

### Confluence Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `CONFLUENCE_URL` | Base URL with /wiki suffix for cloud | Yes |
| `CONFLUENCE_USERNAME` | Email for cloud | Cloud only |
| `CONFLUENCE_API_TOKEN` | API token (cloud) | Cloud only |
| `CONFLUENCE_PERSONAL_TOKEN` | PAT (server/DC) | Server only |

### Advanced Options

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_LOG_LEVEL` | Logging verbosity (DEBUG, INFO, WARN, ERROR) | INFO |
| `MCP_TIMEOUT` | Request timeout in seconds | 30 |
| `MCP_MAX_RETRIES` | Maximum retry attempts | 3 |
| `MCP_RATE_LIMIT` | Requests per second | 10 |

## Verification and Testing

### Check Server Status

```bash
# Test the official remote server is reachable
curl -I https://mcp.atlassian.com/v1/mcp/authv2

# Test sooperset server
uvx mcp-atlassian --help

# Verify environment variables (sooperset / self-hosted only)
env | grep -E "(JIRA|CONFLUENCE)_"
```

### Test Connection

Create a simple test script:

```typescript
// test-connection.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testConnection() {
  const transport = new StdioClientTransport({
    command: "uvx",
    args: ["mcp-atlassian"],
    env: process.env,
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  // List available tools
  const tools = await client.listTools();
  console.log("Available tools:", tools.tools.map(t => t.name));

  // Test a simple read operation
  const result = await client.callTool({
    name: "jira_get_issue",
    arguments: { issue_key: "TEST-1" }
  });
  console.log("Test result:", result);

  await client.close();
}

testConnection().catch(console.error);
```

## When to Use Each Server

**Choose the official remote server when:**
- Using only Atlassian Cloud products
- Want zero local install/maintenance (hosted endpoint)
- Need OAuth 2.1 compliance or official support
- Building for enterprise deployment

**Choose sooperset when:**
- Need Server/Data Center support
- Want PAT authentication
- Running locally over stdio
- Need both Jira and Confluence in one self-hosted process

## Troubleshooting

### Common Issues

**"Connection refused" error:**
```bash
# Check if server is running
ps aux | grep mcp-atlassian

# Verify URL is reachable
curl -I https://your-company.atlassian.net

# Check firewall/proxy settings
echo $HTTP_PROXY $HTTPS_PROXY
```

**"Authentication failed" error:**
```bash
# Verify API token is valid (cloud)
curl -u "email@company.com:API_TOKEN" \
  "https://your-company.atlassian.net/rest/api/3/myself"

# Verify PAT is valid (server)
curl -H "Authorization: Bearer YOUR_PAT" \
  "https://jira.internal.company.com/rest/api/2/myself"
```

**"Rate limit exceeded" error:**
```json
{
  "mcpServers": {
    "atlassian": {
      "env": {
        "MCP_RATE_LIMIT": "5"
      }
    }
  }
}
```

### Debug Mode

Enable verbose logging:

```json
{
  "mcpServers": {
    "atlassian": {
      "env": {
        "MCP_LOG_LEVEL": "DEBUG"
      }
    }
  }
}
```

## Security Best Practices

1. **Never commit credentials** - Use environment variables or secrets management
2. **Rotate API tokens regularly** - Set calendar reminders for 90-day rotation
3. **Use minimal scopes** - Request only necessary permissions
4. **Enable audit logging** - Track API usage for compliance
5. **Restrict network access** - Use allowlists where possible

## Related References

- `authentication-patterns.md` - OAuth 2.1 and API token setup details
- `jira-queries.md` - JQL syntax after connection is established
- `confluence-operations.md` - CQL and page operations
