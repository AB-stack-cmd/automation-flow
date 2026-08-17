"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeRegistry = void 0;
const manual_1 = require("./manual");
const set_1 = require("./set");
const if_1 = require("./if");
const http_1 = require("./http");
const code_1 = require("./code");
const openai_1 = require("./openai");
const anthropic_1 = require("./anthropic");
const gemini_1 = require("./gemini");
const slack_1 = require("./slack");
const discord_1 = require("./discord");
const googleForm_1 = require("./googleForm");
const webhookTrigger_1 = require("./webhookTrigger");
const respondToWebhook_1 = require("./respondToWebhook");
const googleSheets_1 = require("./googleSheets");
const excel_node_1 = require("./excel/excel.node");
const mcp_connector_node_1 = require("./mcp-connector/mcp-connector.node");
exports.NodeRegistry = {
    'trigger.manual': manual_1.ManualTrigger,
    'trigger.googleForm': googleForm_1.GoogleFormTrigger,
    'trigger.webhook': webhookTrigger_1.WebhookTrigger,
    'action.set': set_1.SetNode,
    'logic.if': if_1.IfNode,
    'action.httpRequest': http_1.HttpRequestNode,
    'logic.code': code_1.CodeNode,
    'action.openai': openai_1.OpenAINode,
    'action.anthropic': anthropic_1.AnthropicNode,
    'action.gemini': gemini_1.GeminiNode,
    'action.slack': slack_1.SlackNode,
    'action.discord': discord_1.DiscordNode,
    'action.respondToWebhook': respondToWebhook_1.RespondToWebhookNode,
    'action.googleSheets': googleSheets_1.GoogleSheetsNode,
    'action.excel': excel_node_1.ExcelNode,
    'action.mcpConnector': mcp_connector_node_1.McpConnectorNode,
};
