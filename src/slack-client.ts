import { WebClient } from '@slack/web-api';

export class SlackService {
    private client: WebClient;

    constructor() {
        const token = process.env.SLACK_AUTH_TOKEN;
        if (!token) {
            throw new Error('SLACK_AUTH_TOKEN environment variable is required');
        }
        this.client = new WebClient(token);
    }

    /**
     * Send a message to a channel or user
     */
    async sendMessage(channelId: string, text: string) {
        try {
            const response = await this.client.chat.postMessage({
                channel: channelId,
                text,
            });
            return {
                success: response.ok,
                messageId: response.ts,
                channel: response.channel,
            };
        } catch (error: any) {
            console.error(`Error sending Slack message: ${error.message}`);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    /**
     * List available channels
     */
    async listChannels(limit: number = 20) {
        try {
            const response = await this.client.conversations.list({
                types: 'public_channel,private_channel',
                limit,
            });

            return (response.channels || []).map(channel => ({
                id: channel.id,
                name: channel.name,
                isPrivate: channel.is_private,
                memberCount: channel.num_members,
            }));
        } catch (error: any) {
            console.error(`Error listing Slack channels: ${error.message}`);
            throw new Error(`Failed to list channels: ${error.message}`);
        }
    }

    /**
     * Read recent messages from a channel
     */
    async readMessages(channelId: string, limit: number = 10) {
        try {
            const response = await this.client.conversations.history({
                channel: channelId,
                limit,
            });

            return (response.messages || []).map(msg => ({
                user: msg.user,
                text: msg.text,
                ts: msg.ts,
            }));
        } catch (error: any) {
            console.error(`Error reading messages from channel ${channelId}: ${error.message}`);
            throw new Error(`Failed to read messages: ${error.message}`);
        }
    }
}
