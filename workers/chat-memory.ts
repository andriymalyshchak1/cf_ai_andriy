/**
 * Chat Memory Durable Object
 * Provides persistent memory/state for chat sessions
 * This demonstrates Memory/state component required for the assignment
 */

export class ChatMemory {
  private state: DurableObjectState;
  private env: CloudflareEnv;
  private sessionData: Map<string, any>;

  constructor(state: DurableObjectState, env: CloudflareEnv) {
    this.state = state;
    this.env = env;
    this.sessionData = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/memory' && request.method === 'POST') {
      return this.saveMemory(request);
    } else if (path === '/memory' && request.method === 'GET') {
      return this.getMemory(request);
    } else if (path === '/conversation' && request.method === 'POST') {
      return this.saveConversation(request);
    } else if (path === '/conversation' && request.method === 'GET') {
      return this.getConversation(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  async saveMemory(request: Request): Promise<Response> {
    const { sessionId, memory } = await request.json();
    const key = `memory:${sessionId}`;
    
    await this.state.storage.put(key, {
      sessionId,
      memory,
      updatedAt: Date.now(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getMemory(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response('Session ID required', { status: 400 });
    }

    const key = `memory:${sessionId}`;
    const memory = await this.state.storage.get(key);

    return new Response(JSON.stringify(memory || null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async saveConversation(request: Request): Promise<Response> {
    const { sessionId, messages } = await request.json();
    const key = `conversation:${sessionId}`;
    
    await this.state.storage.put(key, {
      sessionId,
      messages,
      updatedAt: Date.now(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getConversation(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response('Session ID required', { status: 400 });
    }

    const key = `conversation:${sessionId}`;
    const conversation = await this.state.storage.get(key);

    return new Response(JSON.stringify(conversation || null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

