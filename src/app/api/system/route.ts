import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { OPENCLAW_WORKSPACE, WORKSPACE_IDENTITY } from '@/lib/paths';

const WORKSPACE_PATH = OPENCLAW_WORKSPACE;
const IDENTITY_PATH = WORKSPACE_IDENTITY;
const ENV_LOCAL_PATH = path.join(process.cwd(), '.env.local');

function parseIdentityMd(): { name: string; creature: string; emoji: string } {
  try {
    const content = fs.readFileSync(IDENTITY_PATH, 'utf-8');
    const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/);
    const creatureMatch = content.match(/\*\*Creature:\*\*\s*(.+)/);
    const emojiMatch = content.match(/\*\*Emoji:\*\*\s*(.+)/);
    
    return {
      name: nameMatch?.[1]?.trim() || 'Unknown',
      creature: creatureMatch?.[1]?.trim() || 'AI Agent',
      emoji: emojiMatch?.[1]?.match(/./u)?.[0] || '🤖',
    };
  } catch {
    return { name: 'OpenClaw Agent', creature: 'AI Agent', emoji: '🤖' };
  }
}

function getIntegrationStatus() {
  const integrations: any[] = [];
  
  let openclawConfig: any = {};
  try {
    const defaultOpenclawDir = process.env.OPENCLAW_DIR || '/data/.openclaw';
    const openclawConfigPath = path.join(defaultOpenclawDir, 'openclaw.json');
    openclawConfig = JSON.parse(fs.readFileSync(openclawConfigPath, 'utf-8'));
  } catch (e) {
    try {
      const openclawConfigPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
      openclawConfig = JSON.parse(fs.readFileSync(openclawConfigPath, 'utf-8'));
    } catch (e) {}
  }

  // Telegram
  const telegramConfig = openclawConfig?.channels?.telegram;
  let telegramConnected = false;
  
  if (telegramConfig) {
    // Check if there's a token or botToken directly, or in accounts
    if (telegramConfig.token || telegramConfig.botToken) {
      telegramConnected = true;
    } else if (telegramConfig.accounts && Object.keys(telegramConfig.accounts).length > 0) {
      telegramConnected = true;
    }
  }
  
  integrations.push({
    id: 'telegram',
    name: 'Telegram',
    status: telegramConnected ? 'connected' : 'disconnected',
    icon: 'telegram',
    lastActivity: telegramConnected ? new Date().toISOString() : null,
  });

  // WhatsApp
  const whatsappConfig = openclawConfig?.channels?.whatsapp;
  let whatsappConnected = false;
  if (whatsappConfig && (whatsappConfig.token || whatsappConfig.accounts && Object.keys(whatsappConfig.accounts).length > 0)) {
    whatsappConnected = true;
  }
  
  integrations.push({
    id: 'whatsapp',
    name: 'WhatsApp',
    status: whatsappConnected ? 'connected' : 'disconnected',
    icon: 'whatsapp',
    lastActivity: whatsappConnected ? new Date().toISOString() : null,
  });
  
  // Discord
  const discordConfig = openclawConfig?.channels?.discord;
  let discordConnected = false;
  if (discordConfig && (discordConfig.token || discordConfig.botToken || discordConfig.accounts && Object.keys(discordConfig.accounts).length > 0)) {
    discordConnected = true;
  }
  
  integrations.push({
    id: 'discord',
    name: 'Discord',
    status: discordConnected ? 'connected' : 'disconnected',
    icon: 'discord',
    lastActivity: discordConnected ? new Date().toISOString() : null,
  });
  
  // Slack
  const slackConfig = openclawConfig?.channels?.slack;
  let slackConnected = false;
  if (slackConfig && (slackConfig.token || slackConfig.botToken || slackConfig.accounts && Object.keys(slackConfig.accounts).length > 0)) {
    slackConnected = true;
  }
  
  integrations.push({
    id: 'slack',
    name: 'Slack',
    status: slackConnected ? 'connected' : 'disconnected',
    icon: 'slack',
    lastActivity: slackConnected ? new Date().toISOString() : null,
  });
  
  // Signal
  const signalConfig = openclawConfig?.channels?.signal;
  let signalConnected = false;
  if (signalConfig && (signalConfig.number || signalConfig.accounts && Object.keys(signalConfig.accounts).length > 0)) {
    signalConnected = true;
  }
  
  integrations.push({
    id: 'signal',
    name: 'Signal',
    status: signalConnected ? 'connected' : 'disconnected',
    icon: 'signal',
    lastActivity: signalConnected ? new Date().toISOString() : null,
  });
  
  // Email (Himalaya)
  let emailConnected = false;
  try {
    const himalayaConfigPath = path.join(os.homedir(), '.config', 'himalaya', 'config.toml');
    if (fs.existsSync(himalayaConfigPath)) {
      emailConnected = true;
    } else {
      // Fallback to check default openclaw mount path if running in docker
      const dockerConfigPath = '/root/.config/himalaya/config.toml';
      if (fs.existsSync(dockerConfigPath)) {
        emailConnected = true;
      }
    }
  } catch (e) {}
  
  integrations.push({
    id: 'email',
    name: 'Email (Himalaya)',
    status: emailConnected ? 'connected' : 'disconnected',
    icon: 'mail',
    lastActivity: emailConnected ? new Date().toISOString() : null,
  });

  return integrations;
}

export async function GET() {
  const identity = parseIdentityMd();
  const uptime = process.uptime();
  const nodeVersion = process.version;
  const model = process.env.OPENCLAW_MODEL || process.env.DEFAULT_MODEL || 'anthropic/claude-sonnet-4';
  
  const systemInfo = {
    agent: {
      name: identity.name,
      creature: identity.creature,
      emoji: identity.emoji,
    },
    system: {
      uptime: Math.floor(uptime),
      uptimeFormatted: formatUptime(uptime),
      nodeVersion,
      model,
      workspacePath: WORKSPACE_PATH,
      platform: os.platform(),
      hostname: os.hostname(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
    },
    integrations: getIntegrationStatus(),
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(systemInfo);
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();
    
    if (action === 'change_password') {
      const { currentPassword, newPassword } = data;
      
      // Read current .env.local
      let envContent = '';
      try {
        envContent = fs.readFileSync(ENV_LOCAL_PATH, 'utf-8');
      } catch {
        return NextResponse.json({ error: 'Could not read configuration' }, { status: 500 });
      }
      
      // Verify current password
      const currentPassMatch = envContent.match(/AUTH_PASSWORD=(.+)/);
      const storedPassword = currentPassMatch?.[1]?.trim();
      
      if (storedPassword !== currentPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
      
      // Update password
      const newEnvContent = envContent.replace(
        /AUTH_PASSWORD=.*/,
        `AUTH_PASSWORD=${newPassword}`
      );
      
      fs.writeFileSync(ENV_LOCAL_PATH, newEnvContent);
      
      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }
    
    if (action === 'clear_activity_log') {
      const activitiesPath = path.join(process.cwd(), 'data', 'activities.json');
      fs.writeFileSync(activitiesPath, '[]');
      return NextResponse.json({ success: true, message: 'Activity log cleared' });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${Math.floor(seconds)}s`);
  
  return parts.join(' ');
}
