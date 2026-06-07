# 💬 Lilfy MCP Slack Server

A Model Context Protocol (MCP) server that provides seamless integration with Slack for development agents (such as Claude, Gemini, or custom IDE bots).

## ✨ Features

Provides the following MCP tools to connected LLM agents:
- `send_message`: Send a chat message to a specific Slack channel or user.
- `list_channels`: List available public and private Slack channels the bot has access to.
- `read_messages`: Fetch the recent message history from a Slack channel.

## 🛠️ Tech Stack

- **Runtime**: Node.js (TypeScript)
- **APIs**: Slack Web API
- **Protocol**: Model Context Protocol (MCP)

## 📋 Prerequisites

You will need a Slack App configured with the following Bot Token Scopes:
- `chat:write`
- `channels:read`
- `groups:read`
- `channels:history`
- `groups:history`

Provide the Bot User OAuth Token (`xoxb-...`) as an environment variable named `SLACK_BOT_TOKEN`.

## 🚀 Installation & Build

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript to JavaScript:
   ```bash
   npm run build
   ```

## 🔌 Integration Setup

You can run this MCP server and connect it to any MCP-compatible client (such as Claude Desktop).

### Setup in Claude Desktop

Add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "slack": {
      "command": "node",
      "args": ["/absolute/path/to/slack-app-gemini/build/index.js"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-slack-bot-token"
      }
    }
  }
}
```

Make sure to reload your developer agent or Claude Desktop so the new server is registered.
