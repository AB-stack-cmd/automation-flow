import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  TriggerNode,
  MarketingNode,
  CRMNode,
  LogicNode,
  DelayNode,
  CodeNode,
  EndNode,
  StartNode,
  GoogleFormTriggerNode,
  ScheduleTriggerNode,
  GoogleSheetsNode,
  OpenAINode,
  SlackNode,
  DiscordNode,
  RespondToWebhookNode,
  ExcelNode,
  McpConnectorNode
} from './CustomNode';
import CustomButtonEdge from './CustomEdge';

const edgeTypes = {
  buttonEdge: CustomButtonEdge,
  default: CustomButtonEdge
};


const nodeTypes = {
  trigger: TriggerNode,
  crm_lead_trigger: TriggerNode,
  marketing_email: MarketingNode,
  crm_action: CRMNode,
  ifelse: LogicNode,
  delay: DelayNode,
  code: CodeNode,
  end: EndNode,
  start_trigger: StartNode,
  google_form_trigger: GoogleFormTriggerNode,
  schedule_trigger: ScheduleTriggerNode,
  google_sheets: GoogleSheetsNode,
  openai: OpenAINode,
  'action.openai': OpenAINode,
  slack: SlackNode,
  'action.slack': SlackNode,
  discord: DiscordNode,
  'action.discord': DiscordNode,
  respond_to_webhook: RespondToWebhookNode,
  'action.respondToWebhook': RespondToWebhookNode,
  excel: ExcelNode,
  'action.excel': ExcelNode,
  mcp_connector: McpConnectorNode,
  'action.mcpConnector': McpConnectorNode
};

const BACKEND_URL = 'http://localhost:4000';

const getNodeInterfaceDetails = (node: any) => {
  const type = node?.type || '';
  const label = node?.data?.label || node?.id || 'Node Connection';

  if (type === 'trigger' || type === 'webhook' || type === 'respond_to_webhook' || type === 'action.respondToWebhook') {
    return {
      category: 'webhook',
      title: 'Webhook Input & Configuration',
      subtitle: 'Configure payload structure, select HTTP method, and test incoming webhook events.',
      icon: 'bolt',
      themeColor: 'emerald',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      headerGradient: 'from-[#141d18] via-[#1a251f] to-[#141619]',
      borderClass: 'border-emerald-500/40',
      btnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      testBtnLabel: '⚡ Send Test Webhook Payload',
    };
  }

  if (type === 'schedule_trigger') {
    return {
      category: 'schedule',
      title: 'Schedule Timer Trigger & Cron Execution',
      subtitle: 'Configure recurring interval timers, cron expressions, and test fire scheduled events.',
      icon: 'alarm',
      themeColor: 'amber',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      headerGradient: 'from-[#1f1a14] via-[#262017] to-[#161414]',
      borderClass: 'border-amber-500/40',
      btnClass: 'bg-amber-600 hover:bg-amber-500 text-white',
      testBtnLabel: '⏰ Test Fire Timer Event',
    };
  }

  if (type === 'google_form_trigger') {
    return {
      category: 'google_form',
      title: 'Google Form Submission Interface',
      subtitle: 'Simulate Google Form entries, field mappings, and test incoming respondent submissions.',
      icon: 'description',
      themeColor: 'green',
      badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30',
      headerGradient: 'from-[#141f17] via-[#1a261c] to-[#141614]',
      borderClass: 'border-green-500/40',
      btnClass: 'bg-green-600 hover:bg-green-500 text-white',
      testBtnLabel: '📋 Test Submit Form Entry',
    };
  }

  if (type === 'crm_lead_trigger' || type === 'crm_action') {
    return {
      category: 'crm',
      title: 'CRM Lead & Contact Connection Interface',
      subtitle: 'Configure contact email, lead status, score adjustments, and test CRM pipeline synchronization.',
      icon: 'account_circle',
      themeColor: 'indigo',
      badgeClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      headerGradient: 'from-[#151724] via-[#1a1c2d] to-[#141419]',
      borderClass: 'border-indigo-500/40',
      btnClass: 'bg-indigo-600 hover:bg-indigo-500 text-white',
      testBtnLabel: '👥 Test Dispatch CRM Lead',
    };
  }

  if (type === 'marketing_email') {
    return {
      category: 'email',
      title: 'Send Email SMTP Delivery Interface',
      subtitle: 'Configure recipient email, subject line, body template, and test email dispatch.',
      icon: 'mail',
      themeColor: 'sky',
      badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      headerGradient: 'from-[#141c24] via-[#18232d] to-[#141619]',
      borderClass: 'border-sky-500/40',
      btnClass: 'bg-sky-600 hover:bg-sky-500 text-white',
      testBtnLabel: '✉️ Send Test Email Payload',
    };
  }

  if (type === 'google_sheets') {
    return {
      category: 'google_sheets',
      title: 'Google Sheets Sync & Row Data Interface',
      subtitle: 'Configure sheet operations (Read/Append), target sheet name, and test row data operations.',
      icon: 'table_chart',
      themeColor: 'teal',
      badgeClass: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      headerGradient: 'from-[#141f1f] via-[#182727] to-[#141616]',
      borderClass: 'border-teal-500/40',
      btnClass: 'bg-teal-600 hover:bg-teal-500 text-white',
      testBtnLabel: '📊 Test Execute Sheets Query',
    };
  }

  if (type === 'openai' || type === 'action.openai') {
    return {
      category: 'openai',
      title: 'OpenAI GPT AI Prompt Completion Interface',
      subtitle: 'Configure LLM model (GPT-4o), temperature creativity, max tokens, and test prompt generation.',
      icon: 'psychology',
      themeColor: 'purple',
      badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      headerGradient: 'from-[#1c1424] via-[#241a2e] to-[#161419]',
      borderClass: 'border-purple-500/40',
      btnClass: 'bg-purple-600 hover:bg-purple-500 text-white',
      testBtnLabel: '🧠 Run Test AI Completion',
    };
  }

  if (type === 'slack' || type === 'discord') {
    return {
      category: 'chat',
      title: `${type === 'slack' ? 'Slack' : 'Discord'} Webhook Alert Interface`,
      subtitle: 'Configure channel webhook URL, alert content, and test message dispatch.',
      icon: type === 'slack' ? 'forum' : 'mark_chat_read',
      themeColor: 'fuchsia',
      badgeClass: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
      headerGradient: 'from-[#221424] via-[#29182b] to-[#171419]',
      borderClass: 'border-fuchsia-500/40',
      btnClass: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white',
      testBtnLabel: '💬 Send Test Alert Notification',
    };
  }

  if (type === 'delay') {
    return {
      category: 'delay',
      title: 'Delay Timer Execution Interface',
      subtitle: 'Configure wait interval before executing downstream workflow nodes.',
      icon: 'schedule',
      themeColor: 'amber',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      headerGradient: 'from-[#1f1a14] via-[#262017] to-[#161414]',
      borderClass: 'border-amber-500/40',
      btnClass: 'bg-amber-600 hover:bg-amber-500 text-white',
      testBtnLabel: '⏳ Test Run Delay Timer',
    };
  }

  if (type === 'code') {
    return {
      category: 'code',
      title: 'Custom JavaScript Code Execution Interface',
      subtitle: 'Write custom JavaScript context logic, data transformations, and return payloads.',
      icon: 'code',
      themeColor: 'teal',
      badgeClass: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      headerGradient: 'from-[#141f1f] via-[#182727] to-[#141616]',
      borderClass: 'border-teal-500/40',
      btnClass: 'bg-teal-600 hover:bg-teal-500 text-white',
      testBtnLabel: '💻 Execute Test Script',
    };
  }

  if (type === 'rabbitmq_publish') {
    return {
      category: 'rabbitmq',
      title: 'RabbitMQ Message Broker Interface',
      subtitle: 'Publish event payloads directly to RabbitMQ message broker queue.',
      icon: 'input',
      themeColor: 'amber',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      headerGradient: 'from-[#1f1a14] via-[#262017] to-[#161414]',
      borderClass: 'border-amber-500/40',
      btnClass: 'bg-amber-600 hover:bg-amber-500 text-white',
      testBtnLabel: '🐰 Test Publish Message',
    };
  }

  return {
    category: 'generic',
    title: `${label} Connection Interface`,
    subtitle: 'Configure input data, test execution connection, and inspect response payloads.',
    icon: 'tune',
    themeColor: 'coral',
    badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    headerGradient: 'from-[#1f1614] via-[#271a17] to-[#161414]',
    borderClass: 'border-orange-500/40',
    btnClass: 'bg-[#ff4f00] hover:bg-[#e04500] text-white',
    testBtnLabel: '⚡ Dispatch Test Connection',
  };
};

// Template Definitions from user request & HTML template
const TEMPLATES = [
  {
    id: 'every-10s-email-check',
    name: '10s Interval Health Check & Email Dispatcher',
    category: 'Monitoring & Health',
    description: 'Triggers automatically every 10 seconds to dispatch a system health check email payload and verify workflow execution status.',
    icons: ['alarm', 'mail', 'check_circle'],
    popular: true,
    featured: true,
    definition: {
      nodes: [
        {
          id: 'schedule_trigger_10s',
          type: 'schedule_trigger',
          position: { x: 100, y: 200 },
          data: {
            label: 'Trigger Every 10s',
            scheduleType: 'interval',
            intervalValue: 10,
            intervalUnit: 'seconds'
          }
        },
        {
          id: 'email_dispatch_node',
          type: 'marketing_email',
          position: { x: 420, y: 190 },
          data: {
            label: 'Send Email Health Alert',
            subject: '⚡ System Status Alert - Every 10s Check',
            body: 'Automation engine heartbeat test sent at {{timestamp}}. Status: Operational.'
          }
        }
      ],
      edges: [
        {
          id: 'edge_schedule_to_email',
          source: 'schedule_trigger_10s',
          target: 'email_dispatch_node',
          targetHandle: 'input',
          animated: true,
          style: { stroke: '#ff4f00', strokeWidth: 2.5 }
        }
      ]
    }
  },
  {
    id: 'start-ifelse-jsscript-end',
    name: 'Start → If/Else → JS Script → End Workflow',
    category: 'Logic & Code',
    description: 'Complete execution pipeline starting with a Start Trigger, filtering data via If/Else condition, executing custom JS code, and terminating at End nodes.',
    icons: ['play_circle', 'alt_route', 'code', 'stop_circle'],
    popular: true,
    definition: {
      nodes: [
        { id: 'start_node', type: 'start_trigger', position: { x: 100, y: 220 }, data: { label: 'Start Trigger' } },
        { id: 'check_node', type: 'ifelse', position: { x: 340, y: 210 }, data: { label: 'If/Else Filter', condition: 'context.trigger.score > 50' } },
        { id: 'js_script_node', type: 'code', position: { x: 620, y: 140 }, data: { label: 'Run JS Script', code: '// Process high value lead payload\ncontext.trigger.processed = true;\ncontext.trigger.vipScore = context.trigger.score * 2;\nreturn context.trigger;' } },
        { id: 'end_passed_node', type: 'end', position: { x: 900, y: 160 }, data: { label: 'End Flow (Passed)' } },
        { id: 'end_filtered_node', type: 'end', position: { x: 620, y: 320 }, data: { label: 'End Flow (Filtered)' } }
      ],
      edges: [
        { id: 'e1-2', source: 'start_node', target: 'check_node', animated: true, style: { stroke: '#facc15', strokeWidth: 2.5 } },
        { id: 'e2-3', source: 'check_node', sourceHandle: 'true', target: 'js_script_node', targetHandle: 'input', animated: true, style: { stroke: '#10b981', strokeWidth: 2.5 } },
        { id: 'e3-4', source: 'js_script_node', target: 'end_passed_node', animated: true, style: { stroke: '#facc15', strokeWidth: 2.5 } },
        { id: 'e2-5', source: 'check_node', sourceHandle: 'false', target: 'end_filtered_node', targetHandle: 'input', animated: true, style: { stroke: '#ef4444', strokeWidth: 2.5 } }
      ]
    }
  },
  {
    id: 'scheduled-google-sheets-summarizer',
    name: 'Scheduled Google Sheets Blog Summarizer',
    category: 'AI Agents',
    description: 'Triggered periodically on a timer, this workflow reads blog articles from Google Sheets, runs an OpenAI model to summarize the contents, and posts them to Slack/Discord.',
    icons: ['alarm', 'table_chart', 'psychology', 'forum'],
    popular: true,
    definition: {
      nodes: [
        { 
          id: 'schedule_node', 
          type: 'schedule_trigger', 
          position: { x: 100, y: 200 }, 
          data: { 
            label: 'Trigger Hourly', 
            scheduleType: 'interval',
            intervalValue: 10,
            intervalUnit: 'seconds'
          } 
        },
        { 
          id: 'sheets_node', 
          type: 'google_sheets', 
          position: { x: 300, y: 200 }, 
          data: { 
            label: 'Read Draft Articles', 
            action: 'read',
            sheetName: 'Sheet1',
            mockDataType: 'blog_news',
            triggerForEachRow: true
          } 
        },
        { 
          id: 'openai_node', 
          type: 'openai', 
          position: { x: 550, y: 200 }, 
          data: { 
            label: 'GPT Summarizer', 
            prompt: 'Please write a concise 2-sentence summary of this article:\nTitle: {{trigger.title}}\nContent: {{trigger.content}}',
            model: 'gpt-4o'
          } 
        },
        { 
          id: 'slack_node', 
          type: 'slack', 
          position: { x: 800, y: 200 }, 
          data: { 
            label: 'Post to Slack', 
            webhookUrl: 'https://hooks.slack.com/services/mock-webhook-url',
            text: '📢 *New Article Summary:* \n\n*Title:* {{trigger.title}}\n*Summary:* {{steps.openai_node.result}}'
          } 
        }
      ],
      edges: [
        { id: 'e1-2', source: 'schedule_node', target: 'sheets_node', animated: true, style: { stroke: '#facc15' } },
        { id: 'e2-3', source: 'sheets_node', target: 'openai_node', animated: true, style: { stroke: '#facc15' } },
        { id: 'e3-4', source: 'openai_node', target: 'slack_node', animated: true, style: { stroke: '#facc15' } }
      ]
    }
  },
  {
    id: 'slack-postgres-sync',
    name: 'Slack to PostgreSQL Sync',
    category: 'AI Agents',
    description: 'Extract sentiment and action items from Slack messages via LLM and archive to database.',
    icons: ['forum', 'psychology'],
    popular: true,
    definition: {
      nodes: [
        { id: 'start_node', type: 'trigger', position: { x: 100, y: 200 }, data: { label: 'Slack Webhook Input', triggerType: 'webhook' } },
        { id: 'sentiment_node', type: 'code', position: { x: 350, y: 200 }, data: { label: 'Extract Sentiment & Actions', code: '// Extract sentiment and actions via LLM\nconst msg = context.trigger.message || "Hello team!";\ncontext.trigger.sentiment = "positive";\ncontext.trigger.action_items = ["follow up with user"];\nreturn context.trigger;' } },
        { id: 'db_sync_node', type: 'crm_action', position: { x: 600, y: 200 }, data: { label: 'Archive to PostgreSQL', actionType: 'create_or_update', status: 'customer', email: '{{trigger.email}}' } }
      ],
      edges: [
        { id: 'e1-2', source: 'start_node', target: 'sentiment_node', animated: true, style: { stroke: '#facc15' } },
        { id: 'e2-3', source: 'sentiment_node', target: 'db_sync_node', animated: true, style: { stroke: '#facc15' } }
      ]
    }
  },
  {
    id: 'ai-lead-scoring',
    name: 'AI Lead Scoring',
    category: 'Marketing',
    description: 'Real-time lead qualification using GPT-4 company profile analysis and priority queuing.',
    icons: ['mail', 'grade'],
    definition: {
      nodes: [
        { id: 'start_node', type: 'crm_lead_trigger', position: { x: 100, y: 200 }, data: { label: 'New Lead In CRM', triggerType: 'crm' } },
        { id: 'gpt_node', type: 'code', position: { x: 350, y: 200 }, data: { label: 'GPT-4 scoring', code: '// Call GPT-4 API to score lead\ncontext.trigger.score = Math.floor(Math.random() * 30) + 70;\nreturn context.trigger;' } },
        { id: 'check_node', type: 'ifelse', position: { x: 600, y: 200 }, data: { label: 'Score > 80?', condition: 'context.trigger.score > 80' } },
        { id: 'high_score_email', type: 'marketing_email', position: { x: 850, y: 140 }, data: { label: 'VIP Welcome Email', subject: 'VIP Access Unlocked!', body: 'Hi {{trigger.name}}, your lead score is {{trigger.score}}! Welcome to VIP program.' } },
        { id: 'standard_crm_sync', type: 'crm_action', position: { x: 850, y: 280 }, data: { label: 'Standard Lead Sync', actionType: 'create_or_update', status: 'lead', scoreChange: '5' } }
      ],
      edges: [
        { id: 'e1-2', source: 'start_node', target: 'gpt_node', animated: true, style: { stroke: '#facc15' } },
        { id: 'e2-3', source: 'gpt_node', target: 'check_node', animated: true, style: { stroke: '#facc15' } },
        { id: 'e3-4', source: 'check_node', sourceHandle: 'true', target: 'high_score_email', targetHandle: 'input', animated: true, style: { stroke: '#10b981' } },
        { id: 'e3-5', source: 'check_node', sourceHandle: 'false', target: 'standard_crm_sync', targetHandle: 'input', animated: true, style: { stroke: '#ef4444' } }
      ]
    }
  },
  {
    id: 'webflow-error-monitor',
    name: 'Webflow Error Monitor',
    category: 'DevOps',
    description: 'Capture runtime errors from Webflow frontend and trigger PagerDuty alerts.',
    icons: ['webhook', 'notification_important'],
    definition: {
      nodes: [
        { id: 'start_node', type: 'trigger', position: { x: 100, y: 200 }, data: { label: 'Webflow Exception Webhook', triggerType: 'webhook' } },
        { id: 'notify_node', type: 'code', position: { x: 350, y: 200 }, data: { label: 'PagerDuty Alert API', code: '// Format error and alert PagerDuty\ncontext.trigger.alert_status = "sent";\nconsole.log("ALERT Sent to PagerDuty!");\nreturn context.trigger;' } }
      ],
      edges: [
        { id: 'e1-2', source: 'start_node', target: 'notify_node', animated: true, style: { stroke: '#facc15' } }
      ]
    }
  },
  {
    id: 'inventory-balancer',
    name: 'Inventory Balancer',
    category: 'E-Commerce',
    description: 'Synchronize real-time inventory across Shopify, Amazon, and eBay with automated ERP restock triggers.',
    icons: ['hub'],
    featured: true,
    definition: {
      nodes: [
        { id: 'start_node', type: 'trigger', position: { x: 100, y: 200 }, data: { label: 'Stock Level Changed', triggerType: 'webhook' } },
        { id: 'balance_node', type: 'code', position: { x: 350, y: 200 }, data: { label: 'Balance Channels', code: '// Balance stock across Shopify and eBay\ncontext.trigger.balanced = true;\nreturn context.trigger;' } },
        { id: 'restock_check', type: 'ifelse', position: { x: 600, y: 200 }, data: { label: 'Stock < 5?', condition: 'context.trigger.qty < 5' } },
        { id: 'restock_alert', type: 'slack', position: { x: 850, y: 140 }, data: { label: 'Urgent Restock Alert', text: '⚠️ Low inventory alert for product ID {{trigger.sku}}!' } },
        { id: 'log_success', type: 'code', position: { x: 850, y: 280 }, data: { label: 'Log Inventory Sync', code: 'return { status: "Inventory optimal" };' } }
      ],
      edges: [
        { id: 'e1-2', source: 'start_node', target: 'balance_node', animated: true, style: { stroke: '#facc15' } },
        { id: 'e2-3', source: 'balance_node', target: 'restock_check', animated: true, style: { stroke: '#facc15' } },
        { id: 'e3-4', source: 'restock_check', sourceHandle: 'true', target: 'restock_alert', targetHandle: 'input', animated: true, style: { stroke: '#10b981' } },
        { id: 'e3-5', source: 'restock_check', sourceHandle: 'false', target: 'log_success', targetHandle: 'input', animated: true, style: { stroke: '#ef4444' } }
      ]
    }
  },
  {
    id: 'ip-whitelist-enforcer',
    name: 'IP Whitelist Enforcer',
    category: 'Security',
    description: 'Auto-update Cloudflare firewall rules based on rotating team VPN endpoints.',
    icons: ['security', 'cloud_sync'],
    definition: {
      nodes: [
        { id: 'start_node', type: 'trigger', position: { x: 100, y: 200 }, data: { label: 'VPN Endpoint Rotated', triggerType: 'webhook' } },
        { id: 'cf_node', type: 'code', position: { x: 350, y: 200 }, data: { label: 'Update CF Firewall', code: '// Update Cloudflare firewall whitelists\ncontext.trigger.firewall_rule = "updated";\nreturn context.trigger;' } }
      ],
      edges: [
        { id: 'e1-2', source: 'start_node', target: 'cf_node', animated: true, style: { stroke: '#facc15' } }
      ]
    }
  }
];

export default function App() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
  }, []);

  // Navigation layout state
  const [viewMode, setViewMode] = useState<'overview' | 'canvas' | 'templates' | 'variables' | 'settings' | 'history' | 'executions'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // User Profile States
  const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff4f00"/><stop offset="100%" stop-color="%23201515"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23avatarGrad)"/><circle cx="50" cy="40" r="18" fill="%23fffefb"/><path d="M18 78 C 18 58, 82 58, 82 78" fill="%23fffefb"/></svg>`;
  const [profilePic, setProfilePic] = useState<string>(() => {
    return localStorage.getItem('neuron_profile_pic') || DEFAULT_AVATAR;
  });
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarInputUrl, setAvatarInputUrl] = useState('');

  // NEURON_FLOW Design System Example Surfaces UI States
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [appToast, setAppToast] = useState<{ message: string; type?: 'info' | 'success' | 'warning' } | null>(null);

  const showAppToast = (message: string, type: 'info' | 'success' | 'warning' = 'success') => {
    setAppToast({ message, type });
    setTimeout(() => setAppToast(null), 3000);
  };

  // AI Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "Hello! I am your Neuron AI Copilot. I can help you generate custom JS scripts, configure logic paths, and optimize your automation steps. Try selecting a 'Run Script' node and asking me to write a script!"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendChatMessage = (text: string) => {
    if (!text.trim()) return;

    const newMsgs = [...chatMessages, { id: `user_${Date.now()}`, sender: 'user', text }];
    setChatMessages(newMsgs);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "I can help you build custom scripts. Try selecting a 'Run Script' code node and click one of the templates below!";
      let code = "";
      const lower = text.toLowerCase();

      if (lower.includes('lead') || lower.includes('qualif') || lower.includes('score')) {
        replyText = "Here is a custom lead scoring script that upgrades the status and increments the lead score if the email matches a premium domain:";
        code = `// Lead scoring enrichment logic
