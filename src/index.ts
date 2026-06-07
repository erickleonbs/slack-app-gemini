#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { SlackService } from './slack-client.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Also try local .env in case it's placed in this project root
dotenv.config();

// Create the MCP server and Slack service
const server = new McpServer({
    name: "slack-mcp",
    version: "1.0.0"
});

let slackService: SlackService;
try {
    slackService = new SlackService();
} catch (error: any) {
    console.error("Failed to initialize SlackService:", error.message);
    process.exit(1);
}

// Tool: Send message
server.tool(
    'send_message',
    {
        channelId: z.string().describe("The ID of the channel or user to send the message to (e.g. C12345678)"),
        text: z.string().describe("The message text to send"),
    },
    async ({ channelId, text }) => {
        try {
            const result = await slackService.sendMessage(channelId, text);
            return {
                content: [{ type: "text", text: `Message sent successfully. ID: ${result.messageId}` }]
            };
        } catch (error: any) {
            return {
                isError: true,
                content: [{ type: "text", text: `Error: ${error.message}` }]
            };
        }
    }
);

// Tool: List channels
server.tool(
    'list_channels',
    {
        limit: z.number().optional().describe("Maximum number of channels to fetch (default 20)"),
    },
    async ({ limit }) => {
        try {
            const channels = await slackService.listChannels(limit);

            const formattedChannels = channels.map(c =>
                `- ${c.name} (${c.id}) [Private: ${c.isPrivate}, Members: ${c.memberCount}]`
            ).join('\\n');

            return {
                content: [{ type: "text", text: `Channels:\\n${formattedChannels}` }]
            };
        } catch (error: any) {
            return {
                isError: true,
                content: [{ type: "text", text: `Error: ${error.message}` }]
            };
        }
    }
);

// Tool: Read messages
server.tool(
    'read_messages',
    {
        channelId: z.string().describe("The ID of the channel to read messages from"),
        limit: z.number().optional().describe("Number of recent messages to fetch (default 10)"),
    },
    async ({ channelId, limit }) => {
        try {
            const messages = await slackService.readMessages(channelId, limit);

            if (messages.length === 0) {
                return { content: [{ type: "text", text: "No messages found in this channel." }] };
            }

            const formattedMessages = messages.map(m =>
                `[${m.ts}] User ${m.user}: ${m.text}`
            ).join('\\n');

            return {
                content: [{ type: "text", text: `Recent Messages:\\n${formattedMessages}` }]
            };
        } catch (error: any) {
            return {
                isError: true,
                content: [{ type: "text", text: `Error: ${error.message}` }]
            };
        }
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Slack MCP Server running on stdio");
}

main().catch(error => {
    console.error("Server error:", error);
    process.exit(1);
});
