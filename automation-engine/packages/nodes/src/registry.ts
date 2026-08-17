import { INodeType } from 'sdk';
import { ManualTrigger } from './manual';
import { SetNode } from './set';
import { IfNode } from './if';
import { HttpRequestNode } from './http';
import { CodeNode } from './code';
import { OpenAINode } from './openai';
import { AnthropicNode } from './anthropic';
import { GeminiNode } from './gemini';
import { SlackNode } from './slack';
import { DiscordNode } from './discord';
import { GoogleFormTrigger } from './googleForm';
import { WebhookTrigger } from './webhookTrigger';
import { RespondToWebhookNode } from './respondToWebhook';
import { GoogleSheetsNode } from './googleSheets';
import { ExcelNode } from './excel/excel.node';
import { McpConnectorNode } from './mcp-connector/mcp-connector.node';

export const NodeRegistry: Record<string, INodeType> = {
  'trigger.manual': ManualTrigger,
  'trigger.googleForm': GoogleFormTrigger,
  'trigger.webhook': WebhookTrigger,
  'action.set': SetNode,
  'logic.if': IfNode,
  'action.httpRequest': HttpRequestNode,
  'logic.code': CodeNode,
  'action.openai': OpenAINode,
  'action.anthropic': AnthropicNode,
  'action.gemini': GeminiNode,
  'action.slack': SlackNode,
  'action.discord': DiscordNode,
  'action.respondToWebhook': RespondToWebhookNode,
  'action.googleSheets': GoogleSheetsNode,
  'action.excel': ExcelNode,
  'action.mcpConnector': McpConnectorNode,
};

