# Lilfy MCP Slack Server

A Model Context Protocol (MCP) server that provides integration with Slack for development agents.

## Features

Provides the following MCP tools:
- `send_message`: Send a chat message to a specific Slack channel or user.
- `list_channels`: List available public and private Slack channels the bot has access to.
- `read_messages`: Fetch the recent message history from a Slack channel.

## Prerequisites

You will need a Slack App with the following Bot Token Scopes:
- `chat:write`
- `channels:read`
- `groups:read`
- `channels:history`
- `groups:history`

You need to provide the Bot User OAuth Token (`xoxb-...`) as an environment variable `SLACK_BOT_TOKEN`.

## Installation & Build

```sh
cd lilfy-mcp-slack
npm install
npm run build
```

## Usage

You can run this MCP server and connect it to any MCP-compatible client (like Claude Desktop).

### In Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "slack": {
      "command": "node",
      "args": ["/absolute/path/to/lilfy-core/lilfy-mcp-slack/build/index.js"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-slack-bot-token"
      }
    }
  }
}
```

Make sure to reload the developer agent or Claude Desktop so the new server is registered.