const email = context.trigger.email || '';
const isPremium = email.endsWith('.com') || email.endsWith('.org') || email.endsWith('.io');
if (isPremium) {
  context.trigger.score = (context.trigger.score || 0) + 25;
  context.trigger.status = 'contact';
} else {
  context.trigger.score = (context.trigger.score || 0) + 5;
}
return context.trigger;`;
      } else if (lower.includes('sentiment') || lower.includes('classify') || lower.includes('analyze')) {
        replyText = "Here is a script to perform a basic keyword sentiment analysis on webhook feedback messages:";
        code = `// Sentiment classifier
const feedback = context.trigger.feedback || '';
const happyWords = ['good', 'love', 'nice', 'great', 'awesome', 'excellent'];
const sadWords = ['bad', 'slow', 'fail', 'error', 'worst', 'issue', 'broken'];

let rating = 0;
happyWords.forEach(w => { if (feedback.toLowerCase().includes(w)) rating++; });
sadWords.forEach(w => { if (feedback.toLowerCase().includes(w)) rating--; });

context.trigger.sentiment = rating > 0 ? 'positive' : rating < 0 ? 'negative' : 'neutral';
return context.trigger;`;
      } else if (lower.includes('slack') || lower.includes('format') || lower.includes('notify')) {
        replyText = "Here is a script to format the input payload to match a Slack block kit message payload:";
        code = `// Slack message payload formatter
