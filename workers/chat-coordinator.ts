/**
 * Chat Coordinator Worker
 * Handles coordination and workflow for chat sessions
 * This demonstrates Workflow/coordination component required for the assignment
 */

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle session management
    if (url.pathname === '/api/chat/session') {
      return handleSession(request, env);
    }
    
    // Handle workflow coordination
    if (url.pathname === '/api/chat/coordinate') {
      return handleCoordination(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  },
};

async function handleSession(request: Request, env: CloudflareEnv): Promise<Response> {
  // Use type assertion for optional bindings
  const envAny = env as any;
  
  if (request.method === 'POST') {
    // Create new session
    if (!envAny.CHAT_SESSIONS) {
      return new Response(JSON.stringify({ error: 'CHAT_SESSIONS binding not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const sessionId = crypto.randomUUID();
    const timestamp = Date.now();
    
    await envAny.CHAT_SESSIONS.put(sessionId, JSON.stringify({
      id: sessionId,
      createdAt: timestamp,
      lastActivity: timestamp,
    }));
    
    return new Response(JSON.stringify({ sessionId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response('Session ID required', { status: 400 });
    }
    
    if (!envAny.CHAT_SESSIONS) {
      return new Response(JSON.stringify({ error: 'CHAT_SESSIONS binding not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const session = await envAny.CHAT_SESSIONS.get(sessionId);
    
    if (!session) {
      return new Response('Session not found', { status: 404 });
    }
    
    return new Response(session, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return new Response('Method not allowed', { status: 405 });
}

async function handleCoordination(request: Request, env: CloudflareEnv): Promise<Response> {
  // Coordinate chat processing workflow
  const body = await request.json() as { sessionId?: string; messageCount?: number; action?: string };
  const { sessionId, messageCount, action } = body;
  
  // Use type assertion for optional bindings
  const envAny = env as any;
  
  // Update session activity
  if (sessionId && envAny.CHAT_SESSIONS) {
    try {
      const session = await envAny.CHAT_SESSIONS.get(sessionId);
      if (session) {
        const sessionData = JSON.parse(session);
        sessionData.lastActivity = Date.now();
        sessionData.messageCount = messageCount || sessionData.messageCount || 0;
        await envAny.CHAT_SESSIONS.put(sessionId, JSON.stringify(sessionData));
      }
    } catch (error) {
      console.warn('Failed to update session:', error);
    }
  }
  
  // Coordinate workflow steps
  const workflow = {
    step: 'chat_processing',
    sessionId,
    timestamp: Date.now(),
    action,
    status: 'coordinated',
  };
  
  return new Response(JSON.stringify(workflow), {
    headers: { 'Content-Type': 'application/json' },
  });
}

