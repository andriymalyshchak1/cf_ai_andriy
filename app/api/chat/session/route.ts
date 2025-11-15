import { getRequestContext } from '@cloudflare/next-on-pages'
import { NextRequest } from 'next/server';

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const context = getRequestContext();
    
    if (!context?.env?.CHAT_SESSIONS) {
      return new Response(
        JSON.stringify({ error: 'Chat sessions storage not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sessionId = crypto.randomUUID();
    const timestamp = Date.now();
    
    await context.env.CHAT_SESSIONS.put(
      `session:${sessionId}`,
      JSON.stringify({
        id: sessionId,
        createdAt: timestamp,
        lastActivity: timestamp,
        messageCount: 0,
      }),
      { expirationTtl: 86400 } // 24 hours
    );
    
    return new Response(JSON.stringify({ sessionId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Session creation error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to create session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const context = getRequestContext();
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response('Session ID required', { status: 400 });
    }
    
    if (!context?.env?.CHAT_SESSIONS) {
      return new Response(
        JSON.stringify({ error: 'Chat sessions storage not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await context.env.CHAT_SESSIONS.get(`session:${sessionId}`);
    
    if (!session) {
      return new Response('Session not found', { status: 404 });
    }
    
    return new Response(session, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Session retrieval error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to retrieve session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