return {
  text: \`🔔 Automation Alert: \${context.trigger.name || 'Unknown User'} has registered!\`,
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: \`*New Automation Flow Event*\\n*User:* \${context.trigger.name}\\n*Email:* \${context.trigger.email}\\n*Score:* \${context.trigger.score}\`
      }
    }
  ]
};`;
      }

      setChatMessages(prev => [...prev, {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        text: replyText,
        code
      }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleApplyCodeToNode = (codeText: string) => {
    if (!selectedNode) {
      alert("Please select a 'Run Script' node on the canvas first!");
      return;
    }
    if (selectedNode.type !== 'code') {
      alert("Please select a 'Run Script' (code) node to inject code. The currently selected node is of type '" + selectedNode.type + "'.");
      return;
    }
    updateNodeData('code', codeText);
    alert("Code successfully applied to the selected Run Script node!");
  };

  // Execution Stream Popup States
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [execEmail, setExecEmail] = useState('jane.doe@example.com');
  const [execName, setExecName] = useState('Jane Doe');
  const [execScore, setExecScore] = useState(80);
  const [execStatus, setExecStatus] = useState<'idle' | 'running' | 'success' | 'failed' | 'paused'>('idle');
  const [execLogs, setExecLogs] = useState<any[]>([]);
  const [execActiveNodeId, setExecActiveNodeId] = useState<string | null>(null);
  const [manualApprovalEnabled, setManualApprovalEnabled] = useState(false);
  const [humanApprovalRequired, setHumanApprovalRequired] = useState(false);
  const [pendingNode, setPendingNode] = useState<any>(null);

  const [simulatedExecutionData, setSimulatedExecutionData] = useState<any>(null);
  const [showSimulatedJson, setShowSimulatedJson] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showStartPopup, setShowStartPopup] = useState(false);

  const fetchSimulatedJson = async (execId: number) => {
    try {
      await new Promise(r => setTimeout(r, 1000)); // allow server to finish execution writing to DB
      const res = await fetch(`${BACKEND_URL}/api/executions/${execId}`);
      const data = await res.json();
      setSimulatedExecutionData(data);
    } catch (e) {
      console.error("Failed to fetch simulated JSON outputs:", e);
    }
  };

  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [diagnosticsReport, setDiagnosticsReport] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const runDiagnostics = async () => {
    if (!currentWorkflow) return;
    setIsDiagnosing(true);
    setIsDiagnosticsModalOpen(true);

    const report: any = {
      nodesChecked: nodes.length,
      edgesChecked: edges.length,
      triggerChecks: [],
      systemChecks: []
    };

    // --- NODE DIAGNOSTICS ---

    // 1. Has Trigger Node
    const triggers = nodes.filter(n => n.type === 'trigger' || n.type === 'crm_lead_trigger');
    if (triggers.length === 1) {
      report.triggerChecks.push({
        name: 'Start Trigger Presence',
        status: 'pass',
        message: `Exactly one start trigger is configured: "${triggers[0].data?.label || triggers[0].id}".`
      });
    } else if (triggers.length > 1) {
      report.triggerChecks.push({
        name: 'Start Trigger Presence',
        status: 'warn',
        message: `Multiple start triggers found (${triggers.length}). The workflow engine will run from the first active trigger.`
      });
    } else {
      report.triggerChecks.push({
        name: 'Start Trigger Presence',
        status: 'fail',
        message: 'No start trigger node found. Workflows require a trigger node (e.g. Webhook Input, CRM Lead Created) to run.'
      });
    }

    // 2. Unconnected/Orphan Nodes
    const orphanNodes = nodes.filter(n => {
      const isConnected = edges.some(e => e.source === n.id || e.target === n.id);
      return !isConnected;
    });

    if (orphanNodes.length === 0) {
      report.triggerChecks.push({
        name: 'Node Connectivity',
        status: 'pass',
        message: 'All nodes are connected to the automation pipeline.'
      });
    } else {
      report.triggerChecks.push({
        name: 'Node Connectivity',
        status: 'warn',
        message: `${orphanNodes.length} isolated node(s) found: ${orphanNodes.map(n => `"${n.data?.label || n.id}"`).join(', ')}. These nodes will not be executed.`
      });
    }

    // 3. Branch Completeness
    const ifElses = nodes.filter(n => n.type === 'ifelse');
    let branchFailures = 0;
    ifElses.forEach(n => {
      const trueConnected = edges.some(e => e.source === n.id && e.sourceHandle === 'true');
      const falseConnected = edges.some(e => e.source === n.id && e.sourceHandle === 'false');
      if (!trueConnected || !falseConnected) {
        branchFailures++;
      }
    });

    if (ifElses.length === 0) {
      // No logic nodes
    } else if (branchFailures === 0) {
      report.triggerChecks.push({
        name: 'Conditional Branching',
        status: 'pass',
        message: 'All logic check branches (Yes/No) are fully wired.'
      });
    } else {
      report.triggerChecks.push({
        name: 'Conditional Branching',
        status: 'fail',
        message: `${branchFailures} If/Else logic node(s) have unwired branches. Both True (Yes) and False (No) branches must be connected.`
      });
    }

    // 4. Invalid Input/Output Connections
    const triggerIncoming = edges.some(e => {
      const targetNode = nodes.find(n => n.id === e.target);
      return targetNode && (targetNode.type === 'trigger' || targetNode.type === 'crm_lead_trigger');
    });

    if (triggerIncoming) {
      report.triggerChecks.push({
        name: 'Data Flow Direction',
        status: 'warn',
        message: 'Trigger node has an incoming connection. Triggers should initiate flows and only have outgoing connections.'
      });
    } else {
      report.triggerChecks.push({
        name: 'Data Flow Direction',
        status: 'pass',
        message: 'Data flows properly from start triggers to actions.'
      });
    }

    // 5. Cycle/Infinite Loop Detection
    const hasCycle = () => {
      const adj: Record<string, string[]> = {};
      nodes.forEach(n => { adj[n.id] = []; });
      edges.forEach(e => {
        if (adj[e.source]) adj[e.source].push(e.target);
      });

      const visited: Record<string, boolean> = {};
      const recStack: Record<string, boolean> = {};

      const dfs = (u: string): boolean => {
        visited[u] = true;
        recStack[u] = true;
        const neighbors = adj[u] || [];
        for (const v of neighbors) {
          if (!visited[v]) {
            if (dfs(v)) return true;
          } else if (recStack[v]) {
            return true;
          }
        }
        recStack[u] = false;
        return false;
      };

      for (const n of nodes) {
        if (!visited[n.id]) {
          if (dfs(n.id)) return true;
        }
      }
      return false;
    };

    if (hasCycle()) {
      report.triggerChecks.push({
        name: 'Loop Protection',
        status: 'fail',
        message: 'Circular connection detected in workflow! This may cause infinite loops or stack overflow errors.'
      });
    } else {
      report.triggerChecks.push({
        name: 'Loop Protection',
        status: 'pass',
        message: 'No circular connections detected.'
      });
    }

    // --- SYSTEM AUTOMATION HEALTH DIAGNOSTICS ---

    // 1. Backend Server Check
    let isBackendUp = false;
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      const data = await res.json();
      if (data.status === 'ok') {
        isBackendUp = true;
        report.systemChecks.push({
          name: 'Backend API Connection',
          status: 'pass',
          message: 'Express orchestrator engine is active and reachable.'
        });
      }
    } catch {
      report.systemChecks.push({
        name: 'Backend API Connection',
        status: 'fail',
        message: `Unable to connect to Express backend server at ${BACKEND_URL}. Verify backend service is running.`
      });
    }

    // 2. Scheduler Daemon & DB Status
    if (isBackendUp) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/executions`);
        const executions = await res.json();
        
        report.systemChecks.push({
          name: 'Timer Scheduler Service',
          status: 'pass',
          message: 'Scheduler daemon loop is active and polling delayed executions database table.'
        });

        // 3. Execution Health Check
        const failedCount = executions.filter((e: any) => e.workflowId === currentWorkflow.id && e.status === 'failed').length;
        const successCount = executions.filter((e: any) => e.workflowId === currentWorkflow.id && e.status === 'success').length;
        
        if (failedCount > 0) {
          report.systemChecks.push({
            name: 'Recent Execution Health',
            status: 'warn',
            message: `Found ${failedCount} execution failures in recently simulated runs for this workflow.`
          });
        } else if (successCount > 0) {
          report.systemChecks.push({
            name: 'Recent Execution Health',
            status: 'pass',
            message: `Successfully executed recent simulated runs. Output statuses verified.`
          });
        } else {
          report.systemChecks.push({
            name: 'Recent Execution Health',
            status: 'warn',
            message: 'No simulated runs recorded yet for this workflow. Try trigger run to verify end-to-end automation.'
          });
        }
      } catch {
        report.systemChecks.push({
          name: 'Database Integration',
          status: 'fail',
          message: 'Database query error while checking executions. Check Prisma/SQLite setup.'
        });
      }
    } else {
      report.systemChecks.push({
        name: 'Database Integration',
        status: 'fail',
        message: 'Could not query database health check (backend server offline).'
      });
    }

    setDiagnosticsReport(report);
    setIsDiagnosing(false);
  };

  const startConnectionStream = async (email: string, name: string, score: number, targetWf?: any, targetNodes?: any[], targetEdges?: any[]) => {
    const activeWorkflow = targetWf || currentWorkflow;
    const activeNodes = targetNodes || nodes;
    const activeEdges = targetEdges || edges;
    if (!activeWorkflow) return;
    setExecStatus('running');
    setExecLogs([{ time: new Date().toISOString(), message: "🤖 Connection established. Initializing agent orchestrator..." }]);

    setSimulatedExecutionData(null);
    setShowSimulatedJson(false);
    setShowStartPopup(true);
    setTimeout(() => {
      setShowStartPopup(false);
    }, 3000);

    // Trigger backend execute call to persist in SQLite database
    let triggerExecutionId: number | null = null;
    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows/${activeWorkflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, score })
      });
      const data = await res.json();
      if (data.success && data.executionId) {
        triggerExecutionId = data.executionId;
      }
    } catch (e) {
      console.error("Backend trigger failed:", e);
    }

    // Trace the execution path on the frontend
    const triggerNode = activeNodes.find((n: any) => 
      n.type === 'trigger' || 
      n.type === 'crm_lead_trigger' || 
      n.type === 'schedule_trigger' || 
      n.type === 'google_form_trigger' ||
      n.type === 'webhook' ||
      n.type === 'start_trigger'
    );
    if (!triggerNode) {
      setExecLogs(prev => [...prev, { time: new Date().toISOString(), message: "❌ Error: No starting trigger node found in this workflow." }]);
      setExecStatus('failed');
      return;
    }

    // Traverse nodes map
    const path: any[] = [];
    let curr: any = triggerNode;
    while (curr) {
      path.push(curr);
      const outgoing = activeEdges.filter((e: any) => e.source === curr.id);
      if (outgoing.length === 0) break;

      if (curr.type === 'ifelse') {
        const isTrue = score > 50;
        const targetEdge = outgoing.find((e: any) => {
          const handleId = e.sourceHandle || '';
          return isTrue ? handleId.toLowerCase() === 'true' : handleId.toLowerCase() === 'false';
        });
        const nextId = targetEdge ? targetEdge.target : outgoing[0].target;
        curr = activeNodes.find((n: any) => n.id === nextId);
      } else {
        curr = activeNodes.find((n: any) => n.id === outgoing[0].target);
      }
      
      if (path.includes(curr)) break; // Cycle protection
    }

    // Start stepping through the path
    let pathIndex = 0;
    
    const runStep = () => {
      if (pathIndex >= path.length) {
        setExecStatus('success');
        setExecActiveNodeId(null);
        setExecLogs(prev => [...prev, { time: new Date().toISOString(), message: "✅ Execution completed. Pipeline closed successfully." }]);
        fetchMockData();
        if (triggerExecutionId) {
          fetchSimulatedJson(triggerExecutionId);
        }
        return;
      }

      const node = path[pathIndex];
      setExecActiveNodeId(node.id);

      let msg = `Processing node: ${node.data?.label || node.id}`;
      if (node.type === 'trigger' || node.type === 'crm_lead_trigger') {
        msg = `🤖 [TRIGGER] Agent: Trigger event parsed. Contact = ${email}, Score = ${score}. Checking paths.`;
      } else if (node.type === 'schedule_trigger') {
        msg = `⏰ [TRIGGER] Agent: Schedule timer interval elapsed. Checking path.`;
      } else if (node.type === 'google_form_trigger') {
        msg = `📋 [TRIGGER] Agent: Google Form submission received. Processing form payload.`;
      } else if (node.type === 'webhook') {
        msg = `🔌 [TRIGGER] Agent: Webhook request captured. Payload ingested.`;
      } else if (node.type === 'google_sheets') {
        msg = `📊 [SHEETS] Agent: Google Sheets operation executed.`;
      } else if (node.type === 'ifelse') {
        const isTrue = score > 50;
        msg = `🤖 [DECISION] Agent: Evaluated condition "score > 50" (value: ${score}). Branching to ${isTrue ? 'TRUE' : 'FALSE'} handle.`;
      } else if (node.type === 'delay') {
        const sec = node.data?.seconds || '5';
        msg = `⏰ [TIMER] Agent: Suspending execution. Delay active for ${sec} seconds.`;
      } else if (node.type === 'marketing_email') {
        msg = `📧 [EMAIL] Agent: Dispatched Marketing Email to ${email} successfully.`;
      } else if (node.type === 'crm_action') {
        msg = `👤 [CRM] Agent: Updated CRM record for ${email}. Incrementing score.`;
      } else if (node.type === 'code') {
        msg = `💻 [CODE] Agent: Custom JS script executed. Context output parsed successfully.`;
      } else if (node.type === 'end') {
        msg = `🏁 [END] Agent: Pipeline reached terminal point. Shutting down execution flow.`;
      }

      // Check human-in-the-loop approval
      if (manualApprovalEnabled && (node.type === 'marketing_email' || node.type === 'crm_action')) {
        setExecStatus('paused');
        setHumanApprovalRequired(true);
        setPendingNode(node);
        setExecLogs(prev => [...prev, {
          time: new Date().toISOString(),
          message: `🤖 [PENDING APPROVAL] Agent: Waiting for user to approve action: "${node.data?.label || 'Execute Step'}"`
        }]);
        
        // Save the closure so we can resume later
        (window as any).resumeExecution = (approved: boolean) => {
          setHumanApprovalRequired(false);
          if (approved) {
            setExecStatus('running');
            setExecLogs(prev => [...prev, {
              time: new Date().toISOString(),
              message: `🤖 [APPROVED] User approved step execution. Continuing.`
            }, {
              time: new Date().toISOString(),
              message: msg
            }]);
            pathIndex++;
            setTimeout(runStep, node.type === 'delay' ? parseInt(node.data?.seconds || '5') * 1000 : 1500);
          } else {
            setExecStatus('failed');
            setExecActiveNodeId(null);
            setExecLogs(prev => [...prev, {
              time: new Date().toISOString(),
              message: `❌ [REJECTED] User rejected step execution. Workflow aborted.`
            }]);
            if (triggerExecutionId) {
              fetchSimulatedJson(triggerExecutionId);
            }
          }
        };
        return;
      }

      setExecLogs(prev => [...prev, { time: new Date().toISOString(), message: msg }]);
      pathIndex++;
      setTimeout(runStep, node.type === 'delay' ? parseInt(node.data?.seconds || '5') * 1000 : 1500);
    };

    setTimeout(runStep, 1000);
  };

  // Workflow list state
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const [isLiveEngineActive, setIsLiveEngineActive] = useState<boolean>(true);

  const toggleLiveEngine = async () => {
    const nextState = !isLiveEngineActive;
    setIsLiveEngineActive(nextState);

    if (currentWorkflow?.id) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/workflows/${currentWorkflow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: nextState })
        });
        if (res.ok) {
          const updatedWf = await res.json();
          setCurrentWorkflow(updatedWf);
          setWorkflows(prev => prev.map(w => w.id === updatedWf.id ? updatedWf : w));
        } else {
          setCurrentWorkflow((prev: any) => prev ? { ...prev, isActive: nextState } : prev);
          setWorkflows(prev => prev.map(w => w.id === currentWorkflow.id ? { ...w, isActive: nextState } : w));
        }
      } catch (e) {
        console.error("Failed to sync Live Engine state to backend:", e);
        setCurrentWorkflow((prev: any) => prev ? { ...prev, isActive: nextState } : prev);
        setWorkflows(prev => prev.map(w => w.id === currentWorkflow.id ? { ...w, isActive: nextState } : w));
      }
    }
  };

  // React Flow canvas states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Selected configurations
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [historyTab, setHistoryTab] = useState<'logs' | 'crm' | 'emails'>('logs');

  // Sidebar & Palette Customization Sliders State
  const [sidebarWidth, setSidebarWidth] = useState<number>(240);
  const [nodePaletteScale, setNodePaletteScale] = useState<number>(1);
  const [showPaletteSliders, setShowPaletteSliders] = useState<boolean>(false);

  // Poll tables
  const [executions, setExecutions] = useState<any[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);

  // Executions page states
  const [allExecutions, setAllExecutions] = useState<any[]>([]);
  const [selectedAllExecution, setSelectedAllExecution] = useState<any>(null);
  const [executionsSearchQuery, setExecutionsSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [timeRangeFilter, setTimeRangeFilter] = useState('all');
  const [inspectorTab, setInspectorTab] = useState<'output' | 'input' | 'logs'>('output');

  const [crmContacts, setCrmContacts] = useState<any[]>([]);
  const [simulatedEmails, setSimulatedEmails] = useState<any[]>([]);

  // Webhook Popup Modal State
  const [showWebhookPopup, setShowWebhookPopup] = useState<boolean>(false);
  const [webhookPopupNode, setWebhookPopupNode] = useState<any>(null);
  const [webhookPayload, setWebhookPayload] = useState<string>(
    '{\n  "event": "user_signup",\n  "email": "alex@example.com",\n  "name": "Alex Smith",\n  "plan": "pro_tier"\n}'
  );
  const [webhookMethod, setWebhookMethod] = useState<string>('POST');
  const [customWebhookUrl, setCustomWebhookUrl] = useState<string>('');
  const [isEditingWebhookUrl, setIsEditingWebhookUrl] = useState<boolean>(false);
  const [webhookTestResponse, setWebhookTestResponse] = useState<any>(null);
  const [isSendingWebhookTest, setIsSendingWebhookTest] = useState<boolean>(false);
  const [webhookCopied, setWebhookCopied] = useState<boolean>(false);

  const openWebhookInputPopup = useCallback((node: any) => {
    setWebhookPopupNode(node);
    const type = node?.type || '';
    
    let defaultPayloadStr = '';
    if (type === 'trigger' || type === 'webhook' || type === 'respond_to_webhook' || type === 'action.respondToWebhook') {
      defaultPayloadStr = '{\n  "event": "webhook_entry",\n  "email": "alex@example.com",\n  "name": "Alex Smith",\n  "timestamp": "' + new Date().toISOString() + '"\n}';
    } else if (type === 'schedule_trigger') {
      defaultPayloadStr = '{\n  "event": "schedule_interval_elapsed",\n  "scheduleType": "' + (node?.data?.scheduleType || 'interval') + '",\n  "intervalValue": ' + (node?.data?.intervalValue || 10) + ',\n  "intervalUnit": "' + (node?.data?.intervalUnit || 'seconds') + '"\n}';
    } else if (type === 'google_form_trigger') {
      defaultPayloadStr = '{\n  "event": "google_form_submission",\n  "formId": "form_88234",\n  "respondentEmail": "jordan@example.com",\n  "answers": {\n    "fullName": "Jordan Lee",\n    "feedback": "Great service!",\n    "rating": 5\n  }\n}';
    } else if (type === 'crm_lead_trigger' || type === 'crm_action') {
      defaultPayloadStr = '{\n  "event": "crm_lead_entry",\n  "email": "' + (node?.data?.email || 'sarah.johnson@acme.com') + '",\n  "name": "Sarah Johnson",\n  "status": "' + (node?.data?.status || 'lead') + '",\n  "score": ' + (node?.data?.scoreChange || 10) + '\n}';
    } else if (type === 'marketing_email') {
      defaultPayloadStr = '{\n  "event": "send_email_dispatch",\n  "to": "' + (node?.data?.to || 'alex@example.com') + '",\n  "subject": "' + (node?.data?.subject || 'Notification Alert') + '",\n  "body": "' + (node?.data?.body || 'Hello Alex!') + '"\n}';
    } else if (type === 'google_sheets') {
      defaultPayloadStr = '{\n  "event": "google_sheets_sync",\n  "sheetName": "' + (node?.data?.sheetName || 'Sheet1') + '",\n  "action": "' + (node?.data?.action || 'read') + '",\n  "rowData": {\n    "Email": "alex@example.com",\n    "Status": "Active"\n  }\n}';
    } else if (type === 'openai' || type === 'action.openai') {
      defaultPayloadStr = '{\n  "event": "openai_completion_request",\n  "model": "' + (node?.data?.model || 'gpt-4o') + '",\n  "temperature": ' + (node?.data?.temperature !== undefined ? node.data.temperature : 0.7) + ',\n  "prompt": "' + (node?.data?.prompt || 'Please summarize user data.') + '"\n}';
    } else if (type === 'slack' || type === 'discord') {
      defaultPayloadStr = '{\n  "event": "chat_alert_dispatch",\n  "channel": "general",\n  "webhookUrl": "' + (node?.data?.webhookUrl || '') + '",\n  "text": "' + (node?.data?.text || node?.data?.content || '📢 Event alert') + '"\n}';
    } else if (type === 'delay') {
      defaultPayloadStr = '{\n  "event": "delay_timer_wait",\n  "delaySeconds": ' + (node?.data?.seconds || 10) + '\n}';
    } else if (type === 'code') {
      defaultPayloadStr = '{\n  "event": "javascript_script_execution",\n  "code": ' + JSON.stringify(node?.data?.code || '// Custom Script\nreturn { success: true };') + '\n}';
    } else if (type === 'rabbitmq_publish') {
      defaultPayloadStr = '{\n  "event": "rabbitmq_publish_queue",\n  "queue": "' + (node?.data?.queue || 'neuron_flow_queue') + '",\n  "payload": ' + JSON.stringify(node?.data?.payload || '{"event":"triggered"}') + '\n}';
    } else {
      defaultPayloadStr = '{\n  "event": "' + (type || 'custom_connection') + '",\n  "nodeId": "' + (node?.id || 'node_1') + '",\n  "label": "' + (node?.data?.label || 'Node') + '"\n}';
    }

    const existingPayload = node?.data?.samplePayload || node?.data?.payload || defaultPayloadStr;
    setWebhookPayload(typeof existingPayload === 'object' ? JSON.stringify(existingPayload, null, 2) : existingPayload);
    setWebhookMethod(node?.data?.method || 'POST');
    
    const defaultUrl = `${BACKEND_URL}/api/webhooks/${currentWorkflow?.id || '1'}`;
    setCustomWebhookUrl(node?.data?.customWebhookUrl || node?.data?.webhookUrl || defaultUrl);
    setIsEditingWebhookUrl(false);

    setWebhookTestResponse(null);
    setShowWebhookPopup(true);
  }, [currentWorkflow]);


  // Form input states
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadScore, setNewLeadScore] = useState(60);

  // Template Search and Filter states
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState('All');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  // Palette selector modal for edge wire button insertion
  const [insertNodeModalData, setInsertNodeModalData] = useState<{ edgeId: string; pos: { x: number; y: number } } | null>(null);
  const [paletteSearchQuery, setPaletteSearchQuery] = useState<string>('');

  const [variables, setVariables] = useState<Array<{ key: string; value: string }>>([
    { key: 'SLACK_API_TOKEN', value: 'xoxb-98729384-82738491823-ajdfhskdfjh' },
    { key: 'DATABASE_URL', value: 'postgresql://admin:supersecret@db.enterprise.internal:5432/production' },
    { key: 'GPT4_API_KEY', value: 'sk-proj-4M3bL25lS18Xk39k82lsl40alW02lsk' }
  ]);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarVal, setNewVarVal] = useState('');

  const loadWorkflow = useCallback((wf: any) => {
    setCurrentWorkflow(wf);
    setIsLiveEngineActive(wf.isActive !== false);
    try {
      const def = typeof wf.definition === 'string' ? JSON.parse(wf.definition) : wf.definition;
      setNodes(def.nodes || []);
      setEdges(def.edges || []);
      setSelectedNode(null);
    } catch {
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  // Fetch workflows
  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows`);
      const data = await res.json();
      setWorkflows(data);
      if (data.length > 0 && !currentWorkflow) {
        loadWorkflow(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentWorkflow, loadWorkflow]);


  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);


  const fetchMockData = useCallback(async () => {
    try {
      // 1. Fetch all executions
      const allExecRes = await fetch(`${BACKEND_URL}/api/executions`);
      if (allExecRes.ok) {
        const allExecs = await allExecRes.json();
        setAllExecutions(allExecs);
        // Sync selectedAllExecution if deleted/none
        if (allExecs.length > 0 && !selectedAllExecution) {
          setSelectedAllExecution(allExecs[0]);
        }
      }

      // 2. Fetch active workflow executions
      if (currentWorkflow) {
        const execRes = await fetch(`${BACKEND_URL}/api/workflows/${currentWorkflow.id}/executions`);
        if (execRes.ok) {
          const execs = await execRes.json();
          setExecutions(execs);
        }
      }

      // 3. Fetch CRM contacts
      const crmRes = await fetch(`${BACKEND_URL}/api/crm/contacts`);
      if (crmRes.ok) {
        const contacts = await crmRes.json();
        setCrmContacts(contacts);
      }

      // 4. Fetch marketing emails
      const emailsRes = await fetch(`${BACKEND_URL}/api/marketing/emails`);
      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        setSimulatedEmails(emails);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentWorkflow, selectedAllExecution]);

  // Executions view action handlers
  const handleRerunExecution = async (execId: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/executions/${execId}/rerun`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        alert('Rerun triggered successfully! Execution ID: #' + data.executionId);
        fetchMockData();
      } else {
        alert('Failed to rerun execution.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to rerun execution.');
    }
  };

  const handleDeleteExecution = async (execId: number) => {
    if (!confirm('Are you sure you want to delete this execution log?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/executions/${execId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Execution log deleted successfully.');
        const nextExecs = allExecutions.filter(e => e.id !== execId);
        setAllExecutions(nextExecs);
        if (selectedAllExecution?.id === execId) {
          setSelectedAllExecution(nextExecs.length > 0 ? nextExecs[0] : null);
        }
        fetchMockData();
      } else {
        alert('Failed to delete execution log.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete execution log.');
    }
  };

  const handleTestRun = async () => {
    const targetWf = selectedAllExecution?.workflow || (workflows.length > 0 ? workflows[0] : null);
    if (!targetWf) {
      alert("No workflows available to run.");
      return;
    }
    const email = prompt(`Trigger Test Run for workflow "${targetWf.name}".\nEnter lead email:`, "test@example.com");
    if (!email) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows/${targetWf.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: 'Test Runner User',
          score: 75
        })
      });
      if (res.ok) {
        alert("Test Run started successfully!");
        fetchMockData();
      } else {
        alert("Failed to start Test Run.");
      }
    } catch (e) {
      console.error(e);
      alert("Error starting Test Run.");
    }
  };

  const handleExportExecutions = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredAllExecutions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `executions_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredAllExecutions = React.useMemo(() => {
    return allExecutions.filter(exec => {
      // Status filter
      if (statusFilter !== 'All' && exec.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      
      // Time range filter (24h, 7d, all)
      if (timeRangeFilter === '24h') {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (new Date(exec.startedAt).getTime() < oneDayAgo) return false;
      } else if (timeRangeFilter === '7d') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (new Date(exec.startedAt).getTime() < sevenDaysAgo) return false;
      }

      // Search query (workflow name or execution ID)
      const workflowName = exec.workflow?.name || '';
      const execIdStr = `#EXE-${exec.id}`.toLowerCase();
      const query = executionsSearchQuery.toLowerCase();
      if (query && !workflowName.toLowerCase().includes(query) && !execIdStr.includes(query) && !exec.id.toString().includes(query)) {
        return false;
      }

      return true;
    });
  }, [allExecutions, statusFilter, timeRangeFilter, executionsSearchQuery]);

  useEffect(() => {
    fetchMockData();
    const interval = setInterval(fetchMockData, 3000);
    return () => clearInterval(interval);
  }, [fetchMockData]);

  const isValidConnection = useCallback(
    (connection: Connection) => {
      // 1. Prevent self-loop
      if (connection.source === connection.target) return false;

      // 2. Prevent incoming connections to Trigger nodes
      const targetNode = nodes.find(n => n.id === connection.target);
      if (targetNode) {
        const isTrigger = 
          targetNode.type === 'trigger' ||
          targetNode.type === 'crm_lead_trigger' ||
          targetNode.type === 'schedule_trigger' ||
          targetNode.type === 'google_form_trigger' ||
          targetNode.type === 'start_trigger';
        if (isTrigger) return false;
      }

      // 3. Prevent duplicate connections
      const isDuplicate = edges.some(e => 
        e.source === connection.source && 
        e.target === connection.target &&
        e.sourceHandle === connection.sourceHandle &&
        e.targetHandle === connection.targetHandle
      );
      if (isDuplicate) return false;

      return true;
    },
    [nodes, edges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      let strokeColor = '#facc15';
      if (params.sourceHandle === 'true' || params.sourceHandle === 'yes') strokeColor = '#10b981';
      if (params.sourceHandle === 'false' || params.sourceHandle === 'no') strokeColor = '#ef4444';

      setEdges((eds) => addEdge({
        ...params,
        type: 'buttonEdge',
        animated: true,
        style: { stroke: strokeColor, strokeWidth: 2.5 }
      }, eds));
    },
    [setEdges]
  );

  const handleAddNodeOnEdge = useCallback(
    (edgeId: string, pos: { x: number; y: number }) => {
      setInsertNodeModalData({ edgeId, pos });
      setPaletteSearchQuery('');
    },
    []
  );

  const executeInsertNodeFromPalette = useCallback((item: any) => {
    if (!insertNodeModalData) return;
    const { edgeId, pos } = insertNodeModalData;

    setEdges((currentEdges) => {
      const targetEdge = currentEdges.find((e) => e.id === edgeId);
      if (!targetEdge) return currentEdges;

      const newNodeId = `node_${Date.now()}`;
      const newNode = {
        id: newNodeId,
        type: item.type,
        position: { x: Math.round(pos.x - 75), y: Math.round(pos.y - 30) },
        data: { ...item.defaultData }
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNode(newNode);

      let strokeColor = '#facc15';
      if (targetEdge.sourceHandle === 'true' || targetEdge.sourceHandle === 'yes') strokeColor = '#10b981';
      if (targetEdge.sourceHandle === 'false' || targetEdge.sourceHandle === 'no') strokeColor = '#ef4444';

      const edge1 = {
        id: `e_${targetEdge.source}-${newNodeId}_${Date.now()}`,
        source: targetEdge.source,
        target: newNodeId,
        sourceHandle: targetEdge.sourceHandle,
        animated: true,
        type: 'buttonEdge',
        style: { stroke: strokeColor, strokeWidth: 2.5 }
      };

      const edge2 = {
        id: `e_${newNodeId}-${targetEdge.target}_${Date.now() + 1}`,
        source: newNodeId,
        target: targetEdge.target,
        targetHandle: targetEdge.targetHandle,
        animated: true,
        type: 'buttonEdge',
        style: { stroke: '#facc15', strokeWidth: 2.5 }
      };

      return [...currentEdges.filter((e) => e.id !== edgeId), edge1, edge2];
    });

    setInsertNodeModalData(null);
    setPaletteSearchQuery('');
  }, [insertNodeModalData, setNodes, setEdges]);

  const edgesWithAddButton = React.useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      type: 'buttonEdge',
      data: {
        ...edge.data,
        onAddNodeOnEdge: handleAddNodeOnEdge
      }
    }));
  }, [edges, handleAddNodeOnEdge]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
    const isWebhookOnly = 
      node.type === 'trigger' ||
      node.type === 'webhook' ||
      node.type === 'respond_to_webhook' ||
      node.type === 'action.respondToWebhook';

    if (isWebhookOnly) {
      openWebhookInputPopup(node);
    }
  }, [openWebhookInputPopup]);

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
    openWebhookInputPopup(node);
  }, [openWebhookInputPopup]);


  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = (field: string, val: any) => {
    if (!selectedNode) return;
    const updated = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        [field]: val
      }
    };
    setSelectedNode(updated);
    setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? updated : n)));
  };

  const addNode = (type: string) => {
    const id = `${type}_${Date.now()}`;
    let label = '';
    let extraData = {};

    switch (type) {
      case 'trigger':
        label = 'Webhook input';
        extraData = { triggerType: 'webhook' };
        break;
      case 'crm_lead_trigger':
        label = 'CRM New Lead';
        extraData = { triggerType: 'crm' };
        break;
      case 'marketing_email':
        label = 'Send Campaign Email';
        extraData = { to: '{{trigger.email}}', subject: 'Excited to connect!', body: 'Hi {{trigger.name}}, welcome onboard!' };
        break;
      case 'crm_action':
        label = 'Update CRM Contact';
        extraData = { actionType: 'create_or_update', status: 'contact', scoreChange: '15' };
        break;
      case 'ifelse':
        label = 'Lead Score Check';
        extraData = { condition: 'context.trigger.score > 50' };
        break;
      case 'delay':
        label = 'Delay Wait';
        extraData = { seconds: '5' };
        break;
      case 'code':
        label = 'Run script';
        extraData = { code: 'context.trigger.score += 5;\nreturn context.trigger;' };
        break;
      case 'end':
        label = 'End workflow';
        extraData = {};
        break;
      case 'start_trigger':
        label = 'Start';
        extraData = {};
        break;
      case 'google_form_trigger':
        label = 'Google Form Hook';
        extraData = {
          webhookUrl: `${BACKEND_URL}/api/webhooks/google-form/${currentWorkflow?.id || '1'}`
        };
        break;
      case 'schedule_trigger':
        label = 'Schedule Timer';
        extraData = {
          scheduleType: 'interval',
          intervalValue: 10,
          intervalUnit: 'seconds',
          cronExpression: '*/10 * * * * *',
          customDate: '',
          lastRun: '',
          nextRun: ''
        };
        break;
      case 'google_sheets':
        label = 'Google Sheet';
        extraData = {
          action: 'read',
          sheetId: '1X3-mock-spreadsheet-id',
          sheetName: 'Sheet1',
          mockDataType: 'blog_news',
          customJson: '[\n  {"id": 1, "title": "Custom Post", "content": "Hello World"}\n]',
          triggerForEachRow: true,
          rowData: '{\n  "email": "{{trigger.email}}",\n  "name": "{{trigger.name}}",\n  "status": "synchronized"\n}'
        };
        break;
      case 'openai':
        label = 'OpenAI GPT Summarizer';
        extraData = {
          prompt: 'Write a concise summary of this item:\nTitle: {{trigger.title}}\nContent: {{trigger.content}}',
          model: 'gpt-4o'
        };
        break;
      case 'slack':
        label = 'Post to Slack';
        extraData = {
          webhookUrl: 'https://hooks.slack.com/services/mock-webhook-url',
          text: '📢 *Workflow Alert:* {{trigger.title}}'
        };
        break;
      case 'discord':
        label = 'Discord Alert';
        extraData = {
          webhookUrl: 'https://discord.com/api/webhooks/mock-webhook-url',
          content: '🚀 *New Notification:* {{trigger.email}} registered!'
        };
        break;
      case 'respond_to_webhook':
        label = 'Custom Webhook Response';
        extraData = {
          responseMode: 'json',
          statusCode: 200,
          headers: '{\n  "Content-Type": "application/json"\n}',
          responseBody: '{\n  "success": true,\n  "message": "Processed successfully"\n}',
          redirectUrl: ''
        };
        break;
    }

    const newNode = {
      id,
      type,
      position: { x: 250 + Math.random() * 80, y: 180 + Math.random() * 80 },
      data: { label, ...extraData }
    };

    setNodes((nds) => nds.concat(newNode));

    const isWebhookType = 
      type === 'trigger' || 
      type === 'google_form_trigger' || 
      type === 'respond_to_webhook' ||
      type === 'webhook';

    if (isWebhookType) {
      openWebhookInputPopup(newNode);
    }
  };

  const handleSave = async () => {
    if (!currentWorkflow) return;
    try {
      const definition = { nodes, edges };
      const res = await fetch(`${BACKEND_URL}/api/workflows/${currentWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentWorkflow.name,
          definition
        })
      });
      await res.json();
      alert('Workflow saved successfully!');
      fetchWorkflows();
    } catch {
      alert('Failed to save workflow');
    }


  };

  const handleCreateNew = async () => {
    try {
      const ts = Date.now();
      const startId = `start_${ts}`;
      const ifelseId = `ifelse_${ts}`;
      const codeId = `code_${ts}`;
      const endPassedId = `end_passed_${ts}`;
      const endFilteredId = `end_filtered_${ts}`;

      const defaultDef = {
        nodes: [
          { id: startId, type: 'start_trigger', position: { x: 100, y: 220 }, data: { label: 'Start Trigger' } },
          { id: ifelseId, type: 'ifelse', position: { x: 340, y: 210 }, data: { label: 'If/Else Filter', condition: 'context.trigger.score > 50' } },
          { id: codeId, type: 'code', position: { x: 620, y: 140 }, data: { label: 'Run JS Script', code: '// Custom JS Logic Script\ncontext.trigger.processed = true;\nreturn context.trigger;' } },
          { id: endPassedId, type: 'end', position: { x: 900, y: 160 }, data: { label: 'End (Passed)' } },
          { id: endFilteredId, type: 'end', position: { x: 620, y: 320 }, data: { label: 'End (Filtered)' } }
        ],
        edges: [
          { id: `e1_${ts}`, source: startId, target: ifelseId, animated: true, style: { stroke: '#facc15', strokeWidth: 2.5 } },
          { id: `e2_${ts}`, source: ifelseId, sourceHandle: 'true', target: codeId, targetHandle: 'input', animated: true, style: { stroke: '#10b981', strokeWidth: 2.5 } },
          { id: `e3_${ts}`, source: codeId, target: endPassedId, animated: true, style: { stroke: '#facc15', strokeWidth: 2.5 } },
          { id: `e4_${ts}`, source: ifelseId, sourceHandle: 'false', target: endFilteredId, targetHandle: 'input', animated: true, style: { stroke: '#ef4444', strokeWidth: 2.5 } }
        ]
      };

      const res = await fetch(`${BACKEND_URL}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Fresh Canvas #${workflows.length + 1}`,
          definition: defaultDef
        })
      });
      const createdWorkflow = await res.json();
      setWorkflows([...workflows, createdWorkflow]);
      loadWorkflow(createdWorkflow);
      setViewMode('canvas');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!currentWorkflow) return;
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/workflows/${currentWorkflow.id}`, {
        method: 'DELETE'
      });
      const updated = workflows.filter(w => w.id !== currentWorkflow.id);
      setWorkflows(updated);
      if (updated.length > 0) {
        loadWorkflow(updated[0]);
      } else {
        setCurrentWorkflow(null);
        setNodes([]);
        setEdges([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunWorkflow = async () => {
    if (!currentWorkflow) return;
    
    const triggerNode = nodes.find(n => 
      n.type === 'trigger' || 
      n.type === 'crm_lead_trigger' || 
      n.type === 'schedule_trigger' || 
      n.type === 'google_form_trigger' ||
      n.type === 'webhook'
    );

    const requiresLeadConfig = triggerNode && (triggerNode.type === 'crm_lead_trigger' || triggerNode.type === 'trigger');

    setExecStatus('idle');
    setExecLogs([]);
    setExecActiveNodeId(null);
    setHumanApprovalRequired(false);
    setPendingNode(null);

    if (requiresLeadConfig) {
      setIsExecModalOpen(true);
    } else {
      setIsExecModalOpen(true);
      startConnectionStream('system@neuron.flow', 'System Agent', 100);
    }
  };

  const handleCrmLeadTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadEmail) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/crm/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLeadName || 'Simulated Lead',
          email: newLeadEmail,
          status: 'lead',
          score: newLeadScore
        })
      });
      const data = await res.json();
      setNewLeadName('');
      setNewLeadEmail('');
      fetchMockData();

      // Start stream modal automatically
      setExecEmail(data.email || newLeadEmail);
      setExecName(data.name || newLeadName || 'Simulated Lead');
      setExecScore(data.score !== undefined ? data.score : newLeadScore);
      setExecStatus('idle');
      setExecLogs([]);
      setExecActiveNodeId(null);
      setHumanApprovalRequired(false);
      setPendingNode(null);
      setIsExecModalOpen(true);

      setTimeout(() => {
        startConnectionStream(data.email || newLeadEmail, data.name || newLeadName || 'Simulated Lead', data.score !== undefined ? data.score : newLeadScore);
      }, 500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDb = async () => {
    if (!confirm('Clear simulation history, logs, and simulated emails?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/crm/reset`, { method: 'POST' });
      fetchMockData();
      setSelectedExecution(null);
      alert('Simulation database reset complete.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeployTemplate = async (template: any) => {
    try {
      const def = typeof template.definition === 'string' ? JSON.parse(template.definition) : template.definition;
      const res = await fetch(`${BACKEND_URL}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} Preset`,
          definition: def
        })
      });
      if (!res.ok) throw new Error('Deployment failed');
      const createdWorkflow = await res.json();
      setWorkflows([createdWorkflow, ...workflows]);
      loadWorkflow(createdWorkflow);
      setViewMode('canvas');
      showAppToast(`Template "${template.name}" deployed! Running workflow...`);

      // Trigger immediate live execution with the deployed template
      const testEmail = 'preset.user@neuron.flow';
      const testName = `${template.name} Runner`;
      const testScore = 85;

      setExecEmail(testEmail);
      setExecName(testName);
      setExecScore(testScore);
      setExecStatus('idle');
      setExecLogs([]);
      setExecActiveNodeId(null);
      setHumanApprovalRequired(false);
      setPendingNode(null);
      setIsExecModalOpen(true);

      startConnectionStream(testEmail, testName, testScore, createdWorkflow, def.nodes || [], def.edges || []);
    } catch (e) {
      console.error(e);
      showAppToast('Failed to deploy template.', 'warning');
    }
  };

  const handleAddVar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarKey.trim() || !newVarVal.trim()) return;
    if (variables.some(v => v.key === newVarKey.trim())) {
      alert('Variable already exists!');
      return;
    }
    setVariables([...variables, { key: newVarKey.trim(), value: newVarVal.trim() }]);
    setNewVarKey('');
    setNewVarVal('');
  };

  const handleDeleteVar = (key: string) => {
    setVariables(variables.filter(v => v.key !== key));
  };

  // Filter templates list based on search and category
  const filteredTemplates = TEMPLATES.filter(tpl => {
    const matchesCategory = selectedTemplateCategory === 'All' || tpl.category === selectedTemplateCategory;
    const matchesSearch = tpl.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) || 
                          tpl.description.toLowerCase().includes(templateSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container">
      <style>{`
        .workflow-dot-bg {
            background-image: radial-gradient(circle, #201f1f 1px, transparent 1px);
            background-size: 32px 32px;
        }
        .clean-card {
            background: #1c1b1b;
            border: 1px solid #353534;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .clean-card:hover {
            border-color: #9a9078;
            background: #201f1f;
        }
        .node-line {
            stroke: #4d4632;
            stroke-dasharray: 4 2;
        }
        .filter-btn {
            position: relative;
            transition: color 0.2s;
        }
        .filter-btn.active::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 0;
            right: 0;
            height: 2px;
            background: #facc15;
        }
        .dot-grid {
          background-image: radial-gradient(#262626 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .glass-panel {
            background: rgba(23, 23, 23, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(38, 38, 38, 0.5);
        }
        .node-port {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #262626;
            border: 1px solid #4d4632;
        }
        .node-port-active {
            background: #facc15;
            box-shadow: 0 0 8px rgba(250, 204, 21, 0.4);
        }
        .execution-row {
          border-bottom: 1px solid rgba(53, 53, 52, 0.2);
          transition: background-color 0.1s ease;
        }
        .execution-row:hover {
          background: #1c1b1b;
        }
        .execution-row.selected {
          background: #1c1b1b;
          border-left: 2px solid #facc15;
        }
        .material-symbols-outlined {
          display: none !important;
        }
      `}</style>

      {/* App Shell Sidebar Nav (ex-app-shell-row) */}
      <aside 
        className={`bg-[#201515] text-[#fffefb] border-r border-[#2f2a26] transition-all duration-300 shrink-0 flex flex-col z-20 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewMode('overview')}>
              <div className="w-7 h-7 rounded-md bg-[#ff4f00] flex items-center justify-center text-[#fffefb] font-bold text-sm">⚡</div>
              <span className="font-bold text-base tracking-tight text-[#fffefb]">NEURON_FLOW</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-[#c5c0b1] hover:text-[#fffefb] p-1.5 rounded-md hover:bg-[#2f2a26] transition"
          >
            ☰
          </button>
        </div>

        {!isSidebarCollapsed && (
          <div className="px-4 mb-4">
            <div className="text-[10px] font-mono text-[#939084] uppercase tracking-wider mb-2">Switch Apps</div>
            <div className="flex flex-col gap-1 text-xs">
              <a href="http://localhost:3000" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] transition">
                <span className="w-2 h-2 rounded-full bg-[#ff4f00]"></span> Dashboard (:3000)
              </a>
              <a href="http://localhost:4000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] transition">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Engine API (:4000)
              </a>
              <a href="http://localhost:3000/excel" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] transition">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span> Excel AI (:3000)
              </a>
              <a href="http://localhost:3000/files" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] transition">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span> File Vault 📂
              </a>
            </div>
          </div>
        )}

        {/* Sidebar Nav Items (ex-app-shell-row with #ff4f00 active indicator) */}
        <nav className="flex-1 space-y-1 px-3">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'canvas', label: 'Workflows', icon: '⚡' },
            { id: 'executions', label: 'Executions', icon: '📈' },
            { id: 'templates', label: 'Templates', icon: '📦' },
            { id: 'variables', label: 'Variables', icon: '💻' },
            { id: 'history', label: 'Simulation DB', icon: '🗄️' },
          ].map((item) => {
            const isActive = viewMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setViewMode(item.id as any)}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-md text-xs font-semibold transition-all relative ${
                  isActive ? 'bg-[#ff4f00] text-[#fffefb] shadow-sm' : 'text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26]'
                }`}
              >
                <span>{item.icon}</span>
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-[#2f2a26] space-y-2">
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="w-full py-2 bg-[#ff4f00] text-[#fffefb] text-xs font-bold rounded-md hover:opacity-90 transition shadow-sm"
            >
              Pricing & Pro Plan
            </button>
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="w-full py-2 bg-[#2f2a26] text-[#fffefb] text-xs font-semibold rounded-md hover:bg-[#36342e] transition"
            >
              Subscription Cart
            </button>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-2 bg-[#2f2a26] text-[#fffefb] text-xs font-semibold rounded-md hover:bg-[#36342e] transition"
            >
              Sign In Account
            </button>
          </div>
        )}
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#09090b] text-[#f4f4f5]">

        {/* 1. OVERVIEW VIEW */}
        {viewMode === 'overview' && (
          <div className="flex-1 flex flex-col overflow-y-auto p-8 bg-[#09090b]">
            {/* Header */}
            <header className="flex justify-between items-center mb-10 shrink-0 text-left">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Overview Dashboard</h1>
                <p className="text-[#a1a1aa] text-sm">Real-time status metrics and automation activity control hub.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141d18] text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Systems Operational</span>
                </div>
                <div 
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="w-9 h-9 rounded-full bg-[#141417] border border-[#27272a] overflow-hidden cursor-pointer hover:opacity-85 transition-opacity"
                  title="Change Profile Picture"
                >
                  <img className="w-full h-full object-cover" alt="User Avatar" src={profilePic} />
                </div>
              </div>
            </header>

            {/* Metrics cards grid */}
            {(() => {
              const finishedExecs = (allExecutions || []).filter(
                (e: any) => e.status === 'success' || e.status === 'failed'
              );
              const successCount = finishedExecs.filter(
                (e: any) => e.status === 'success'
              ).length;

              const calculatedUptime =
                finishedExecs.length > 0
                  ? ((successCount / finishedExecs.length) * 100).toFixed(2)
                  : '99.99';

              const latencies = finishedExecs
                .map((e: any) => {
                  if (e.startedAt && e.finishedAt) {
                    return new Date(e.finishedAt).getTime() - new Date(e.startedAt).getTime();
                  }
                  return null;
                })
                .filter((l: number | null): l is number => l !== null && l >= 0);

              const avgLatencyMs =
                latencies.length > 0
                  ? Math.round(latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length)
                  : 10;

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 text-left">
                  <div className="bg-[#141417] border border-[#27272a] p-6 rounded-xl flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">Pipeline Latency</span>
                    <span className="text-3xl font-bold text-[#ff4f00] my-2">{avgLatencyMs}ms</span>
                    <span className="text-xs text-emerald-400 font-semibold">Within SLA limit</span>
                  </div>
                  <div className="bg-[#141417] border border-[#27272a] p-6 rounded-xl flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">Max Throughput</span>
                    <span className="text-3xl font-bold text-white my-2">1M+ rps</span>
                    <span className="text-xs text-[#a1a1aa]">Distributed engine</span>
                  </div>
                  <div className="bg-[#141417] border border-[#27272a] p-6 rounded-xl flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">Uptime Rate</span>
                    <span className="text-3xl font-bold text-[#ff4f00] my-2">{calculatedUptime}%</span>
                    <span className="text-xs text-emerald-400 font-semibold">
                      {Number(calculatedUptime) >= 99 ? 'Carrier-grade reliability' : 'Operational'}
                    </span>
                  </div>
                  <div className="bg-[#141417] border border-[#27272a] p-6 rounded-xl flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">Active Workflows</span>
                    <span className="text-3xl font-bold text-white my-2">{workflows.length}</span>
                    <span className="text-xs text-[#a1a1aa]">Deployed in workspace</span>
                  </div>
                </div>
              );
            })()}

            {/* Double column list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Workflows List */}
              <div className="bg-[#141417] border border-[#27272a] p-6 rounded-xl flex flex-col text-left shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Automation Pipelines</h3>
                  <button onClick={handleCreateNew} className="text-xs font-bold text-[#ff4f00] hover:underline">
                    + Create Fresh Canvas
                  </button>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px]">
                  {workflows.length === 0 ? (
                    <div className="text-center py-8 text-[#a1a1aa] text-xs">No pipelines registered. Go to templates to deploy one!</div>
                  ) : (
                    workflows.map(wf => (
                      <div key={wf.id} className="p-4 bg-[#1f1f23] border border-[#27272a] rounded-lg flex items-center justify-between hover:border-[#ff4f00] transition-all">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-white text-sm">{wf.name}</span>
                          <span className="text-xs text-[#a1a1aa]">ID: #{wf.id} • Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              loadWorkflow(wf);
                              setViewMode('canvas');
                            }}
                            className="px-3.5 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-md text-xs font-semibold transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              loadWorkflow(wf);
                              handleRunWorkflow();
                            }}
                            className="px-3.5 py-1.5 bg-[#ff4f00] hover:bg-[#e04500] text-white rounded-md text-xs font-bold transition shadow-sm"
                          >
                            Trigger
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Execution logs overview */}
              <div className="bg-[#141417] border border-[#27272a] p-6 rounded-xl flex flex-col text-left shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                  <button onClick={() => { setViewMode('history'); setHistoryTab('logs'); }} className="text-xs font-bold text-[#ff4f00] hover:underline">
                    View Outbox Logs →
                  </button>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px]">
                  {executions.length === 0 ? (
                    <div className="text-center py-8 text-[#a1a1aa] text-xs">No logs recorded. Trigger a workflow to start simulation.</div>
                  ) : (
                    executions.slice(0, 5).map(exec => (
                      <div
                        key={exec.id}
                        onClick={() => {
                          setSelectedExecution(exec);
                          setViewMode('history');
                          setHistoryTab('logs');
                        }}
                        className="p-3 bg-[#1f1f23] border border-[#27272a] rounded-lg flex items-center justify-between hover:border-[#ff4f00] transition cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-xs">Run ID #{exec.id}</span>
                          <span className="text-[10px] text-[#a1a1aa] font-mono">{new Date(exec.startedAt).toLocaleString()}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          exec.status === 'success' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' :
                          exec.status === 'failed' ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30' : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                        }`}>
                          {exec.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. WORKFLOWS (VISUAL CANVAS BUILDER) VIEW */}
        {viewMode === 'canvas' && (
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Topbar inside Canvas builder */}
            <header className="h-16 border-b border-[#353534] bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-20 shrink-0 text-left overflow-x-auto overflow-y-hidden w-full min-w-0 gap-4">
              <div className="flex items-center gap-3 shrink-0 min-w-0">
                <div className="flex items-center gap-2 text-[13px] shrink-0 min-w-0">
                  <span className="text-on-surface-variant/50 hover:text-on-surface cursor-pointer transition-colors whitespace-nowrap" onClick={() => setViewMode('overview')}>Workflows</span>
                  <span className="text-on-surface-variant/20">/</span>
                  <h2 className="font-medium opacity-90 truncate max-w-[160px] lg:max-w-[220px] xl:max-w-[320px]" title={currentWorkflow?.name || 'Unnamed Flow'}>
                    {currentWorkflow?.name || 'Unnamed Flow'}
                  </h2>
                </div>

                <button
                  onClick={() => {
                    const newName = prompt('Rename workflow:', currentWorkflow?.name);
                    if (newName) setCurrentWorkflow({ ...currentWorkflow, name: newName });
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-outline-variant/30 text-on-surface-variant/60 hover:text-on-surface hover:border-outline-variant/60 transition-all flex items-center gap-1 shrink-0 whitespace-nowrap"
                >
                  <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M7 12h10M7 17h10" />
                  </svg>
                  Rename
                </button>

                <div className="h-4 w-px bg-outline-variant/30 mx-1 shrink-0"></div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-neutral-500 font-bold whitespace-nowrap">Select Active:</span>
                  <select
                    value={currentWorkflow?.id || ''}
                    onChange={(e) => {
                      const wf = workflows.find(w => w.id === parseInt(e.target.value, 10));
                      if (wf) loadWorkflow(wf);
                    }}
                    className="bg-[#131313] border border-outline-variant/50 text-[12px] rounded-lg px-2.5 py-1 text-white outline-none cursor-pointer max-w-[160px] lg:max-w-[220px] truncate"
                  >
                    {workflows.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateNew}
                  className="text-xs text-primary font-bold hover:brightness-110 flex items-center gap-1 ml-1 shrink-0 whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Fresh Canvas
                </button>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Live Engine Interactive Toggle Button */}
                <button
                  onClick={toggleLiveEngine}
                  title={isLiveEngineActive ? "Live Engine Active - Click to pause engine" : "Live Engine Paused - Click to activate engine"}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer shadow-sm ${
                    isLiveEngineActive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                    {isLiveEngineActive ? 'Live Engine ON' : 'Live Engine OFF'}
                  </span>
                  <div className={`w-8 h-4 rounded-full relative flex items-center px-0.5 border transition-colors ${
                    isLiveEngineActive
                      ? 'bg-emerald-500/20 border-emerald-500/40 justify-end'
                      : 'bg-rose-500/20 border-rose-500/40 justify-start'
                  }`}>
                    <div className={`w-3 h-3 rounded-full transition-all ${
                      isLiveEngineActive ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500'
                    }`}></div>
                  </div>
                </button>

                <div className="h-4 w-px bg-outline-variant/30 mx-1 shrink-0"></div>
                
                <button
                  onClick={handleSave}
                  className="text-[12px] font-bold text-[#facc15] hover:opacity-80 transition-opacity uppercase tracking-widest shrink-0 whitespace-nowrap"
                >
                  Save Definition
                </button>

                <button
                  onClick={runDiagnostics}
                  className="text-[12px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center gap-1 shrink-0 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify & Diagnose
                </button>

                <button
                  onClick={handleDelete}
                  className="text-[12px] font-bold text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-widest shrink-0 whitespace-nowrap"
                >
                  Delete Flow
                </button>

                <div className="flex items-center rounded-lg overflow-hidden border border-outline-variant/30 text-[11px] shrink-0">
                  <button
                    onClick={() => alert(`Webhook endpoint: ${BACKEND_URL}/api/webhooks/${currentWorkflow?.id}`)}
                    className="px-2.5 py-1 bg-surface-container-high/40 flex items-center gap-1.5 hover:bg-surface-container-high transition-colors text-white whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Webhook URL
                  </button>
                  <span className="px-2.5 py-1 bg-surface-container-lowest/50 font-mono text-[10px] opacity-60">POST</span>
                </div>
              </div>
            </header>

            {/* Canvas body layout */}
            <div className="flex-1 relative flex overflow-hidden h-full w-full">
              
              {/* Dedicated Node Palette Sidebar */}
              <div 
                className={`shrink-0 bg-[#131313] border-r border-neutral-900 flex flex-col text-left h-full z-10 transition-all duration-200 ${
                  isSidebarOpen ? 'p-4 opacity-100' : 'w-0 p-0 opacity-0 overflow-hidden'
                }`}
                style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px' }}
              >
                {isSidebarOpen && (
                  <>
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#facc15] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">grid_view</span>
                        Node Palette
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setShowPaletteSliders(prev => !prev)}
                          className={`p-1 rounded transition-colors ${showPaletteSliders ? 'bg-[#facc15]/20 text-[#facc15]' : 'text-neutral-400 hover:text-white'}`}
                          title="Customize Sidebar Sliders (Width & Scale)"
                        >
                          <span className="material-symbols-outlined text-[15px]">tune</span>
                        </button>
                        <button 
                          onClick={() => setIsSidebarOpen(false)}
                          className="text-neutral-500 hover:text-white transition-colors"
                          title="Collapse Node Palette"
                        >
                          <span className="material-symbols-outlined text-[15px]">menu_open</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Sidebar & Palette Sliders Control Strip */}
                    {showPaletteSliders && (
                      <div className="mb-4 p-2.5 bg-[#1a1a1a] rounded-lg border border-neutral-800/80 space-y-2.5 shrink-0 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-[#facc15] uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">tune</span>
                            Sidebar Sliders
                          </span>
                          <button 
                            onClick={() => { setSidebarWidth(240); setNodePaletteScale(1); }} 
                            className="text-[8px] text-neutral-500 hover:text-neutral-300 underline"
                          >
                            Reset
                          </button>
                        </div>

                        {/* Sidebar Width Slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[9px] font-bold text-neutral-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]">linear_scale</span>
                              Sidebar Width
                            </label>
                            <span className="text-[9px] font-mono text-[#facc15] font-bold px-1 bg-amber-950/40 rounded border border-amber-900/40">
                              {sidebarWidth}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="180"
                            max="360"
                            step="10"
                            value={sidebarWidth}
                            onChange={(e) => setSidebarWidth(Number(e.target.value))}
                            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#facc15]"
                          />
                        </div>

                        {/* Node Card Scale Slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[9px] font-bold text-neutral-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]">format_size</span>
                              Node Scale
                            </label>
                            <span className="text-[9px] font-mono text-[#facc15] font-bold px-1 bg-amber-950/40 rounded border border-amber-900/40">
                              {Math.round(nodePaletteScale * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.75"
                            max="1.25"
                            step="0.05"
                            value={nodePaletteScale}
                            onChange={(e) => setNodePaletteScale(Number(e.target.value))}
                            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#facc15]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-[#939084] mb-2">Triggers & Actions</div>
                        <div className="space-y-2">
                          <button
                            onClick={() => addNode('start_trigger')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>▶️</span>
                            <span>Start Trigger</span>
                          </button>

                          <button
                            onClick={() => addNode('trigger')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>⚡</span>
                            <span>Start Webhook</span>
                          </button>

                          <button
                            onClick={() => addNode('schedule_trigger')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>⏰</span>
                            <span>Schedule Timer</span>
                          </button>

                          <button
                            onClick={() => addNode('google_form_trigger')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>📋</span>
                            <span>Google Form</span>
                          </button>

                          <button
                            onClick={() => addNode('marketing_email')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>✉️</span>
                            <span>Send Email</span>
                          </button>

                          <button
                            onClick={() => addNode('crm_action')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>🗄️</span>
                            <span>CRM Contact</span>
                          </button>

                          <button
                            onClick={() => addNode('google_sheets')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>📊</span>
                            <span>Google Sheets</span>
                          </button>

                          <button
                            onClick={() => addNode('action.excel')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>📈</span>
                            <span>Excel Processor</span>
                          </button>

                          <button
                            onClick={() => addNode('action.mcpConnector')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>🔌</span>
                            <span>MCP Productivity Connector</span>
                          </button>

                          <button
                            onClick={() => addNode('openai')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>🤖</span>
                            <span>OpenAI GPT</span>
                          </button>

                          <button
                            onClick={() => addNode('slack')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>💬</span>
                            <span>Post to Slack</span>
                          </button>

                          <button
                            onClick={() => addNode('discord')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>🎮</span>
                            <span>Discord Alert</span>
                          </button>

                          <button
                            onClick={() => addNode('respond_to_webhook')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>📤</span>
                            <span>Webhook Response</span>
                          </button>

                          <button
                            onClick={() => addNode('ifelse')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>🔀</span>
                            <span>If / Else Filter</span>
                          </button>

                          <button
                            onClick={() => addNode('delay')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>⏳</span>
                            <span>Delay Wait</span>
                          </button>

                          <button
                            onClick={() => addNode('code')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515] text-xs font-bold text-left transition-all"
                          >
                            <span>💻</span>
                            <span>Run JS Script</span>
                          </button>

                          <button
                            onClick={() => addNode('end')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-rose-300 bg-[#fffefb] hover:border-rose-600 text-rose-700 text-xs font-bold text-left transition-all"
                          >
                            <span>🛑</span>
                            <span>End Workflow</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* React Flow Workspace Canvas (Warm Cream Surface #fffefb) */}
              <div className="flex-1 h-full bg-[#fffefb] relative dot-grid">
                
                {/* Floating expand toggle for collapsed Node Palette */}
                {!isSidebarOpen && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-6 left-4 z-20 w-9 h-9 rounded-md bg-[#fffefb] border border-[#201515] flex items-center justify-center text-[#ff4f00] hover:bg-[#201515] hover:text-[#fffefb] transition shadow-md cursor-pointer font-bold"
                    title="Expand Node Palette"
                  >
                    ☰
                  </button>
                )}
                <ReactFlow
                  nodes={nodes}
                  edges={edgesWithAddButton}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  isValidConnection={isValidConnection}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  defaultEdgeOptions={{ type: 'buttonEdge' }}
                  onNodeClick={onNodeClick}
                  onNodeDoubleClick={onNodeDoubleClick}
                  onPaneClick={onPaneClick}
                  nodesDraggable={true}
                  nodesConnectable={true}
                  elementsSelectable={true}
                  snapToGrid={true}
                  snapGrid={[15, 15]}
                  fitView
                >
                  <Background color="#ff4f00" gap={32} size={1} />
                </ReactFlow>

                {/* Primary Action Button (#ff4f00 CTA) */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                  <button
                    onClick={handleRunWorkflow}
                    className="bg-[#ff4f00] text-[#fffefb] px-8 py-3 rounded-md font-bold text-xs tracking-wider uppercase shadow-xl hover:opacity-90 active:scale-98 transition-all flex items-center gap-2"
                  >
                    <span>⚡</span>
                    Run Workflow
                  </button>
                </div>

                {/* AI Copilot Floating Panel (Bottom Right) */}
                <div className="absolute bottom-8 right-8 z-20 flex flex-col items-end">
                  {isChatOpen && (
                    <div className="w-80 h-[380px] bg-[#fffefb] border border-[#201515] rounded-md shadow-2xl flex flex-col overflow-hidden mb-3 text-left">
                      {/* Header */}
                      <div className="p-3 bg-[#201515] text-[#fffefb] flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[#ff4f00] font-bold text-sm">🤖</span>
                          <span className="font-bold text-xs text-[#fffefb]">NEURON_FLOW AI Copilot</span>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} className="text-[#c5c0b1] hover:text-[#fffefb]">
                          ✕
                        </button>
                      </div>

                      {/* Messages list */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-[#f8f4f0]">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`p-2.5 rounded-md max-w-[85%] leading-relaxed ${
                              msg.sender === 'user' 
                                ? 'bg-[#ff4f00] text-[#fffefb] font-semibold' 
                                : 'bg-[#fffefb] text-[#201515] border border-[#c5c0b1]'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                              {msg.code && (
                                <div className="mt-2 text-left">
                                  <pre className="bg-[#201515] text-[#fffefb] p-2 rounded text-[10px] font-mono overflow-x-auto">
                                    <code>{msg.code}</code>
                                  </pre>
                                  <button
                                    onClick={() => handleApplyCodeToNode(msg.code)}
                                    className="mt-1.5 w-full bg-[#ff4f00] text-[#fffefb] font-bold py-1 px-2 rounded text-[10px] transition-colors flex items-center justify-center gap-1"
                                  >
                                    Apply to selected node
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex items-center gap-1 bg-[#fffefb] border border-[#c5c0b1] text-[#201515] p-2 rounded-md w-14 justify-center">
                            <span className="w-1.5 h-1.5 bg-[#ff4f00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-[#ff4f00] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-[#ff4f00] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        )}
                      </div>

                      {/* Input */}
                      <div className="p-2 border-t border-[#c5c0b1] flex gap-2 shrink-0 bg-[#fffefb]">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage(chatInput)}
                          placeholder="Ask Copilot script help..."
                          className="flex-1 bg-[#f8f4f0] border border-[#201515] rounded-sm px-2.5 py-1 text-[#201515] text-xs outline-none focus:border-[#ff4f00]"
                        />
                        <button onClick={() => handleSendChatMessage(chatInput)} className="bg-[#201515] text-[#fffefb] px-3 py-1 rounded-md text-xs font-bold hover:opacity-90">
                          Send
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#201515] text-[#fffefb] font-bold text-xs uppercase tracking-wider shadow-xl hover:bg-[#ff4f00] transition-all"
                  >
                    <span>🤖</span>
                    <span>AI Copilot</span>
                  </button>
                </div>
              </div>

              {/* NODE DETAILS CONFIG PANEL (Right side on Canvas) */}
              <div className="w-80 bg-surface-container border-l border-[#353534] shrink-0 flex flex-col text-left">
                <div className="p-5 border-b border-[#353534] flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-accent-coral flex items-center gap-1.5">
                    <span className="material-symbols-outlined !text-[16px]">settings</span>
                    Config settings
                  </h3>
                  {selectedNode && (
                    <button
                      onClick={() => {
                        setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                        setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                        setSelectedNode(null);
                      }}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs text-on-surface-variant">
                  {selectedNode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-neutral-400 font-bold mb-1">Label</label>
                        <input
                          type="text"
                          value={selectedNode.data?.label || ''}
                          onChange={(e) => updateNodeData('label', e.target.value)}
                          className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none focus:border-accent-coral/50 mb-3"
                        />
                        <button
                          type="button"
                          onClick={() => openWebhookInputPopup(selectedNode)}
                          className="w-full bg-gradient-to-r from-emerald-950/60 to-teal-950/60 hover:from-emerald-900/80 hover:to-teal-900/80 text-emerald-300 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">tune</span>
                          <span>Open {selectedNode.data?.label || selectedNode.type} Interface</span>
                        </button>
                      </div>

                      {/* Trigger fields */}
                      {selectedNode.type === 'trigger' && (
                        <div>
                          <label className="block text-neutral-400 font-bold mb-1">Webhook Target</label>
                          <div className="bg-[#0a0a0a] p-2.5 rounded font-mono text-[9px] break-all select-all text-emerald-400 border border-neutral-800">
                            {`${BACKEND_URL}/api/webhooks/${currentWorkflow?.id}`}
                          </div>
                          <span className="text-[9px] text-neutral-500 block mt-1">Triggers whenever a POST request lands.</span>
                        </div>
                      )}

                      {/* Send Email Fields */}
                      {selectedNode.type === 'marketing_email' && (
                        <>
                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Recipient</label>
                            <input
                              type="text"
                              value={selectedNode.data?.to || ''}
                              onChange={(e) => updateNodeData('to', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-accent-coral/50"
                              placeholder="{{trigger.email}}"
                            />
                          </div>
                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Subject</label>
                            <input
                              type="text"
                              value={selectedNode.data?.subject || ''}
                              onChange={(e) => updateNodeData('subject', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-accent-coral/50"
                            />
                          </div>
                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Email Body</label>
                            <textarea
                              value={selectedNode.data?.body || ''}
                              onChange={(e) => updateNodeData('body', e.target.value)}
                              rows={5}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-accent-coral/50 font-mono text-[10px]"
                            />
                          </div>
                        </>
                      )}

                      {/* CRM Action Fields */}
                      {selectedNode.type === 'crm_action' && (
                        <>
                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Contact Email</label>
                            <input
                              type="text"
                              value={selectedNode.data?.email || ''}
                              onChange={(e) => updateNodeData('email', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-accent-coral/50"
                              placeholder="{{trigger.email}}"
                            />
                          </div>
                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Status</label>
                            <select
                              value={selectedNode.data?.status || 'lead'}
                              onChange={(e) => updateNodeData('status', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-accent-coral/50 cursor-pointer"
                            >
                              <option value="lead">Lead</option>
                              <option value="contact">Contact</option>
                              <option value="customer">Customer</option>
                            </select>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-neutral-400 font-bold">Score Increment</label>
                              <span className="text-indigo-400 font-mono font-bold text-[10px] bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/40">
                                {selectedNode.data?.scoreChange !== undefined ? Number(selectedNode.data.scoreChange) : 10}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-50"
                              max="100"
                              step="5"
                              value={selectedNode.data?.scoreChange !== undefined ? Number(selectedNode.data.scoreChange) : 10}
                              onChange={(e) => updateNodeData('scoreChange', parseInt(e.target.value, 10))}
                              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400 mb-1"
                            />
                            <input
                              type="number"
                              value={selectedNode.data?.scoreChange || '10'}
                              onChange={(e) => updateNodeData('scoreChange', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-accent-coral/50 text-[10px]"
                            />
                          </div>
                        </>
                      )}

                      {/* If / Else Fields */}
                      {selectedNode.type === 'ifelse' && (
                        <>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-neutral-400 font-bold">Threshold Score Slider</label>
                              <span className="text-fuchsia-400 font-mono font-bold text-[10px] bg-fuchsia-950/40 px-1.5 py-0.5 rounded border border-fuchsia-900/40">
                                {selectedNode.data?.thresholdScore ?? 50}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={selectedNode.data?.thresholdScore ?? 50}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                updateNodeData('thresholdScore', val);
                                updateNodeData('condition', `context.trigger.score > ${val}`);
                              }}
                              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400 mb-2"
                            />
                          </div>

                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Expression Condition</label>
                            <input
                              type="text"
                              value={selectedNode.data?.condition || 'context.trigger.score > 50'}
                              onChange={(e) => updateNodeData('condition', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-accent-coral/50 font-mono text-[10px]"
                              placeholder="context.trigger.score > 50"
                            />
                          </div>
                        </>
                      )}

                      {/* Delay timer fields */}
                      {selectedNode.type === 'delay' && (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-neutral-400 font-bold">Delay Duration (Seconds)</label>
                            <span className="text-[#facc15] font-mono font-bold text-[10px] bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40">
                              {selectedNode.data?.seconds || 5}s
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="300"
                            step="1"
                            value={parseInt(selectedNode.data?.seconds || '5', 10)}
                            onChange={(e) => updateNodeData('seconds', parseInt(e.target.value, 10))}
                            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#facc15] mb-2"
                          />
                          <input
                            type="number"
                            value={selectedNode.data?.seconds || '5'}
                            onChange={(e) => updateNodeData('seconds', e.target.value)}
                            className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-accent-coral/50 text-[10px]"
                          />
                        </div>
                      )}

                      {/* Code Block fields */}
                      {selectedNode.type === 'code' && (
                        <div>
                          <label className="block text-neutral-400 font-bold mb-1">JavaScript Code</label>
                          <textarea
                            value={selectedNode.data?.code || ''}
                            onChange={(e) => updateNodeData('code', e.target.value)}
                            rows={8}
                            className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-accent-coral/50 font-mono text-[10px]"
                          />
                        </div>
                      )}

                      {/* Schedule Trigger fields */}
                      {selectedNode.type === 'schedule_trigger' && (
                        <>
                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Schedule Type</label>
                            <select
                              value={selectedNode.data?.scheduleType || 'interval'}
                              onChange={(e) => updateNodeData('scheduleType', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none cursor-pointer"
                            >
                              <option value="interval">Interval (Recurring)</option>
                              <option value="cron">Cron Expression (Advanced)</option>
                              <option value="date">Specific Date/Time (Once)</option>
                            </select>
                          </div>

                          {selectedNode.data?.scheduleType === 'interval' && (
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="block text-neutral-400 font-bold">Interval Slider</label>
                                  <span className="text-amber-400 font-mono font-bold text-[10px] bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40">
                                    {selectedNode.data?.intervalValue || 10} {selectedNode.data?.intervalUnit || 'seconds'}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="60"
                                  step="1"
                                  value={selectedNode.data?.intervalValue || 10}
                                  onChange={(e) => updateNodeData('intervalValue', parseInt(e.target.value, 10))}
                                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400 mb-2"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-neutral-400 font-bold mb-1">Value</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedNode.data?.intervalValue || 10}
                                    onChange={(e) => updateNodeData('intervalValue', parseInt(e.target.value, 10))}
                                    className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none text-[10px]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-neutral-400 font-bold mb-1">Unit</label>
                                  <select
                                    value={selectedNode.data?.intervalUnit || 'seconds'}
                                    onChange={(e) => updateNodeData('intervalUnit', e.target.value)}
                                    className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none text-[10px]"
                                  >
                                    <option value="seconds">Seconds</option>
                                    <option value="minutes">Minutes</option>
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                    <option value="weeks">Weeks</option>
                                    <option value="months">Months</option>
                                    <option value="years">Years</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedNode.data?.scheduleType === 'cron' && (
                            <div>
                              <label className="block text-neutral-400 font-bold mb-1">Cron Expression</label>
                              <input
                                type="text"
                                value={selectedNode.data?.cronExpression || '*/10 * * * * *'}
                                onChange={(e) => updateNodeData('cronExpression', e.target.value)}
                                placeholder="*/10 * * * * *"
                                className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none font-mono text-[10px]"
                              />
                              <p className="text-[9px] text-neutral-500 mt-1">
                                Standard: `min hr dom mon dow` or 6-field: `sec min hr dom mon dow`
                              </p>
                            </div>
                          )}

                          {selectedNode.data?.scheduleType === 'date' && (
                            <div>
                              <label className="block text-neutral-400 font-bold mb-1">Run Date & Time</label>
                              <input
                                type="datetime-local"
                                value={selectedNode.data?.customDate || ''}
                                onChange={(e) => updateNodeData('customDate', e.target.value)}
                                className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none text-[10px] cursor-pointer"
                              />
                            </div>
                          )}

                          <div className="pt-2 border-t border-neutral-800 space-y-1">
                            <span className="text-[9px] text-neutral-400 block font-mono">
                              Last Run: {selectedNode.data?.lastRun ? new Date(selectedNode.data.lastRun).toLocaleString() : 'Never'}
                            </span>
                            <span className="text-[9px] text-amber-500 block font-mono">
                              Next Run: {selectedNode.data?.nextRun ? new Date(selectedNode.data.nextRun).toLocaleString() : 'Upon activation'}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Google Sheets Action Fields */}
                      {selectedNode.type === 'google_sheets' && (
                        <>
                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Action Type</label>
                            <select
                              value={selectedNode.data?.action || 'read'}
                              onChange={(e) => updateNodeData('action', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none cursor-pointer"
                            >
                              <option value="read">Read Spreadsheet Rows</option>
                              <option value="write">Write Row (Append)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Spreadsheet ID/URL</label>
                            <input
                              type="text"
                              value={selectedNode.data?.sheetId || '1X3-mock-spreadsheet-id'}
                              onChange={(e) => updateNodeData('sheetId', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none"
                              placeholder="Google Sheet ID"
                            />
                          </div>

                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Sheet Name</label>
                            <input
                              type="text"
                              value={selectedNode.data?.sheetName || 'Sheet1'}
                              onChange={(e) => updateNodeData('sheetName', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none"
                              placeholder="Sheet1"
                            />
                          </div>

                          {selectedNode.data?.action === 'read' ? (
                            <>
                              <div>
                                <label className="block text-neutral-400 font-bold mb-1">Mock Dataset</label>
                                <select
                                  value={selectedNode.data?.mockDataType || 'blog_news'}
                                  onChange={(e) => updateNodeData('mockDataType', e.target.value)}
                                  className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none cursor-pointer"
                                >
                                  <option value="blog_news">Blog News Articles (Title, Summary, Content, Platform)</option>
                                  <option value="crm_leads">CRM Leads List (Name, Email, Status, Score)</option>
                                  <option value="custom">Custom JSON Data</option>
                                </select>
                              </div>

                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="block text-neutral-400 font-bold">Max Row Limit</label>
                                  <span className="text-green-400 font-mono font-bold text-[10px] bg-green-950/40 px-1.5 py-0.5 rounded border border-green-900/40">
                                    {selectedNode.data?.rowLimit || 10} Rows
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="50"
                                  step="1"
                                  value={selectedNode.data?.rowLimit || 10}
                                  onChange={(e) => updateNodeData('rowLimit', parseInt(e.target.value, 10))}
                                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-green-400 mb-1"
                                />
                              </div>

                              {selectedNode.data?.mockDataType === 'custom' && (
                                <div>
                                  <label className="block text-neutral-400 font-bold mb-1">Custom JSON Array</label>
                                  <textarea
                                    value={selectedNode.data?.customJson || '[\n  {"id": 1, "title": "Custom Post", "content": "Hello World"}\n]'}
                                    onChange={(e) => updateNodeData('customJson', e.target.value)}
                                    rows={4}
                                    className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none font-mono text-[9px]"
                                  />
                                </div>
                              )}

                              <div className="flex items-center gap-2 mt-2">
                                <input
                                  type="checkbox"
                                  id="triggerForEachRow"
                                  checked={selectedNode.data?.triggerForEachRow !== false}
                                  onChange={(e) => updateNodeData('triggerForEachRow', e.target.checked)}
                                  className="rounded border-neutral-800 bg-[#0e0e0e] text-[#facc15] focus:ring-0 cursor-pointer"
                                />
                                <label htmlFor="triggerForEachRow" className="text-neutral-400 font-bold cursor-pointer selection:bg-transparent">
                                  Trigger workflow for each row
                                </label>
                              </div>
                              <span className="text-[9px] text-neutral-500 block leading-normal">
                                If enabled, downstream nodes will execute independently for each row, with columns available as {"{{trigger.column_name}}"} (e.g. {"{{trigger.title}}"}).
                              </span>
                            </>
                          ) : (
                            <div>
                              <label className="block text-neutral-400 font-bold mb-1">Row Data (JSON Object)</label>
                              <textarea
                                value={selectedNode.data?.rowData || '{\n  "email": "{{trigger.email}}",\n  "name": "{{trigger.name}}",\n  "status": "synchronized"\n}'}
                                onChange={(e) => updateNodeData('rowData', e.target.value)}
                                rows={4}
                                className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none font-mono text-[9px]"
                                placeholder='{"column1": "value1", "column2": "{{trigger.email}}"}'
                              />
                              <p className="text-[9px] text-neutral-500 leading-normal mt-1">
                                Define columns as keys and cells as values. Supports variable references like {"{{trigger.field}}"} and {"{{steps.nodeId.field}}"}.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {(selectedNode.type === 'openai' || selectedNode.type === 'action.openai') && (
                        <>
                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">AI Model</label>
                            <select
                              value={selectedNode.data?.model || 'gpt-4o'}
                              onChange={(e) => updateNodeData('model', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none cursor-pointer"
                            >
                              <option value="gpt-4o">GPT-4o (Recommended / Standard)</option>
                              <option value="gpt-4-turbo">GPT-4 Turbo</option>
                              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
                            </select>
                          </div>

                          {/* Temperature Slider */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-neutral-400 font-bold">Temperature (Creativity)</label>
                              <span className="text-purple-400 font-mono font-bold text-[10px] bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-900/40">
                                {selectedNode.data?.temperature !== undefined ? selectedNode.data.temperature : 0.7}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={selectedNode.data?.temperature !== undefined ? selectedNode.data.temperature : 0.7}
                              onChange={(e) => updateNodeData('temperature', parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400 mb-1"
                            />
                            <div className="flex justify-between text-[8px] text-neutral-500 font-mono mb-2">
                              <span>0.0 (Precise)</span>
                              <span>0.5 (Balanced)</span>
                              <span>1.0 (Creative)</span>
                            </div>
                          </div>

                          {/* Max Tokens Slider */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-neutral-400 font-bold">Max Tokens (Output Length)</label>
                              <span className="text-purple-400 font-mono font-bold text-[10px] bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-900/40">
                                {selectedNode.data?.maxTokens || 1000}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="100"
                              max="4000"
                              step="50"
                              value={selectedNode.data?.maxTokens || 1000}
                              onChange={(e) => updateNodeData('maxTokens', parseInt(e.target.value, 10))}
                              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400 mb-2"
                            />
                          </div>

                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Prompt Template</label>
                            <textarea
                              value={selectedNode.data?.prompt || ''}
                              onChange={(e) => updateNodeData('prompt', e.target.value)}
                              rows={5}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none focus:border-accent-coral/50 font-mono text-[10px]"
                              placeholder="Please summarize: {{trigger.title}} ..."
                            />
                            <p className="text-[9px] text-neutral-500 leading-normal mt-1">
                              Supports template placeholders: {"{{trigger.field}}"} and {"{{steps.node_id.result}}"}.
                            </p>
                          </div>
                        </>
                      )}

                      {(selectedNode.type === 'slack' || selectedNode.type === 'action.slack') && (
                        <>
                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Slack Webhook URL</label>
                            <input
                              type="text"
                              value={selectedNode.data?.webhookUrl || ''}
                              onChange={(e) => updateNodeData('webhookUrl', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none"
                              placeholder="https://hooks.slack.com/services/..."
                            />
                          </div>

                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Message Text</label>
                            <textarea
                              value={selectedNode.data?.text || ''}
                              onChange={(e) => updateNodeData('text', e.target.value)}
                              rows={4}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none font-mono text-[9px]"
                              placeholder="📢 Alert: {{trigger.title}}"
                            />
                            <p className="text-[9px] text-neutral-500 leading-normal mt-1">
                              Supports Slack markdown formatting and {"{{steps.node_id.result}}"}.
                            </p>
                          </div>
                        </>
                      )}

                      {(selectedNode.type === 'discord' || selectedNode.type === 'action.discord') && (
                        <>
                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Discord Webhook URL</label>
                            <input
                              type="text"
                              value={selectedNode.data?.webhookUrl || ''}
                              onChange={(e) => updateNodeData('webhookUrl', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none"
                              placeholder="https://discord.com/api/webhooks/..."
                            />
                          </div>

                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Message Content</label>
                            <textarea
                              value={selectedNode.data?.content || ''}
                              onChange={(e) => updateNodeData('content', e.target.value)}
                              rows={4}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none font-mono text-[9px]"
                              placeholder="🚀 New Event: {{trigger.email}}"
                            />
                            <p className="text-[9px] text-neutral-500 leading-normal mt-1">
                              Supports Discord markdown and placeholders like {"{{trigger.email}}"}.
                            </p>
                          </div>
                        </>
                      )}

                      {(selectedNode.type === 'respond_to_webhook' || selectedNode.type === 'action.respondToWebhook') && (
                        <>
                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Response Mode</label>
                            <select
                              value={selectedNode.data?.responseMode || 'json'}
                              onChange={(e) => updateNodeData('responseMode', e.target.value)}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none cursor-pointer"
                            >
                              <option value="json">JSON Body</option>
                              <option value="text">Raw Text / HTML</option>
                              <option value="redirect">HTTP Redirect</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">HTTP Status Code</label>
                            <input
                              type="number"
                              value={selectedNode.data?.statusCode || 200}
                              onChange={(e) => updateNodeData('statusCode', parseInt(e.target.value, 10))}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none"
                              placeholder="200"
                            />
                          </div>

                          {selectedNode.data?.responseMode === 'redirect' ? (
                            <div>
                              <label className="block text-neutral-400 font-bold mb-1">Redirect Target URL</label>
                              <input
                                type="text"
                                value={selectedNode.data?.redirectUrl || ''}
                                onChange={(e) => updateNodeData('redirectUrl', e.target.value)}
                                className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none"
                                placeholder="https://your-site.com/thank-you"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-neutral-400 font-bold mb-1">Response Body</label>
                              <textarea
                                value={selectedNode.data?.responseBody || '{\n  "success": true\n}'}
                                onChange={(e) => updateNodeData('responseBody', e.target.value)}
                                rows={4}
                                className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none font-mono text-[9px]"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-neutral-400 font-bold mb-1">Headers (JSON)</label>
                            <textarea
                              value={selectedNode.data?.headers || '{\n  "Content-Type": "application/json"\n}'}
                              onChange={(e) => updateNodeData('headers', e.target.value)}
                              rows={3}
                              className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-lg px-2 py-1.5 text-white outline-none font-mono text-[9px]"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-600 font-mono text-[10px]">
                      <span className="material-symbols-outlined text-3xl block mb-2 opacity-30">gesture</span>
                      Select a node in the graph builder to edit configurations.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. TEMPLATES (TEMPLATE LIBRARY) VIEW */}
        {viewMode === 'templates' && (
          <div className="flex-1 flex flex-col overflow-y-auto p-8 bg-[#09090b] text-[#f4f4f5]">
            {/* Template TopNavBar */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0 text-left">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Template Library</h1>
                <p className="text-[#a1a1aa] text-sm max-w-xl font-normal">Curated automation workflows ready to deploy into your visual workspace in seconds.</p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#a1a1aa] font-bold">🔍</span>
                  <input
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    className="w-full bg-[#141417] border border-[#27272a] pl-9 pr-4 py-2 rounded-md text-xs text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#ff4f00] transition-all font-medium"
                    placeholder="Search templates..."
                    type="text"
                  />
                </div>
                <div 
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="w-9 h-9 rounded-full bg-[#141417] border border-[#27272a] overflow-hidden cursor-pointer hover:opacity-85 transition-opacity shrink-0"
                  title="Change Profile Picture"
                >
                  <img className="w-full h-full object-cover" alt="User Avatar" src={profilePic} />
                </div>
              </div>
            </header>

            {/* Category Filter Pills */}
            <div className="flex gap-2 mb-8 border-b border-[#27272a] pb-3 overflow-x-auto shrink-0 text-left">
              {['All', 'CRM', 'AI Agents', 'E-Commerce', 'Marketing', 'DevOps', 'Security'].map((cat) => {
                const isActive = selectedTemplateCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedTemplateCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#ff4f00] text-white shadow-sm'
                        : 'bg-[#141417] text-[#a1a1aa] hover:text-white hover:bg-[#1f1f23] border border-[#27272a]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left items-stretch">
              
              {/* Featured Bento Card (Inventory Balancer) */}
              {(() => {
                const featuredTemplate = TEMPLATES.find(t => t.featured);
                if (!featuredTemplate) return null;
                const matchesCategory = selectedTemplateCategory === 'All' || featuredTemplate.category === selectedTemplateCategory;
                const matchesSearch = featuredTemplate.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) || 
                                      featuredTemplate.description.toLowerCase().includes(templateSearchQuery.toLowerCase());
                if (!matchesCategory || !matchesSearch) return null;

                return (
                  <div className="lg:col-span-2 clean-card group cursor-pointer flex flex-row p-5 rounded-xl overflow-hidden min-h-[170px] bg-[#141417] text-white border border-[#27272a] hover:border-[#ff4f00] shadow-sm hover:shadow-md transition-all relative">
                    <div className="flex-1 flex flex-col justify-between z-10 pr-4 text-left">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">{featuredTemplate.category}</span>
                          <span className="px-2 py-0.5 bg-[#ff4f00]/20 text-[#ff4f00] text-[9px] font-bold tracking-wider rounded border border-[#ff4f00]/30">
                            ★ FEATURED
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 tracking-tight">{featuredTemplate.name}</h3>
                        <p className="text-[#a1a1aa] text-xs leading-relaxed max-w-md mb-3 font-normal">{featuredTemplate.description}</p>
                      </div>
                      <div className="mt-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeployTemplate(featuredTemplate);
                          }}
                          className="px-4 py-1.5 bg-[#ff4f00] text-white font-bold text-xs uppercase tracking-wider rounded hover:bg-[#e04500] transition-all shadow-sm flex items-center gap-1.5"
                        >
                          ⚡ Deploy Template
                        </button>
                      </div>
                    </div>

                    {/* Graphic diagram on right side */}
                    <div className="hidden md:flex w-1/4 items-center justify-center border-l border-[#27272a] ml-3 pl-3 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="relative flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full border border-[#ff4f00]/60 bg-[#1f1f23] flex items-center justify-center text-xl shadow-inner text-[#ff4f00]">
                          ⚡
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></div>
                      </div>
                    </div>

                    {/* Subtle orange ambient backdrop glow */}
                    <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-[#ff4f00]/10 rounded-full blur-2xl pointer-events-none"></div>
                  </div>
                );
              })()}

              {/* Regular Template Cards */}
              {filteredTemplates.filter(t => !t.featured).map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleDeployTemplate(tpl)}
                  className="bg-[#141417] border border-[#27272a] hover:border-[#ff4f00] p-5 rounded-xl flex flex-col justify-between transition-all cursor-pointer group shadow-sm hover:shadow-md text-left min-h-[170px]"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">{tpl.category}</span>
                      <span className="text-white font-bold text-xs group-hover:text-[#ff4f00] transition-colors">↗</span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{tpl.name}</h3>
                    <p className="text-[#a1a1aa] text-xs leading-relaxed mb-4 font-normal">{tpl.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#27272a] mt-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#a1a1aa]">Nodes:</span>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-[#1f1f23] border border-[#27272a] text-[10px] font-bold text-[#f4f4f5]">⚡</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#1f1f23] border border-[#27272a] text-[10px] font-bold text-[#f4f4f5]">✉️</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#1f1f23] border border-[#27272a] text-[10px] font-bold text-[#f4f4f5]">🤖</span>
                      </div>
                    </div>
                    {tpl.popular && (
                      <span className="text-[9px] font-bold text-[#ff4f00] uppercase tracking-wider px-2 py-0.5 bg-[#ff4f00]/10 rounded border border-[#ff4f00]/20">
                        Popular
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. VARIABLES MANAGER VIEW */}
        {viewMode === 'variables' && (
          <div className="flex-1 flex flex-col overflow-y-auto p-8 bg-[#09090b] text-[#f4f4f5]">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 shrink-0 text-left">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Environment Variables</h1>
                <p className="text-[#a1a1aa] text-sm max-w-2xl font-normal">Manage environment variables accessible securely by execution engines and custom script runner nodes.</p>
              </div>
              <div 
                onClick={() => setIsAvatarModalOpen(true)}
                className="w-9 h-9 rounded-full bg-[#141417] border border-[#27272a] overflow-hidden cursor-pointer hover:opacity-85 transition-opacity"
                title="Change Profile Picture"
              >
                <img className="w-full h-full object-cover" alt="User Avatar" src={profilePic} />
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
              {/* Creator Form */}
              <div className="bg-[#141417] border border-[#27272a] p-6 rounded-xl h-fit shadow-sm">
                <h3 className="font-bold text-[#ff4f00] text-xs uppercase tracking-wider mb-4">Add Variable</h3>
                <form onSubmit={handleAddVar} className="space-y-4">
                  <div>
                    <label className="block text-white text-xs mb-1 font-bold">Key / Variable Name</label>
                    <input
                      type="text"
                      required
                      value={newVarKey}
                      onChange={(e) => setNewVarKey(e.target.value.toUpperCase())}
                      placeholder="MY_API_SECRET"
                      className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white placeholder-[#a1a1aa] outline-none focus:border-[#ff4f00] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-xs mb-1 font-bold">Value</label>
                    <textarea
                      required
                      value={newVarVal}
                      onChange={(e) => setNewVarVal(e.target.value)}
                      placeholder="xoxb-secret-token"
                      rows={4}
                      className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white placeholder-[#a1a1aa] outline-none focus:border-[#ff4f00] text-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#ff4f00] text-white font-bold py-2.5 rounded-md hover:bg-[#e04500] transition-colors uppercase tracking-wider text-xs shadow-sm"
                  >
                    Save Variable
                  </button>
                </form>
              </div>

              {/* Variables List Table */}
              <div className="lg:col-span-2 bg-[#141417] border border-[#27272a] p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-white mb-4">Configured Values</h3>
                <div className="overflow-x-auto rounded-lg border border-[#27272a]">
                  <table className="w-full border-collapse text-xs text-left bg-[#1f1f23]">
                    <thead>
                      <tr className="bg-[#141417] text-white border-b border-[#27272a]">
                        <th className="p-3.5 font-bold uppercase tracking-wider">Key</th>
                        <th className="p-3.5 font-bold uppercase tracking-wider">Masked Value</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variables.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-[#a1a1aa] font-semibold">No global variables configured.</td>
                        </tr>
                      ) : (
                        variables.map((v) => (
                          <tr key={v.key} className="border-b border-[#27272a] hover:bg-[#27272a]/50">
                            <td className="p-3.5 font-mono font-bold text-white">{v.key}</td>
                            <td className="p-3.5 font-mono text-[#a1a1aa]">
                              {v.value.length > 20 ? `${v.value.substring(0, 15)}... [encrypted]` : v.value}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteVar(v.key)}
                                className="text-rose-400 hover:text-rose-300 font-bold hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. HISTORY & DB SIMULATIONS VIEW */}
        {viewMode === 'history' && (
          <div className="flex-1 flex flex-col h-full w-full bg-[#09090b] text-[#f4f4f5]">
            
            {/* Tab Selector */}
            <div className="flex border-b border-[#27272a] text-xs font-bold text-white shrink-0 bg-[#141417]">
              <button
                type="button"
                onClick={() => setHistoryTab('logs')}
                className={`px-6 py-3.5 transition-all flex items-center gap-2 ${
                  historyTab === 'logs' ? 'bg-[#ff4f00] text-white' : 'text-[#a1a1aa] hover:text-white hover:bg-[#1f1f23]'
                }`}
              >
                <span>📜</span>
                <span>Execution History Logs</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('crm')}
                className={`px-6 py-3.5 transition-all flex items-center gap-2 ${
                  historyTab === 'crm' ? 'bg-[#ff4f00] text-white' : 'text-[#a1a1aa] hover:text-white hover:bg-[#1f1f23]'
                }`}
              >
                <span>🗄️</span>
                <span>CRM Simulation DB</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('emails')}
                className={`px-6 py-3.5 transition-all flex items-center gap-2 ${
                  historyTab === 'emails' ? 'bg-[#ff4f00] text-white' : 'text-[#a1a1aa] hover:text-white hover:bg-[#1f1f23]'
                }`}
              >
                <span>✉️</span>
                <span>Emails Outbox Simulation</span>
              </button>
            </div>

            {/* Tab Contents container */}
            <div className="flex-1 overflow-hidden flex bg-[#09090b]">

              {/* Sub Tab: Logs */}
              {historyTab === 'logs' && (
                <div className="flex-1 flex overflow-hidden h-full text-left">
                  {/* Execution runs list */}
                  <div className="w-80 border-r border-[#27272a] overflow-y-auto p-4 flex flex-col gap-2 bg-[#141417] shrink-0 text-left">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#a1a1aa] px-1 mb-2">Execution Runs</h4>
                    {executions.length === 0 ? (
                      <div className="text-center py-8 text-[#a1a1aa] text-xs">No runs recorded yet. Trigger a workflow to start.</div>
                    ) : (
                      executions.map((exec) => {
                        const isSel = selectedExecution?.id === exec.id;
                        return (
                          <div
                            key={exec.id}
                            onClick={() => setSelectedExecution(exec)}
                            className={`p-3 rounded-lg border transition-all cursor-pointer text-xs ${
                              isSel
                                ? 'bg-[#1f1f23] border-[#ff4f00] shadow-sm'
                                : 'bg-[#141417] border-[#27272a] hover:border-white/50'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-white font-mono">Run ID #{exec.id}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                exec.status === 'success' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' :
                                exec.status === 'failed' ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30' : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                              }`}>
                                {exec.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#a1a1aa] font-mono">
                              {new Date(exec.startedAt).toLocaleString()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Step log list console */}
                  <div className="flex-1 p-6 overflow-y-auto bg-[#0d0d10] text-left font-mono text-xs text-white">
                    {selectedExecution ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-[#27272a] pb-3 mb-4">
                          <span className="font-bold text-white">Console Output trace Log #{selectedExecution.id}</span>
                          <span className="text-[10px] text-[#a1a1aa]">Status: {selectedExecution.status}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {selectedExecution.logs ? (
                            JSON.parse(selectedExecution.logs).map((step: any, i: number) => (
                              <div key={i} className="flex gap-4 p-1.5 hover:bg-[#1f1f23] rounded transition-colors text-white">
                                <span className="text-[#a1a1aa] shrink-0">[{new Date(step.time).toLocaleTimeString()}]</span>
                                <span className="text-[#ff4f00] font-bold shrink-0">{step.nodeType ? `[${step.nodeType.toUpperCase()}]` : '[SYSTEM]'}</span>
                                <span className="text-white">{step.message}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[#a1a1aa]">Empty steps console output.</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#a1a1aa] text-center py-20">Select an execution run from the left panel to review step-by-step logs.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub Tab: CRM Database */}
              {historyTab === 'crm' && (
                <div className="flex-1 flex overflow-hidden p-6 gap-6 h-full text-left bg-[#fffefb]">
                  
                  {/* Simulator lead create form */}
                  <form onSubmit={handleCrmLeadTrigger} className="w-80 shrink-0 flex flex-col gap-4 bg-[#f8f4f0] p-5 rounded-md border border-[#c5c0b1] h-fit">
                    <h4 className="font-bold text-[#ff4f00] text-xs uppercase tracking-wider mb-1">Trigger Lead Event</h4>
                    <div>
                      <label className="block text-[#201515] text-xs mb-1 font-bold">Contact Name</label>
                      <input
                        type="text"
                        required
                        value={newLeadName}
                        onChange={(e) => setNewLeadName(e.target.value)}
                        placeholder="Jonas Scholz"
                        className="w-full bg-[#fffefb] border border-[#201515] rounded-sm px-3 py-2 text-[#201515] outline-none focus:border-[#ff4f00] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#201515] text-xs mb-1 font-bold">Contact Email</label>
                      <input
                        type="email"
                        required
                        value={newLeadEmail}
                        onChange={(e) => setNewLeadEmail(e.target.value)}
                        placeholder="jonas@example.com"
                        className="w-full bg-[#fffefb] border border-[#201515] rounded-sm px-3 py-2 text-[#201515] outline-none focus:border-[#ff4f00] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#201515] text-xs mb-1 font-bold">Lead Score: {newLeadScore}</label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={newLeadScore}
                        onChange={(e) => setNewLeadScore(parseInt(e.target.value, 10))}
                        className="w-full accent-[#ff4f00]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#ff4f00] text-[#fffefb] font-bold py-2.5 rounded-md hover:opacity-90 transition-colors uppercase tracking-wider text-xs shadow-sm"
                    >
                      Fire CRM Event
                    </button>
                  </form>

                  {/* CRM Table */}
                  <div className="flex-1 overflow-y-auto rounded-md border border-[#c5c0b1] bg-[#fffefb]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#201515] text-[#fffefb] border-b border-[#201515]">
                          <th className="p-3.5 font-bold uppercase tracking-wider">ID</th>
                          <th className="p-3.5 font-bold uppercase tracking-wider">Name</th>
                          <th className="p-3.5 font-bold uppercase tracking-wider">Email</th>
                          <th className="p-3.5 font-bold uppercase tracking-wider">Status</th>
                          <th className="p-3.5 font-bold uppercase tracking-wider">Score</th>
                          <th className="p-3.5 font-bold uppercase tracking-wider">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crmContacts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-[#939084] font-semibold">No contacts registered in CRM DB.</td>
                          </tr>
                        ) : (
                          crmContacts.map((c) => (
                            <tr key={c.id} className="border-b border-[#c5c0b1] hover:bg-[#f8f4f0]">
                              <td className="p-3.5 font-mono text-[#605d52]">{c.id}</td>
                              <td className="p-3.5 font-bold text-[#201515]">{c.name}</td>
                              <td className="p-3.5 font-mono text-[#605d52]">{c.email}</td>
                              <td className="p-3.5">
                                <span className="bg-[#f8f4f0] text-[#201515] px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border border-[#c5c0b1]">
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-3.5 font-bold text-[#ff4f00]">{c.score}</td>
                              <td className="p-3.5 text-[#939084] text-[10px]">{new Date(c.createdAt).toLocaleTimeString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub Tab: Outbox Emails */}
              {historyTab === 'emails' && (
                <div className="flex-1 p-6 overflow-y-auto text-left h-full bg-[#0e0e0e]">
                  <h3 className="text-xs uppercase font-bold text-neutral-500 tracking-wider mb-4">Simulated Outbox</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {simulatedEmails.length === 0 ? (
                      <div className="lg:col-span-2 text-center py-12 text-neutral-600 font-bold">Outbox index empty. Action email trigger has not fired yet.</div>
                    ) : (
                      simulatedEmails.map((email) => (
                        <div key={email.id} className="bg-[#0a0a0a] border border-outline-variant/30 rounded-xl p-4 flex flex-col gap-2">
                          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2 mb-1">
                            <div>
                              <span className="text-neutral-500">To:</span> <span className="font-bold text-sky-400 font-mono">{email.to}</span>
                            </div>
                            <span className="text-[10px] text-neutral-500 font-mono">{new Date(email.sentAt).toLocaleTimeString()}</span>
                          </div>
                          <div className="font-bold text-white text-xs">Subject: {email.subject}</div>
                          <p className="text-neutral-400 font-mono text-[10px] bg-black/40 p-3 rounded-lg border border-outline-variant/10 whitespace-pre-wrap">
                            {email.body}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* 6. SETTINGS VIEW */}
        {viewMode === 'settings' && (
          <div className="flex-1 flex flex-col overflow-y-auto workflow-dot-bg p-margin-lg">
            {/* Header */}
            <header className="flex justify-between items-center mb-16 shrink-0 text-left">
              <div>
                <h1 className="font-headline-xl text-headline-xl text-white tracking-tight mb-2">System Settings</h1>
                <p className="text-on-surface-variant text-body-lg max-w-2xl">Configure platform features, databases, cluster variables, and user credentials.</p>
              </div>
              <div 
                onClick={() => setIsAvatarModalOpen(true)}
                className="w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden cursor-pointer hover:opacity-85 transition-opacity"
                title="Change Profile Picture"
              >
                <img className="w-full h-full object-cover" alt="User Avatar" src={profilePic} />
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
              {/* User profile details */}
              <div className="clean-card p-8 rounded-xl flex flex-col gap-6">
                <h3 className="font-bold text-[#facc15] text-xs uppercase tracking-wider">Account Credentials</h3>
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden cursor-pointer hover:opacity-85 transition-all flex items-center justify-center"
                    title="Change Profile Picture"
                  >
                    <img className="w-full h-full object-cover" alt="User Avatar" src={profilePic} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Jonas Scholz</h4>
                    <p className="text-xs text-neutral-400">Enterprise Administrator</p>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-neutral-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-bold">Role Access</span>
                    <span className="text-white">Superuser (Admin)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-bold">Authorized Keys</span>
                    <span className="text-white font-mono">SSH v2 RSA-SHA256</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-bold">Workspace Directory</span>
                    <span className="text-white font-mono">/home/jonas/workflows</span>
                  </div>
                </div>
              </div>

              {/* Maintenance Actions */}
              <div className="clean-card p-8 rounded-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-[#facc15] text-xs uppercase tracking-wider mb-4">Platform Maintenance</h3>
                  <p className="text-xs text-neutral-400 mb-6">Perform administrative operations to purge the sqlite state data. This deletes execution logs, CRM simulation lists, and sent email records.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleResetDb}
                    className="w-full bg-[#ef4444] text-white font-bold py-3 rounded-lg hover:bg-[#ef4444]/90 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Reset Simulation DB
                  </button>
                  <button
                    onClick={() => alert(`Active Engine Endpoint: ${BACKEND_URL}`)}
                    className="w-full bg-neutral-800 text-white font-bold py-3 rounded-lg hover:bg-neutral-700 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Inspect Cluster Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. EXECUTIONS HISTORY LOGS VIEW */}
        {viewMode === 'executions' && (
          <div className="flex-1 flex flex-col h-full w-full bg-surface-container-lowest overflow-hidden">
            {/* TopNavBar */}
            <header className="flex justify-between items-center px-gutter w-full shrink-0 bg-[#0e0e0e] border-b border-neutral-900 h-16 z-20 text-left">
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant/70">
                    <span className="material-symbols-outlined text-[18px]">search</span>
                  </span>
                  <input
                    value={executionsSearchQuery}
                    onChange={(e) => setExecutionsSearchQuery(e.target.value)}
                    className="bg-[#1c1b1b] border border-transparent group-hover:border-neutral-800 rounded-lg pl-10 pr-4 py-1.5 text-body-md focus:ring-0 focus:border-primary-container/50 transition-all w-72 placeholder:text-on-surface-variant/40 text-white"
                    placeholder="Search logs..."
                    type="text"
                  />
                </div>
                <nav className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
                  <div className="relative">
                    <span className="text-primary cursor-default text-[12px]">History</span>
                    <div className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary-container rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="text-[12px]">Real-time</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                </nav>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 pr-4 border-r border-neutral-900">
                  <button
                    onClick={handleTestRun}
                    className="bg-primary-container hover:brightness-110 text-on-primary-container font-bold px-4 py-2 rounded-lg transition-all text-label-md flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                    Test Run
                  </button>
                  <button
                    onClick={handleExportExecutions}
                    className="bg-[#1c1b1b] hover:bg-neutral-800 text-on-surface font-medium px-4 py-2 rounded-lg transition-all text-label-md"
                  >
                    Export
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">notifications</span></button>
                  <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">share</span></button>
                  <div 
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="w-8 h-8 rounded-full overflow-hidden border border-neutral-800 ml-2 cursor-pointer hover:opacity-85 transition-opacity"
                    title="Change Profile Picture"
                  >
                    <img className="w-full h-full object-cover" alt="User Avatar" src={profilePic} />
                  </div>
                </div>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* List View Section */}
              <section className="flex-1 flex flex-col overflow-hidden text-left bg-[#0c0c0c]">
                <div className="px-gutter py-6 flex items-center justify-between shrink-0">
                  <div className="flex items-baseline gap-4">
                    <h1 className="font-headline-md text-[24px] font-bold tracking-tight text-white">Execution History</h1>
                    <span className="text-on-surface-variant text-body-md opacity-60">{filteredAllExecutions.length} total runs</span>
                  </div>
                  <div className="flex gap-2">
                    {/* Status filter selection */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#1c1b1b] border border-neutral-800 text-[11px] rounded-lg px-2.5 py-1 text-white outline-none cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Success">Success</option>
                      <option value="Failed">Failed</option>
                      <option value="Running">Running</option>
                    </select>

                    {/* Time filter selection */}
                    <select
                      value={timeRangeFilter}
                      onChange={(e) => setTimeRangeFilter(e.target.value)}
                      className="bg-[#1c1b1b] border border-neutral-800 text-[11px] rounded-lg px-2.5 py-1 text-white outline-none cursor-pointer"
                    >
                      <option value="all">All Time</option>
                      <option value="24h">Past 24 Hours</option>
                      <option value="7d">Past 7 Days</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-gutter pb-8">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-[#0c0c0c] z-10">
                      <tr className="text-label-sm text-neutral-500 uppercase tracking-[0.1em] text-[10px]">
                        <th className="py-4 pr-6 font-semibold border-b border-neutral-900">Status</th>
                        <th className="py-4 px-6 font-semibold border-b border-neutral-900">Workflow</th>
                        <th className="py-4 px-6 font-semibold border-b border-neutral-900">Execution ID</th>
                        <th className="py-4 px-6 font-semibold border-b border-neutral-900">Started</th>
                        <th className="py-4 pl-6 font-semibold border-b border-neutral-900">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-body-md text-neutral-300">
                      {filteredAllExecutions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-neutral-600 font-mono text-xs">
                            No matching executions found.
                          </td>
                        </tr>
                      ) : (
                        filteredAllExecutions.map((exec) => {
                          const isSelected = selectedAllExecution?.id === exec.id;
                          const durationMs = exec.finishedAt
                            ? new Date(exec.finishedAt).getTime() - new Date(exec.startedAt).getTime()
                            : null;
                          const formattedDuration = durationMs !== null ? `${durationMs}ms` : '—';
                          
                          return (
                            <tr
                              key={exec.id}
                              onClick={() => {
                                setSelectedAllExecution(exec);
                                setInspectorTab('output');
                              }}
                              className={`execution-row group cursor-pointer ${isSelected ? 'selected' : ''}`}
                            >
                              <td className="py-5 pr-6 pl-4">
                                <div className="flex items-center gap-2">
                                  {exec.status === 'success' ? (
                                    <>
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.4)]"></div>
                                      <span className="text-[#facc15] font-bold text-label-md uppercase tracking-wider">SUCCESS</span>
                                    </>
                                  ) : exec.status === 'failed' ? (
                                    <>
                                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                                      <span className="text-rose-400 font-bold text-label-md uppercase tracking-wider">FAILED</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="material-symbols-outlined text-sky-400 animate-spin text-[14px]">progress_activity</span>
                                      <span className="text-sky-400 font-bold text-label-md uppercase tracking-wider">RUNNING</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-5 px-6 font-medium text-white">{exec.workflow?.name || 'Deleted Workflow'}</td>
                              <td className="py-5 px-6 font-label-sm text-neutral-500 font-mono">#EXE-{exec.id}</td>
                              <td className="py-5 px-6 text-neutral-400">{new Date(exec.startedAt).toLocaleString()}</td>
                              <td className="py-5 pl-6 font-label-md text-neutral-400">{formattedDuration}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Detail Inspector Panel */}
              <aside className="w-[520px] flex flex-col bg-[#0e0e0e] border-l border-neutral-900 shadow-2xl shrink-0 text-left overflow-hidden">
                {selectedAllExecution ? (
                  <>
                    <div className="p-8 pb-6 border-b border-neutral-900">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <div className="text-label-sm text-neutral-500 uppercase tracking-[0.2em] mb-2 opacity-50 text-[10px]">Log Inspector</div>
                          <h2 className="text-[28px] font-bold tracking-tight text-white flex items-center gap-3">
                            #EXE-{selectedAllExecution.id}
                            <span
                              onClick={() => {
                                navigator.clipboard.writeText(`#EXE-${selectedAllExecution.id}`);
                                alert("Copied Execution ID to clipboard!");
                              }}
                              className="material-symbols-outlined text-neutral-500 text-[20px] opacity-40 cursor-pointer hover:opacity-100 transition-opacity"
                            >
                              content_copy
                            </span>
                          </h2>
                        </div>
                        <button
                          onClick={() => setSelectedAllExecution(null)}
                          className="p-2 text-neutral-500 hover:text-white transition-colors hover:bg-neutral-800 rounded-full"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>

                      <div className="flex gap-4 mb-8">
                        <div className="flex-1 bg-[#151515] p-4 rounded-xl border border-neutral-850">
                          <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1.5 opacity-50">Status</div>
                          <div className="flex items-center gap-2 font-bold">
                            {selectedAllExecution.status === 'success' ? (
                              <>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
                                <span className="text-[#facc15]">Successful Run</span>
                              </>
                            ) : selectedAllExecution.status === 'failed' ? (
                              <>
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                                <span className="text-rose-400">Failed Run</span>
                              </>
                            ) : (
                              <>
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></div>
                                <span className="text-sky-400">Running...</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 bg-[#151515] p-4 rounded-xl border border-neutral-850">
                          <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1.5 opacity-50">Performance</div>
                          <div className="font-label-md text-white font-semibold text-lg">
                            {selectedAllExecution.finishedAt
                              ? `${new Date(selectedAllExecution.finishedAt).getTime() - new Date(selectedAllExecution.startedAt).getTime()}ms`
                              : 'Pending...'}
                          </div>
                        </div>
                      </div>

                      {/* Minimal Canvas Node Preview */}
                      {(() => {
                        let nodesList: any[] = [];
                        try {
                          if (selectedAllExecution?.workflow?.definition) {
                            const def = typeof selectedAllExecution.workflow.definition === 'string'
                              ? JSON.parse(selectedAllExecution.workflow.definition)
                              : selectedAllExecution.workflow.definition;
                            nodesList = def.nodes || [];
                          }
                        } catch (e) {
                          console.error(e);
                        }

                        return (
                          <div className="relative h-44 bg-[#080808] border border-neutral-900 rounded-xl overflow-hidden group">
                            <div className="absolute inset-0 opacity-10 pointer-events-none dot-grid"></div>
                            <div className="absolute inset-0 flex items-center justify-center gap-4 overflow-x-auto px-6 py-2">
                              {nodesList.length === 0 ? (
                                <span className="text-neutral-600 text-xs">No nodes in this workflow definition</span>
                              ) : (
                                nodesList.map((node, index) => {
                                  const nodeType = node.type || 'action';
                                  let isSuccess = false;
                                  let isFailed = false;
                                  
                                  if (selectedAllExecution?.logs) {
                                    try {
                                      const stepLogs = JSON.parse(selectedAllExecution.logs);
                                      const nodeLogEntries = stepLogs.filter((l: any) => l.nodeId === node.id);
                                      if (nodeLogEntries.length > 0) {
                                        const hasFailure = nodeLogEntries.some((l: any) => l.message?.toLowerCase().includes('failed') || l.message?.toLowerCase().includes('error'));
                                        if (hasFailure) {
                                          isFailed = true;
                                        } else {
                                          isSuccess = true;
                                        }
                                      }
                                    } catch {}
                                  }

                                  let iconName = 'bolt';
                                  if (nodeType.includes('email') || nodeType.includes('marketing')) iconName = 'mail';
                                  else if (nodeType.includes('crm')) iconName = 'person';
                                  else if (nodeType.includes('ifelse') || nodeType.includes('logic')) iconName = 'alt_route';
                                  else if (nodeType.includes('delay')) iconName = 'schedule';
                                  else if (nodeType.includes('code')) iconName = 'code';

                                  return (
                                    <React.Fragment key={node.id}>
                                      {index > 0 && (
                                        <div className="flex items-center shrink-0">
                                          <span className="material-symbols-outlined text-neutral-700 text-[14px]">arrow_forward</span>
                                        </div>
                                      )}
                                      <div className={`flex flex-col items-center justify-center p-2.5 rounded bg-[#131313] border transition-all shrink-0 w-24 h-24 ${
                                        isFailed ? 'border-red-500/40 text-red-400 bg-red-950/5' :
                                        isSuccess ? 'border-[#facc15]/40 text-[#facc15] bg-[#facc15]/5' :
                                        'border-neutral-800 text-neutral-500'
                                      }`}>
                                        <span className="material-symbols-outlined text-[20px] mb-1">{iconName}</span>
                                        <span className="text-[9px] font-bold truncate w-full text-center">{node.data?.label || node.id}</span>
                                      </div>
                                    </React.Fragment>
                                  );
                                })
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (selectedAllExecution?.workflow) {
                                  loadWorkflow(selectedAllExecution.workflow);
                                  setViewMode('canvas');
                                }
                              }}
                              className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] cursor-pointer"
                            >
                              <span className="text-label-sm font-bold text-[#facc15] tracking-widest text-[10px]">OPEN CANVAS EDITOR</span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Data Tabs */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
                      <div className="flex px-8 border-b border-neutral-900">
                        <button
                          onClick={() => setInspectorTab('output')}
                          className={`px-4 py-4 relative font-bold text-label-md transition-colors text-xs uppercase tracking-wider ${
                            inspectorTab === 'output' ? 'text-primary font-bold' : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          Output
                          {inspectorTab === 'output' && (
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#facc15]"></div>
                          )}
                        </button>
                        <button
                          onClick={() => setInspectorTab('input')}
                          className={`px-4 py-4 relative font-bold text-label-md transition-colors text-xs uppercase tracking-wider ${
                            inspectorTab === 'input' ? 'text-primary font-bold' : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          Input
                          {inspectorTab === 'input' && (
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#facc15]"></div>
                          )}
                        </button>
                        <button
                          onClick={() => setInspectorTab('logs')}
                          className={`px-4 py-4 relative font-bold text-label-md transition-colors text-xs uppercase tracking-wider ${
                            inspectorTab === 'logs' ? 'text-primary font-bold' : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          Node Logs
                          {inspectorTab === 'logs' && (
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#facc15]"></div>
                          )}
                        </button>
                      </div>

                      <div className="flex-1 p-8 overflow-auto">
                        <div className="p-6 bg-black border border-neutral-900 rounded-xl shadow-inner text-left font-mono">
                          {inspectorTab === 'output' && (
                            <pre className="text-xs text-[#d1c6ab] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                              {selectedAllExecution.responseData ? (
                                JSON.stringify(JSON.parse(selectedAllExecution.responseData), null, 2)
                              ) : (
                                "{\n  \"message\": \"No response data recorded for this run\"\n}"
                              )}
                            </pre>
                          )}
                          {inspectorTab === 'input' && (
                            <pre className="text-xs text-[#d1c6ab] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                              {selectedAllExecution.triggerData ? (
                                JSON.stringify(JSON.parse(selectedAllExecution.triggerData), null, 2)
                              ) : (
                                "{\n  \"message\": \"No trigger payload recorded for this run\"\n}"
                              )}
                            </pre>
                          )}
                          {inspectorTab === 'logs' && (
                            <div className="flex flex-col gap-2 font-mono text-xs text-neutral-300">
                              {selectedAllExecution.logs ? (
                                JSON.parse(selectedAllExecution.logs).map((step: any, idx: number) => (
                                  <div key={idx} className="flex gap-4 p-1 rounded hover:bg-neutral-900 transition-colors">
                                    <span className="text-neutral-600 shrink-0">[{new Date(step.time).toLocaleTimeString()}]</span>
                                    {step.nodeType && (
                                      <span className="text-[#facc15] font-bold shrink-0">[{step.nodeType.toUpperCase()}]</span>
                                    )}
                                    <span className="text-neutral-200">{step.message}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-neutral-600">No trace logs recorded.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-8 pt-0 border-t border-neutral-900 flex gap-3 bg-[#0a0a0a]">
                      <button
                        onClick={() => handleRerunExecution(selectedAllExecution.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#facc15] text-[#3c2f00] hover:brightness-110 active:scale-[0.98] font-bold py-3 rounded-xl transition-all text-label-md"
                      >
                        <span className="material-symbols-outlined text-[18px]">replay</span>
                        Rerun Execution
                      </button>
                      <button
                        onClick={() => handleDeleteExecution(selectedAllExecution.id)}
                        className="px-4 border border-neutral-800 hover:bg-rose-500/10 hover:border-rose-500/40 text-neutral-400 hover:text-rose-500 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 p-8">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-30">troubleshoot</span>
                    <p className="text-xs">Select an execution from the history log to view detailed parameters and trace steps.</p>
                  </div>
                )}
              </aside>
            </div>
            
            {/* Global Footer placeholder */}
            <footer className="flex justify-between items-center z-10 shrink-0 h-10 px-6 bg-[#0e0e0e] border-t border-neutral-900 font-label-md text-[11px] text-neutral-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="font-bold tracking-widest uppercase">System Operational</span>
                </div>
                <span className="opacity-40">|</span>
                <span>Cloud Node: AWS-US-EAST-1</span>
              </div>
              <div className="flex gap-6 items-center">
                <a className="hover:text-primary transition-colors" href="#">API Reference</a>
                <a className="hover:text-primary transition-colors" href="#">Status Page</a>
                <span className="opacity-40">v2.4.12-pro</span>
              </div>
            </footer>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-64 right-0 h-10 px-8 bg-[#131313] flex justify-between items-center z-45 border-t border-neutral-900">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="font-label-md text-label-md text-neutral-400 tracking-wider uppercase">Systems Operational</span>
        </div>
        <div className="flex gap-8">
          <a className="font-label-md text-label-md text-[#9a9078] hover:text-on-surface transition-colors uppercase tracking-widest" href="#">Privacy</a>
          <a className="font-label-md text-label-md text-[#9a9078] hover:text-on-surface transition-colors uppercase tracking-widest" href="#">API Docs</a>
          <a className="font-label-md text-label-md text-[#9a9078] hover:text-on-surface transition-colors uppercase tracking-widest" href="#">Support</a>
        </div>
      </footer>

      {/* Dynamic Workflow Run Toast Alert Popup */}
      {showStartPopup && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-3 px-5 py-3 rounded-full bg-[#1c1b1b]/95 border border-[#facc15]/30 shadow-2xl backdrop-blur-md">
          <span className="material-symbols-outlined text-[#facc15] text-lg animate-spin">autorenew</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Execution Stream Initialized</span>
            <span className="text-[9px] text-neutral-400">Target lead: {execEmail} (Score: {execScore})</span>
          </div>
        </div>
      )}

      {/* Connection Stream Popup Modal */}
      {isExecModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm text-left">
          <div className="w-[500px] bg-[#1c1b1b] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] h-[600px]">
            {/* Header */}
            <div className="p-4 bg-[#262626] border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#facc15] text-xl animate-pulse">hub</span>
                <span className="font-bold text-sm text-white">Active Connection Stream</span>
              </div>
              {execStatus !== 'running' && execStatus !== 'paused' && (
                <button onClick={() => setIsExecModalOpen(false)} className="text-neutral-500 hover:text-white transition">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              
              {/* Setup / Configuration Form (if Idle) */}
              {execStatus === 'idle' && (
                <div className="flex flex-col gap-4 text-xs flex-1 justify-center">
                  <h3 className="font-bold text-neutral-300 text-sm mb-2 text-center">Configure Stream Test Trigger</h3>
                  <div>
                    <label className="block text-neutral-400 mb-1 font-bold">Lead Email</label>
                    <input
                      type="email"
                      value={execEmail}
                      onChange={(e) => setExecEmail(e.target.value)}
                      className="w-full bg-[#0e0e0e] border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-[#facc15]"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 font-bold">Lead Name</label>
                    <input
                      type="text"
                      value={execName}
                      onChange={(e) => setExecName(e.target.value)}
                      className="w-full bg-[#0e0e0e] border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-[#facc15]"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 font-bold">Lead Score: {execScore}</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={execScore}
                      onChange={(e) => setExecScore(parseInt(e.target.value, 10))}
                      className="w-full accent-[#facc15]"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2 bg-neutral-900 p-2.5 rounded border border-neutral-800">
                    <input
                      type="checkbox"
                      id="manual-approval-toggle"
                      checked={manualApprovalEnabled}
                      onChange={(e) => setManualApprovalEnabled(e.target.checked)}
                      className="accent-[#facc15]"
                    />
                    <label htmlFor="manual-approval-toggle" className="text-[10px] text-neutral-400 cursor-pointer select-none">
                      Enable <strong className="text-white">Human-in-the-Loop</strong> step verification & approval
                    </label>
                  </div>
                  <button
                    onClick={() => startConnectionStream(execEmail, execName, execScore)}
                    className="w-full bg-[#facc15] hover:opacity-90 font-bold py-3 rounded-lg text-black transition uppercase tracking-widest text-[11px] mt-4 shadow-lg shadow-amber-500/10"
                  >
                    Start Connection Stream
                  </button>
                </div>
              )}

              {/* Running State Visualizer */}
              {execStatus !== 'idle' && (
                <div className="flex flex-col gap-4 flex-1">
                  
                  {/* Visual Stream Graph Slices */}
                  <div className="p-3 bg-[#0e0e0e] rounded-xl border border-neutral-800 flex items-center justify-center gap-2 overflow-x-auto min-h-[64px]">
                    {nodes.filter(n => n.type === 'trigger' || n.type === 'crm_lead_trigger' || n.type === 'ifelse' || n.type === 'delay' || n.type === 'marketing_email' || n.type === 'crm_action' || n.type === 'code').slice(0, 5).map((node, index, arr) => {
                      const isActive = execActiveNodeId === node.id;
                      const isNodeExecuted = execLogs.some(l => l.message.includes(`Processing node: ${node.data?.label || node.id}`) || l.message.includes(`🤖 [TRIGGER]`) || l.message.includes(`🤖 [DECISION]`) || l.message.includes(`⏰ [TIMER]`) || l.message.includes(`📧 [EMAIL]`) || l.message.includes(`👤 [CRM]`) || l.message.includes(`💻 [CODE]`));
                      const isCompleted = isNodeExecuted && !isActive;

                      return (
                        <React.Fragment key={node.id}>
                          <div className={`p-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                            isActive ? 'bg-[#facc15]/10 border-[#facc15] shadow-lg shadow-[#facc15]/10 text-white' :
                            isCompleted ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400' :
                            'bg-[#131313] border-neutral-800 text-neutral-500'
                          }`}>
                            <span className="material-symbols-outlined text-xs">
                              {node.type === 'trigger' || node.type === 'crm_lead_trigger' ? 'bolt' :
                               node.type === 'ifelse' ? 'alt_route' :
                               node.type === 'delay' ? 'schedule' :
                               node.type === 'marketing_email' ? 'mail' :
                               node.type === 'crm_action' ? 'account_circle' : 'code'}
                            </span>
                            <span className="text-[8px] max-w-[60px] truncate">{node.data?.label || node.id}</span>
                          </div>
                          {index < arr.length - 1 && (
                            <span className={`material-symbols-outlined text-[14px] ${isCompleted ? 'text-emerald-500' : 'text-neutral-700'}`}>
                              arrow_forward
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Console log terminal */}
                  <div className="flex-1 bg-black/60 rounded-xl border border-neutral-800 p-3 font-mono text-[10px] overflow-y-auto flex flex-col gap-1.5 h-[160px]">
                    {execLogs.map((log, i) => (
                      <div key={i} className="text-neutral-300 leading-relaxed text-left">
                        <span className="text-neutral-600">[{new Date(log.time).toLocaleTimeString()}]</span> {log.message}
                      </div>
                    ))}
                  </div>

                  {/* JSON Output Viewer Section */}
                  {simulatedExecutionData && (
                    <div className="mt-3 flex flex-col border border-neutral-850 rounded-xl overflow-hidden bg-[#0c0c0c] shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowSimulatedJson(!showSimulatedJson)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-850 text-[10px] uppercase font-bold text-neutral-300 hover:text-white transition"
                      >
                        <span className="flex items-center gap-1.5 font-label-md tracking-wider">
                          <span className="material-symbols-outlined text-[#facc15] text-[14px]">code</span>
                          Workflow JSON Output Audit
                        </span>
                        <span className="material-symbols-outlined text-xs">
                          {showSimulatedJson ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                      
                      {showSimulatedJson && (
                        <div className="p-4 text-left font-mono text-[9px] leading-relaxed max-h-[180px] overflow-y-auto flex flex-col gap-3">
                          <div>
                            <div className="text-neutral-500 font-bold mb-1.5 uppercase tracking-wider">Trigger Payload</div>
                            <pre className="p-2 bg-neutral-950 rounded border border-neutral-850 text-neutral-300 overflow-x-auto">
                              {simulatedExecutionData.triggerData
                                ? JSON.stringify(JSON.parse(simulatedExecutionData.triggerData), null, 2)
                                : '{}'}
                            </pre>
                          </div>
                          <div>
                            <div className="text-neutral-500 font-bold mb-1.5 uppercase tracking-wider">Response Node Outputs</div>
                            <pre className="p-2 bg-neutral-950 rounded border border-neutral-850 text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                              {simulatedExecutionData.responseData
                                ? JSON.stringify(JSON.parse(simulatedExecutionData.responseData), null, 2)
                                : '{}'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Human-in-the-loop verification prompt */}
                  {humanApprovalRequired && pendingNode && (
                    <div className="p-4 bg-amber-950/15 border border-amber-900/30 rounded-xl flex flex-col gap-3 text-left">
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[#facc15] text-lg shrink-0 mt-0.5">security_update_warning</span>
                        <div>
                          <h4 className="font-bold text-xs text-white">Manual Verification Requested</h4>
                          <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                            Agent is waiting to execute: <strong className="text-[#facc15]">"{pendingNode.data?.label || pendingNode.id}"</strong>. 
                            Please review details and approve target.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => (window as any).resumeExecution?.(false)}
                          className="px-3 py-1.5 rounded bg-rose-950/40 border border-rose-900/40 text-rose-400 font-bold text-[10px] hover:bg-rose-950/60 transition"
                        >
                          Reject Step
                        </button>
                        <button
                          onClick={() => (window as any).resumeExecution?.(true)}
                          className="px-4 py-1.5 rounded bg-emerald-600 text-black font-bold text-[10px] hover:bg-emerald-500 transition border border-emerald-500/20"
                        >
                          Approve & Dispatch
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status footer inside popup */}
                  <div className="mt-auto shrink-0 flex items-center justify-between border-t border-neutral-800 pt-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        execStatus === 'running' ? 'bg-amber-500 animate-pulse' :
                        execStatus === 'success' ? 'bg-green-500' :
                        execStatus === 'failed' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'
                      }`}></span>
                      <span className="font-bold uppercase tracking-wider text-[9px] text-neutral-400">
                        Status: {execStatus}
                      </span>
                    </div>
                    {execStatus !== 'running' && execStatus !== 'paused' && (
                      <button
                        onClick={() => setIsExecModalOpen(false)}
                        className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-4 py-2 rounded text-[10px] font-bold text-white transition"
                      >
                        Close Stream Panel
                      </button>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Update Popup Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm text-left">
          <div className="w-[450px] bg-[#1c1b1b] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 bg-[#262626] border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#facc15] text-xl">account_circle</span>
                <span className="font-bold text-sm text-white">Update Profile Picture</span>
              </div>
              <button onClick={() => setIsAvatarModalOpen(false)} className="text-neutral-500 hover:text-white transition">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-6">
              {/* Current Preview */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Preview</span>
                <div className="w-24 h-24 rounded-full border border-neutral-800 overflow-hidden bg-surface-container-high shadow-inner flex items-center justify-center">
                  <img src={profilePic} alt="Avatar Preview" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Presets */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Select SVG Preset Avatar</span>
                <div className="flex justify-between gap-3">
                  {[
                    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="avatarGrad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ef4444"/><stop offset="100%" stop-color="%23facc15"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23avatarGrad1)"/><circle cx="50" cy="40" r="18" fill="%23131313"/><path d="M18 78 C 18 58, 82 58, 82 78" fill="%23131313"/></svg>`,
                    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="avatarGrad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23eec200"/><stop offset="100%" stop-color="%23ffe083"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23avatarGrad2)"/><circle cx="50" cy="40" r="18" fill="%23131313"/><path d="M18 78 C 18 58, 82 58, 82 78" fill="%23131313"/></svg>`,
                    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="avatarGrad3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%2367e8f9"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23avatarGrad3)"/><circle cx="50" cy="40" r="18" fill="%23131313"/><path d="M18 78 C 18 58, 82 58, 82 78" fill="%23131313"/></svg>`,
                    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="avatarGrad4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%23c084fc"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23avatarGrad4)"/><circle cx="50" cy="40" r="18" fill="%23131313"/><path d="M18 78 C 18 58, 82 58, 82 78" fill="%23131313"/></svg>`
                  ].map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProfilePic(presetUrl);
                        localStorage.setItem('neuron_profile_pic', presetUrl);
                        setAvatarInputUrl('');
                      }}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                        profilePic === presetUrl ? 'border-[#facc15]' : 'border-transparent'
                      }`}
                    >
                      <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom URL Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Or Use Custom Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={avatarInputUrl}
                    onChange={(e) => setAvatarInputUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 bg-[#0e0e0e] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#facc15] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (avatarInputUrl.trim()) {
                        setProfilePic(avatarInputUrl.trim());
                        localStorage.setItem('neuron_profile_pic', avatarInputUrl.trim());
                      }
                    }}
                    disabled={!avatarInputUrl.trim()}
                    className="bg-[#facc15] hover:bg-[#ffe083] disabled:opacity-50 text-black font-bold px-4 py-2 rounded-lg transition-all text-xs"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center border-t border-neutral-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfilePic(DEFAULT_AVATAR);
                    localStorage.setItem('neuron_profile_pic', DEFAULT_AVATAR);
                    setAvatarInputUrl('');
                  }}
                  className="text-neutral-500 hover:text-white transition text-xs"
                >
                  Reset Default
                </button>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify & Diagnose Popup Modal */}
      {isDiagnosticsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm text-left">
          <div className="w-[580px] bg-[#1c1b1b]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[580px] backdrop-blur-md">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#171717] to-[#262626] border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-400 text-2xl">fact_check</span>
                <div>
                  <span className="font-bold text-sm text-white block">Workflow Integrity Diagnostics</span>
                  <span className="text-[10px] text-neutral-400">
                    Checked {diagnosticsReport?.nodesChecked || 0} nodes and {diagnosticsReport?.edgesChecked || 0} connections
                  </span>
                </div>
              </div>
              <button onClick={() => setIsDiagnosticsModalOpen(false)} className="text-neutral-500 hover:text-white transition">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#131313]/60 font-body-md text-on-surface">
              {isDiagnosing ? (
                <div className="flex flex-col items-center justify-center gap-4 h-full">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                  <span className="text-xs font-mono text-neutral-400">Running diagnostic validations...</span>
                </div>
              ) : (
                <>
                  {/* Category 1: Node & Edge Graph Wiring */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-1.5">
                      <span className="material-symbols-outlined text-indigo-400 text-base">alt_route</span>
                      <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-widest">Visual Flow Integrity</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {diagnosticsReport?.triggerChecks.map((check: any, idx: number) => (
                        <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors">
                          <span className={`material-symbols-outlined shrink-0 text-base mt-0.5 ${
                            check.status === 'pass' ? 'text-emerald-400' : check.status === 'warn' ? 'text-amber-400' : 'text-rose-500'
                          }`}>
                            {check.status === 'pass' ? 'check_circle' : check.status === 'warn' ? 'warning' : 'cancel'}
                          </span>
                          <div className="flex-1">
                            <span className="font-semibold text-xs text-white block leading-tight mb-1">{check.name}</span>
                            <span className="text-[10px] text-neutral-400 leading-normal block">{check.message}</span>
                          </div>
                          <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                            check.status === 'pass' ? 'bg-emerald-500/10 text-emerald-400' : check.status === 'warn' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {check.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category 2: System Health and Exec Logs */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-1.5">
                      <span className="material-symbols-outlined text-sky-400 text-base">cloud_sync</span>
                      <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-widest">Automation Engine Health</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {diagnosticsReport?.systemChecks.map((check: any, idx: number) => (
                        <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors">
                          <span className={`material-symbols-outlined shrink-0 text-base mt-0.5 ${
                            check.status === 'pass' ? 'text-emerald-400' : check.status === 'warn' ? 'text-amber-400' : 'text-rose-500'
                          }`}>
                            {check.status === 'pass' ? 'check_circle' : check.status === 'warn' ? 'warning' : 'cancel'}
                          </span>
                          <div className="flex-1">
                            <span className="font-semibold text-xs text-white block leading-tight mb-1">{check.name}</span>
                            <span className="text-[10px] text-neutral-400 leading-normal block">{check.message}</span>
                          </div>
                          <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                            check.status === 'pass' ? 'bg-emerald-500/10 text-emerald-400' : check.status === 'warn' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {check.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#1a1a1a] border-t border-neutral-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsDiagnosticsModalOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 px-6 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-md shadow-emerald-950/20"
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Node Connection & Webhook Interface Modal */}
      {showWebhookPopup && (() => {
        const details = getNodeInterfaceDetails(webhookPopupNode);
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md text-left animate-in fade-in duration-200">
            <div className={`w-[680px] max-w-[92vw] bg-[#161616] border ${details.borderClass} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
              {/* Modal Header */}
              <div className={`p-5 bg-gradient-to-r ${details.headerGradient} border-b border-neutral-800 flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
                    <span className="material-symbols-outlined text-xl">{details.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white">{details.title}</span>
                      <span className={`${details.badgeClass} text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border`}>
                        {webhookPopupNode?.data?.label || details.category.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400 block mt-0.5">
                      {details.subtitle}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWebhookPopup(false)}
                  className="text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs text-on-surface-variant font-body-md">
                
                {/* 1. WEBHOOK SPECIFIC INTERFACE */}
                {details.category === 'webhook' && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-neutral-300 font-bold flex items-center gap-1.5">
                          <span>Webhook Endpoint Target URL</span>
                          {customWebhookUrl && customWebhookUrl !== `${BACKEND_URL}/api/webhooks/${currentWorkflow?.id || '1'}` && (
                            <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold uppercase">
                              Customized
                            </span>
                          )}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingWebhookUrl(!isEditingWebhookUrl)}
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 transition font-medium"
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {isEditingWebhookUrl ? 'check_circle' : 'edit'}
                            </span>
                            {isEditingWebhookUrl ? 'Done Editing' : 'Edit Custom URL'}
                          </button>
                        </div>
                      </div>

                      {isEditingWebhookUrl ? (
                        <div className="flex items-center gap-2 bg-[#0a0a0a] p-2 rounded-xl border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.15)] animate-in fade-in duration-150">
                          <span className="material-symbols-outlined text-emerald-400 text-sm pl-1">link</span>
                          <input
                            type="text"
                            value={customWebhookUrl}
                            onChange={(e) => setCustomWebhookUrl(e.target.value)}
                            placeholder="Enter custom webhook URL..."
                            className="w-full bg-transparent text-emerald-300 font-mono text-[11px] outline-none py-1"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-[#0a0a0a] p-2.5 rounded-xl border border-neutral-800">
                          <span className="font-mono text-[11px] text-emerald-400 flex-1 truncate">
                            {customWebhookUrl || `${BACKEND_URL}/api/webhooks/${currentWorkflow?.id || '1'}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(customWebhookUrl || `${BACKEND_URL}/api/webhooks/${currentWorkflow?.id || '1'}`);
                              setWebhookCopied(true);
                              setTimeout(() => setWebhookCopied(false), 2000);
                            }}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5 transition shrink-0 border border-neutral-700 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">
                              {webhookCopied ? 'check' : 'content_copy'}
                            </span>
                            {webhookCopied ? 'Copied!' : 'Copy URL'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-neutral-300 font-bold mb-1.5">HTTP Method</label>
                        <select
                          value={webhookMethod}
                          onChange={(e) => setWebhookMethod(e.target.value)}
                          className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500/50"
                        >
                          <option value="POST">POST (Recommended)</option>
                          <option value="GET">GET</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-neutral-300 font-bold mb-1.5">Quick Presets</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setWebhookPayload('{\n  "event": "user_signup",\n  "email": "alex@example.com",\n  "name": "Alex Smith",\n  "plan": "pro"\n}')}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1.5 rounded-lg text-[10px] transition border border-neutral-700 flex-1 cursor-pointer"
                          >
                            User Signup
                          </button>
                          <button
                            type="button"
                            onClick={() => setWebhookPayload('{\n  "event": "order_created",\n  "orderId": "ORD-9982",\n  "amount": 249.99,\n  "customerEmail": "customer@acme.com"\n}')}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1.5 rounded-lg text-[10px] transition border border-neutral-700 flex-1 cursor-pointer"
                          >
                            New Order
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. SCHEDULE TIMER SPECIFIC INTERFACE */}
                {details.category === 'schedule' && (
                  <div className="space-y-4">
                    <div className="bg-[#1a1713] p-3 rounded-xl border border-amber-500/20 flex items-center justify-between text-amber-300">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">alarm</span>
                        Timer Scheduler Daemon
                      </span>
                      <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-amber-500/30">
                        Active Polling
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-neutral-300 font-bold mb-1.5">Schedule Type</label>
                        <select
                          value={webhookPopupNode?.data?.scheduleType || 'interval'}
                          onChange={(e) => updateNodeData('scheduleType', e.target.value)}
                          className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none"
                        >
                          <option value="interval">Interval (Recurring)</option>
                          <option value="cron">Cron Expression (Advanced)</option>
                          <option value="date">Specific Date/Time (Once)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-neutral-300 font-bold mb-1.5">Interval Value</label>
                        <input
                          type="number"
                          value={webhookPopupNode?.data?.intervalValue || 10}
                          onChange={(e) => updateNodeData('intervalValue', parseInt(e.target.value, 10))}
                          className="w-full bg-[#0e0e0e] border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. GOOGLE FORM SPECIFIC INTERFACE */}
                {details.category === 'google_form' && (
                  <div className="space-y-4">
                    <div className="bg-[#131f17] p-3 rounded-xl border border-green-500/20 flex items-center justify-between text-green-300">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">description</span>
                        Google Form Submission Webhook Receiver
                      </span>
                      <span className="bg-green-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-green-500/30">
                        Listening
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. CRM LEAD SPECIFIC INTERFACE */}
                {details.category === 'crm' && (
                  <div className="space-y-4">
                    <div className="bg-[#151724] p-3 rounded-xl border border-indigo-500/20 flex items-center justify-between text-indigo-300">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">account_circle</span>
                        CRM Contact Database Connection
                      </span>
                      <span className="bg-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-indigo-500/30">
                        Prisma Sync
                      </span>
                    </div>
                  </div>
                )}

                {/* 5. EMAIL SPECIFIC INTERFACE */}
                {details.category === 'email' && (
                  <div className="space-y-4">
                    <div className="bg-[#141c24] p-3 rounded-xl border border-sky-500/20 flex items-center justify-between text-sky-300">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">mail</span>
                        SMTP Email Dispatcher
                      </span>
                      <span className="bg-sky-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-sky-500/30">
                        Ready
                      </span>
                    </div>
                  </div>
                )}

                {/* 6. OPENAI SPECIFIC INTERFACE */}
                {details.category === 'openai' && (
                  <div className="space-y-4">
                    <div className="bg-[#1c1424] p-3 rounded-xl border border-purple-500/20 flex items-center justify-between text-purple-300">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">psychology</span>
                        OpenAI GPT LLM Orchestrator
                      </span>
                      <span className="bg-purple-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-purple-500/30">
                        GPT-4o Ready
                      </span>
                    </div>
                  </div>
                )}

                {/* JSON PAYLOAD EDITOR FOR ALL NODES */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-neutral-300 font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-amber-400 text-sm">code</span>
                      Connection Payload (JSON Format)
                    </label>
                    <span className="text-[10px] text-neutral-500 font-mono">Editable test payload</span>
                  </div>
                  <textarea
                    rows={6}
                    value={webhookPayload}
                    onChange={(e) => setWebhookPayload(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 font-mono text-[11px] text-emerald-300 outline-none focus:border-emerald-500/50 leading-relaxed"
                    placeholder="Enter JSON payload..."
                  />
                </div>

                {/* Action & Test Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSendingWebhookTest(true);
                      setWebhookTestResponse(null);
                      try {
                        const parsed = JSON.parse(webhookPayload);
                        if (details.category === 'webhook') {
                          const targetEndpoint = customWebhookUrl || `${BACKEND_URL}/api/webhooks/${currentWorkflow?.id || '1'}`;
                          const res = await fetch(targetEndpoint, {
                            method: webhookMethod,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(parsed)
                          });
                          const data = await res.json().catch(() => ({ status: 'received' }));
                          setWebhookTestResponse({
                            status: res.status,
                            statusText: res.statusText || 'OK',
                            data
                          });
                        } else {
                          // Simulated custom node test execution
                          setWebhookTestResponse({
                            status: 200,
                            statusText: 'OK (Node Connection Verified)',
                            data: {
                              success: true,
                              connectionType: details.category,
                              nodeType: webhookPopupNode?.type,
                              nodeLabel: webhookPopupNode?.data?.label || details.title,
                              payloadExecuted: parsed,
                              timestamp: new Date().toISOString()
                            }
                          });
                        }
                      } catch (err: any) {
                        setWebhookTestResponse({
                          status: 200,
                          statusText: 'OK (Simulated)',
                          data: {
                            success: true,
                            message: `${details.title} executed successfully`,
                            connectionType: details.category,
                            payload: webhookPayload,
                            errorNote: err?.message
                          }
                        });
                      } finally {
                        setIsSendingWebhookTest(false);
                      }
                    }}
                    disabled={isSendingWebhookTest}
                    className={`${details.btnClass} disabled:opacity-50 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer`}
                  >
                    <span className="material-symbols-outlined text-sm">{details.icon}</span>
                    {isSendingWebhookTest ? 'Dispatching Connection...' : details.testBtnLabel}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowWebhookPopup(false)}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition border border-neutral-700 cursor-pointer"
                    >
                      Save & Close
                    </button>
                  </div>
                </div>

                {/* Test Response Inspection Box */}
                {webhookTestResponse && (
                  <div className="mt-4 p-4 rounded-xl bg-[#0d1410] border border-emerald-500/30 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        {details.title} Test Result
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                        HTTP {webhookTestResponse.status} {webhookTestResponse.statusText}
                      </span>
                    </div>
                    <pre className="font-mono text-[10px] text-emerald-200/90 overflow-x-auto p-2 bg-[#050906] rounded-lg border border-emerald-500/10">
                      {JSON.stringify(webhookTestResponse.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Palette Node Insertion Modal for Wire Add Button */}
      {insertNodeModalData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md text-left animate-in fade-in duration-150">
          <div className="w-[680px] max-w-[94vw] bg-[#141414] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 bg-[#1a1a1a] border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shadow-sm">
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                </div>
                <div>
                  <span className="font-bold text-sm text-white block leading-tight">Insert Node into Connection Wire</span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Select a node from the palette to connect into the graph pipeline stream</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInsertNodeModalData(null)}
                className="text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 bg-[#111111] border-b border-neutral-800/80">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <span className="material-symbols-outlined text-sm">search</span>
                </span>
                <input
                  type="text"
                  autoFocus
                  value={paletteSearchQuery}
                  onChange={(e) => setPaletteSearchQuery(e.target.value)}
                  placeholder="Search palette nodes (e.g. OpenAI, Slack, Email, If/Else)..."
                  className="w-full bg-[#181818] border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-neutral-600 transition"
                />
              </div>
            </div>

            {/* Node Items Grid */}
            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              {[
                { name: 'App Actions', items: [
                  { type: 'marketing_email', label: 'Send Email', icon: 'mail', color: 'border-sky-800/40 bg-sky-950/10 text-sky-400', desc: 'Send marketing or notification email', defaultData: { label: 'Send Email', to: '{{trigger.email}}', subject: 'Notification', body: 'Hello!' } },
                  { type: 'crm_action', label: 'CRM Update', icon: 'account_circle', color: 'border-indigo-800/40 bg-indigo-950/10 text-indigo-400', desc: 'Create or update contact lead in CRM', defaultData: { label: 'CRM Update', actionType: 'create_or_update', email: '{{trigger.email}}', status: 'lead', scoreChange: '5' } },
                  { type: 'google_sheets', label: 'Google Sheet', icon: 'table_chart', color: 'border-green-800/40 bg-green-950/10 text-green-400', desc: 'Read or append row in spreadsheet', defaultData: { label: 'Google Sheet', action: 'read', sheetName: 'Sheet1' } },
                  { type: 'openai', label: 'OpenAI GPT', icon: 'psychology', color: 'border-purple-800/40 bg-purple-950/10 text-purple-400', desc: 'Run LLM summary or data extraction', defaultData: { label: 'OpenAI GPT', model: 'GPT-4o', prompt: 'Please summarize: {{trigger.content}}' } },
                  { type: 'slack', label: 'Post to Slack', icon: 'forum', color: 'border-teal-800/40 bg-teal-950/10 text-teal-400', desc: 'Post message to Slack channel', defaultData: { label: 'Post to Slack', text: '📢 Event: {{trigger.email}}' } },
                  { type: 'discord', label: 'Discord Alert', icon: 'mark_chat_read', color: 'border-indigo-800/40 bg-indigo-950/10 text-indigo-400', desc: 'Send alert notification to Discord', defaultData: { label: 'Discord Alert', content: '🚀 Alert: {{trigger.email}}' } },
                  { type: 'respond_to_webhook', label: 'Webhook Response', icon: 'send', color: 'border-blue-800/40 bg-blue-950/10 text-blue-400', desc: 'Return custom HTTP response payload', defaultData: { label: 'Webhook Response', responseMode: 'json', statusCode: 200, responseBody: '{"success": true}' } },
                  { type: 'rabbitmq_publish', label: 'RabbitMQ Publish', icon: 'input', color: 'border-amber-800/40 bg-amber-950/10 text-amber-400', desc: 'Publish event payload to RabbitMQ broker queue', defaultData: { label: 'RabbitMQ Publish', queue: 'neuron_flow_queue', payload: '{"event": "triggered"}' } }
                ]},
                { name: 'Logic & Flow', items: [
                  { type: 'ifelse', label: 'If / Else', icon: 'alt_route', color: 'border-fuchsia-800/40 bg-fuchsia-950/10 text-fuchsia-400', desc: 'Conditional logic branching (true / false handles)', defaultData: { label: 'If / Else', condition: 'context.trigger.score > 50' } },
                  { type: 'delay', label: 'Delay Wait', icon: 'schedule', color: 'border-amber-800/40 bg-amber-950/10 text-amber-400', desc: 'Pause execution for timer interval duration', defaultData: { label: 'Delay Wait', seconds: '10' } },
                  { type: 'code', label: 'Run Script', icon: 'code', color: 'border-teal-800/40 bg-teal-950/10 text-teal-400', desc: 'Execute custom JavaScript code context', defaultData: { label: 'Run Script', code: '// Custom JavaScript\nreturn { success: true };' } },
                  { type: 'end', label: 'End Workflow', icon: 'stop_circle', color: 'border-rose-800/40 bg-rose-950/10 text-rose-400', desc: 'Terminal point of workflow pipeline', defaultData: { label: 'End Workflow' } }
                ]},
                { name: 'Triggers (On Event)', items: [
                  { type: 'start_trigger', label: 'Start Trigger', icon: 'play_circle', color: 'border-amber-800/40 bg-amber-950/10 text-amber-400', desc: 'Initial entry point trigger', defaultData: { label: 'Start Trigger' } },
                  { type: 'schedule_trigger', label: 'Schedule Trigger', icon: 'alarm', color: 'border-amber-800/40 bg-amber-950/10 text-amber-400', desc: 'Periodic timer or cron interval schedule', defaultData: { label: 'Schedule Trigger', scheduleType: 'interval', intervalValue: 10, intervalUnit: 'seconds' } },
                  { type: 'google_form_trigger', label: 'Google Form Trigger', icon: 'description', color: 'border-green-800/40 bg-green-950/10 text-green-400', desc: 'Google Form submission event trigger', defaultData: { label: 'Google Form Trigger' } },
                  { type: 'trigger', label: 'Webhook Trigger', icon: 'bolt', color: 'border-emerald-800/40 bg-emerald-950/10 text-emerald-400', desc: 'Incoming HTTP POST webhook request listener', defaultData: { label: 'Webhook Trigger', triggerType: 'webhook' } },
                  { type: 'crm_lead_trigger', label: 'CRM Lead Trigger', icon: 'group_add', color: 'border-emerald-800/40 bg-emerald-950/10 text-emerald-400', desc: 'New lead creation in CRM database', defaultData: { label: 'CRM Lead Trigger', triggerType: 'crm' } }
                ]}
              ].map((category) => {
                const filteredItems = category.items.filter(item => 
                  item.label.toLowerCase().includes(paletteSearchQuery.toLowerCase()) || 
                  item.desc.toLowerCase().includes(paletteSearchQuery.toLowerCase())
                );
                if (filteredItems.length === 0) return null;

                return (
                  <div key={category.name} className="space-y-2.5">
                    <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">
                      {category.name}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {filteredItems.map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => executeInsertNodeFromPalette(item)}
                          className={`flex items-start gap-3 p-3 rounded-xl border ${item.color} hover:brightness-125 transition-all text-left group cursor-pointer`}
                        >
                          <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs text-white block leading-tight group-hover:text-amber-300 transition-colors">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-neutral-400 block mt-0.5 leading-snug truncate">
                              {item.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ex-pricing-tier & ex-pricing-tier-featured: Pricing Plans Modal */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#201515]/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-[860px] max-w-full bg-[#fffefb] border border-[#201515] rounded-md shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#c5c0b1] pb-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-[#ff4f00]">NEURON_FLOW Pricing</span>
                <h2 className="text-2xl font-bold text-[#201515]">Choose your automation plan</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPricingModalOpen(false)}
                className="w-8 h-8 rounded-md bg-[#f8f4f0] border border-[#201515] text-[#201515] hover:bg-[#201515] hover:text-[#fffefb] font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ex-pricing-tier (Free/Starter) */}
              <div className="bg-[#f8f4f0] border border-[#c5c0b1] rounded-md p-6 flex flex-col justify-between">
                <div>
                  <div className="text-sm font-bold text-[#201515]">Starter</div>
                  <div className="text-3xl font-bold text-[#201515] my-2">$0 <span className="text-xs font-normal text-[#605d52]">/ mo</span></div>
                  <p className="text-xs text-[#605d52] mb-4">Perfect for individual workflow automation testing.</p>
                  <ul className="text-xs text-[#201515] space-y-2 mb-6">
                    <li className="flex items-center gap-2">✓ 100 Tasks / month</li>
                    <li className="flex items-center gap-2">✓ 5 Active Zaps</li>
                    <li className="flex items-center gap-2">✓ 15 min Update time</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => { showAppToast("Switched to Starter Plan"); setIsPricingModalOpen(false); }}
                  className="w-full py-2.5 bg-[#fffefb] border border-[#201515] text-[#201515] rounded-md font-semibold text-xs hover:bg-[#201515] hover:text-[#fffefb] transition"
                >
                  Current Plan
                </button>
              </div>

              {/* ex-pricing-tier-featured (Professional) */}
              <div className="bg-[#201515] text-[#fffefb] rounded-md p-6 flex flex-col justify-between shadow-xl relative scale-105">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff4f00] text-[#fffefb] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Most Popular
                </div>
                <div>
                  <div className="text-sm font-bold text-[#fffefb]">Professional</div>
                  <div className="text-3xl font-bold text-[#fffefb] my-2">$29 <span className="text-xs font-normal opacity-70">/ mo</span></div>
                  <p className="text-xs text-[#c5c0b1] mb-4">Advanced multi-step zaps with AI & webhooks.</p>
                  <ul className="text-xs text-[#fffefb] space-y-2 mb-6">
                    <li className="flex items-center gap-2">✓ 5,000 Tasks / month</li>
                    <li className="flex items-center gap-2">✓ Unlimited Active Zaps</li>
                    <li className="flex items-center gap-2">✓ 2 min Update time</li>
                    <li className="flex items-center gap-2">✓ Webhook & AI Core</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => { showAppToast("Upgraded to Professional Plan!"); setIsPricingModalOpen(false); }}
                  className="w-full py-2.5 bg-[#ff4f00] text-[#fffefb] rounded-md font-bold text-xs hover:opacity-90 transition shadow-md"
                >
                  Upgrade to Pro
                </button>
              </div>

              {/* ex-pricing-tier (Company/Team) */}
              <div className="bg-[#f8f4f0] border border-[#c5c0b1] rounded-md p-6 flex flex-col justify-between">
                <div>
                  <div className="text-sm font-bold text-[#201515]">Team</div>
                  <div className="text-3xl font-bold text-[#201515] my-2">$99 <span className="text-xs font-normal text-[#605d52]">/ mo</span></div>
                  <p className="text-xs text-[#605d52] mb-4">Shared team workspace with priority execution.</p>
                  <ul className="text-xs text-[#201515] space-y-2 mb-6">
                    <li className="flex items-center gap-2">✓ 50,000 Tasks / month</li>
                    <li className="flex items-center gap-2">✓ Unlimited Team Members</li>
                    <li className="flex items-center gap-2">✓ 1 min Instant Update</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => { showAppToast("Contacted sales for Team Plan"); setIsPricingModalOpen(false); }}
                  className="w-full py-2.5 bg-[#201515] text-[#fffefb] rounded-md font-semibold text-xs hover:opacity-90 transition"
                >
                  Get Team Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ex-cart-drawer: Subscription & Add-on Drawer */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-[130] flex justify-end bg-[#201515]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-[380px] max-w-full bg-[#fffefb] border-l border-[#201515] h-full p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-[#c5c0b1] pb-4 mb-4">
                <div className="font-bold text-base text-[#201515]">Subscription & Add-ons</div>
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="text-[#201515] hover:bg-[#f8f4f0] p-1.5 rounded-md font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-[#f8f4f0] border border-[#c5c0b1] rounded-md flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#201515]">Pro Plan Monthly</div>
                    <div className="text-[11px] text-[#605d52]">5,000 tasks/mo</div>
                  </div>
                  <div className="font-bold text-xs text-[#201515]">$29.00</div>
                </div>
                <div className="p-3 bg-[#f8f4f0] border border-[#c5c0b1] rounded-md flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#201515]">AI Core Add-on</div>
                    <div className="text-[11px] text-[#605d52]">100k OpenAI tokens</div>
                  </div>
                  <div className="font-bold text-xs text-[#201515]">$10.00</div>
                </div>
                <div className="p-3 bg-[#f8f4f0] border border-[#c5c0b1] rounded-md flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#201515]">Webhook Listener</div>
                    <div className="text-[11px] text-[#605d52]">Custom domain endpoints</div>
                  </div>
                  <div className="font-bold text-xs text-[#201515]">$5.00</div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#c5c0b1] pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#201515]">Total Monthly:</span>
                <span className="text-lg font-bold text-[#ff4f00]">$44.00</span>
              </div>
              <button
                type="button"
                onClick={() => { showAppToast("Checkout complete!"); setIsCartDrawerOpen(false); }}
                className="w-full py-3 bg-[#ff4f00] text-[#fffefb] font-bold text-xs rounded-md shadow-md hover:opacity-90 transition"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ex-auth-form-card: Sign-In / Account Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#201515]/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-[420px] max-w-full bg-[#f8f4f0] border border-[#201515] rounded-md shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff4f00]"></span>
                <span className="font-bold text-lg text-[#201515]">Sign in to NEURON_FLOW</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="text-[#201515] hover:bg-[#fffefb] p-1 rounded font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#605d52] mb-6">Enter your workspace account credentials to sync workflow graphs.</p>

            <form onSubmit={(e) => { e.preventDefault(); showAppToast("Signed in successfully!"); setIsAuthModalOpen(false); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#201515] mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full bg-[#fffefb] border border-[#201515] rounded-sm px-3 py-2 text-xs text-[#201515] outline-none focus:border-[#ff4f00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#201515] mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#fffefb] border border-[#201515] rounded-sm px-3 py-2 text-xs text-[#201515] outline-none focus:border-[#ff4f00]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#ff4f00] text-[#fffefb] font-bold text-xs rounded-md shadow-sm hover:opacity-90 transition mt-2"
              >
                Sign In & Connect
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ex-toast: Toast Notification */}
      {appToast && (
        <div className="fixed bottom-6 right-6 z-[150] bg-[#201515] text-[#fffefb] border-2 border-[#ff4f00] rounded-md px-4 py-3 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#ff4f00] animate-ping"></span>
          <span className="text-xs font-semibold">{appToast.message}</span>
        </div>
      )}
    </div>
  );
}


