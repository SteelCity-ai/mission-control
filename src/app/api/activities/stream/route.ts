/**
 * Real-time activity stream via SSE
 * GET /api/activities/stream
 * Sends new activities as they arrive (polling SQLite every 2 seconds)
 * Enhanced with Steel City agent names, department info, and task references
 */
import { NextRequest } from 'next/server';
import { getActivities } from '@/lib/activities-db';

// Steel City agent mapping for enrichment
const STEEL_CITY_AGENTS: Record<string, { name: string; emoji: string; department: string }> = {
  main: { name: 'Yoda', emoji: '🧙', department: 'Command' },
  foreman: { name: 'R2', emoji: '🤖', department: 'Project Planning' },
  research: { name: '3CP0', emoji: '🔍', department: 'Research' },
  architect: { name: 'Akbar', emoji: '📐', department: 'Architecture' },
  build: { name: 'Luke', emoji: '🔨', department: 'Build' },
  design: { name: 'Leia', emoji: '🎨', department: 'Design' },
  qa: { name: 'Han', emoji: '🎯', department: 'QA' },
  growth: { name: 'Lando', emoji: '📈', department: 'Growth' },
  reporter: { name: 'Chewy', emoji: '📊', department: 'Reporting' },
  'pm-sync': { name: 'OBWON', emoji: '📋', department: 'PM Sync' },
  macgyver: { name: 'MacGyver', emoji: '🛠️', department: 'Utilities' },
};

// Try to extract agent ID from activity description or metadata
function enrichActivityWithSteelCityInfo(activity: any): any {
  let agentId = 'unknown';
  let agentName = 'Unknown Agent';
  let agentEmoji = '🤖';
  let department = 'Unknown';
  
  // Try to find agent ID in metadata or description
  if (activity.metadata?.agentId) {
    agentId = activity.metadata.agentId;
  } else if (activity.description) {
    // Try to detect agent from description
    const descLower = activity.description.toLowerCase();
    for (const [id, info] of Object.entries(STEEL_CITY_AGENTS)) {
      if (descLower.includes(id) || descLower.includes(info.name.toLowerCase())) {
        agentId = id;
        break;
      }
    }
  }
  
  // Get Steel City info if found
  if (STEEL_CITY_AGENTS[agentId]) {
    const info = STEEL_CITY_AGENTS[agentId];
    agentName = info.name;
    agentEmoji = info.emoji;
    department = info.department;
  }
  
  // Try to extract task reference (e.g., STE-49, SC-001)
  let taskRef = null;
  if (activity.description) {
    const taskMatch = activity.description.match(/(STE-\d+|SC-[A-Z]+-\d+)/i);
    if (taskMatch) {
      taskRef = taskMatch[1].toUpperCase();
    }
  }
  
  return {
    ...activity,
    agentId,
    agentName,
    agentEmoji,
    department,
    taskRef,
  };
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let lastId: string | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // Send initial ping with Steel City context
      send({ 
        type: 'connected', 
        ts: new Date().toISOString(),
        agents: Object.values(STEEL_CITY_AGENTS).map(a => ({ name: a.name, emoji: a.emoji, department: a.department })),
      });

      const poll = async () => {
        if (closed) return;

        try {
          const result = getActivities({ limit: 10, sort: 'newest' });
          const activities = result.activities;

          if (activities.length > 0) {
            const newest = activities[0];

            if (lastId === null) {
              // First run: send a batch of recent activities with Steel City enrichment
              const enrichedBatch = activities.slice(0, 5).map(enrichActivityWithSteelCityInfo);
              send({ type: 'batch', activities: enrichedBatch });
              lastId = newest.id;
            } else if (newest.id !== lastId) {
              // New activities since last check - with enrichment
              const newActivities = activities.filter((a) => {
                // Send activities newer than lastId
                const lastIdx = activities.findIndex((x) => x.id === lastId);
                if (lastIdx === -1) return true;
                return activities.indexOf(a) < lastIdx;
              });

              for (const activity of newActivities.reverse()) {
                const enriched = enrichActivityWithSteelCityInfo(activity);
                send({ type: 'new', activity: enriched });
              }
              lastId = newest.id;
            }
          }
        } catch {}

        if (!closed) {
          setTimeout(poll, 2000);
        }
      };

      poll();

      request.signal?.addEventListener('abort', () => {
        closed = true;
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
