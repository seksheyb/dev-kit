---
name: slack-expert
description: Use when the task involves Slack development — Slack apps, @slack/bolt, Slack Web API, Events API, Block Kit, slash commands, interactive modals, OAuth for Slack, bot tokens, Socket Mode, Slack bot code review.
---

# Slack Expert

Knowledge pack for the Slack API ecosystem — @slack/bolt, the Slack Web API, Events API, Block Kit, and the latest platform features — for building and reviewing robust, scalable, secure Slack integrations.

## Slack Excellence Checklist

- Request signature verification implemented
- Rate limiting with exponential backoff
- Block Kit used over legacy attachments
- Proper error handling for all API calls
- Token management secure (not in code)
- OAuth 2.0 V2 flow implemented
- Socket Mode for dev, HTTP for production
- Response URLs used for deferred responses

## Core Expertise Areas

### Slack Bolt SDK (@slack/bolt)

- Event handling patterns and best practices
- Middleware architecture and custom middleware creation
- Action, shortcut, and view submission handlers
- Socket Mode vs. HTTP mode trade-offs
- Error handling and graceful degradation
- TypeScript integration and type safety

### Slack APIs

- Web API methods and rate limiting strategies
- Events API subscription and verification
- Conversations API for channel/DM management
- Users API and user presence
- Files API and file sharing
- Admin APIs for Enterprise Grid

### Block Kit & UI

- Block Kit Builder patterns
- Interactive components (buttons, select menus, overflow menus)
- Modal workflows and multi-step forms
- Home tab design and App Home best practices
- Message formatting with mrkdwn
- Attachment vs. Block Kit migration

### Authentication & Security

- OAuth 2.0 flows (V2 recommended)
- Bot tokens vs. user tokens
- Token rotation and secure storage
- Scopes and principle of least privilege
- Request signature verification

### Modern Slack Features

- Workflow Builder custom steps
- Slack Canvas API
- Slack Lists
- Huddles integrations
- Slack Connect for external collaboration

## Code Review Checklist

When reviewing Slack-related code:
- Verify proper error handling for API calls
- Check for rate limit handling with backoff
- Ensure request signature verification
- Validate Block Kit JSON structure
- Confirm proper token management
- Look for deprecated API usage
- Assess scalability implications
- Check for security vulnerabilities

## Architecture Patterns

Event-driven design:
- Prefer webhooks over polling
- Use Socket Mode for development
- Implement proper event acknowledgment
- Handle duplicate events gracefully

Message threading:
- Use thread_ts for conversations
- Implement broadcast to channel option
- Handle unfurling appropriately

Channel organization:
- Naming conventions
- Private vs. public decisions
- Slack Connect considerations

## Analysis Guidance

Before implementing, assess the current Slack setup:
- Existing bot capabilities
- Event subscriptions active
- Slash commands registered
- Interactive components used
- OAuth scopes granted
- Deployment architecture
- Error handling patterns
- Rate limit management

## Implementation Guidance

Implementation approach:
- Design event handlers
- Create Block Kit layouts
- Implement slash commands
- Build interactive modals
- Set up OAuth flow
- Configure webhooks
- Add error handling
- Test thoroughly

Code pattern example:
```typescript
import { App } from '@slack/bolt';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Event handler with proper error handling
app.event('app_mention', async ({ event, say, logger }) => {
  try {
    await say({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Hello <@${event.user}>!`,
          },
        },
      ],
      thread_ts: event.ts,
    });
  } catch (error) {
    logger.error('Error handling app_mention:', error);
  }
});
```

## Production Readiness Checklist

- All events handled properly
- Rate limits respected
- Errors logged appropriately
- Security verified
- Documentation complete
- Tests comprehensive
- Deployment ready
- Monitoring configured

## Best Practices Enforcement

Always use:
- Block Kit over legacy attachments
- conversations.* APIs (not deprecated channels.*)
- chat.postMessage with blocks
- response_url for deferred responses
- Exponential backoff for rate limits
- Environment variables for tokens

Never:
- Store tokens in code
- Skip request signature verification
- Ignore rate limit headers
- Use deprecated APIs
- Send unformatted error messages to users

## Priorities

- Prioritize security, user experience, and Slack platform best practices while building integrations that enhance team collaboration.
