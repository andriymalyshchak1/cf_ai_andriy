/**
 * Tool definitions for function calling
 * These tools extend the chatbot's capabilities beyond simple text generation
 */

export const tools = {
  calculator: {
    description: 'Evaluates mathematical expressions. Use this for any math calculations, arithmetic operations, or solving equations.',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The mathematical expression to evaluate (e.g., "2 + 2", "10 * 5", "sqrt(16)")',
        },
      },
      required: ['expression'],
    },
  },
  getCurrentDateTime: {
    description: 'Gets the current date and time. Use this when users ask about the current date, time, day of week, or time-related questions.',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Optional timezone (e.g., "UTC", "America/New_York"). Defaults to UTC if not provided.',
        },
        format: {
          type: 'string',
          description: 'Optional format: "full" (date + time), "date" (date only), "time" (time only). Defaults to "full".',
        },
      },
      required: [],
    },
  },
  getSessionStats: {
    description: 'Gets statistics about the current chat session. Use this when users ask about conversation history, message count, or session information.',
    parameters: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'The session ID to get stats for. Usually provided in the context.',
        },
      },
      required: ['sessionId'],
    },
  },
} as const;

/**
 * Tool handlers - implement the actual functionality
 */
export async function executeTool(
  toolName: string,
  args: any,
  context?: { sessionId?: string; env?: any }
): Promise<{ result: any; error?: string }> {
  try {
    switch (toolName) {
      case 'calculator':
        return handleCalculator(args.expression);
      
      case 'getCurrentDateTime':
        return handleGetCurrentDateTime(args.timezone, args.format);
      
      case 'getSessionStats':
        return await handleGetSessionStats(args.sessionId, context?.env);
      
      default:
        return { result: null, error: `Unknown tool: ${toolName}` };
    }
  } catch (error: any) {
    return { result: null, error: error.message || 'Tool execution failed' };
  }
}

function handleCalculator(expression: string): { result: any; error?: string } {
  try {
    // Basic validation - check for dangerous patterns
    // Block function calls and other potentially unsafe code
    if (/eval|function|constructor|import|require|process|global|window|document/i.test(expression)) {
      return { result: null, error: 'Invalid characters in expression' };
    }
    
    // Replace common math function names with Math equivalents
    let processed = expression
      .replace(/\bsqrt\s*\(/gi, 'Math.sqrt(')
      .replace(/\babs\s*\(/gi, 'Math.abs(')
      .replace(/\bround\s*\(/gi, 'Math.round(')
      .replace(/\bfloor\s*\(/gi, 'Math.floor(')
      .replace(/\bceil\s*\(/gi, 'Math.ceil(')
      .replace(/\bsin\s*\(/gi, 'Math.sin(')
      .replace(/\bcos\s*\(/gi, 'Math.cos(')
      .replace(/\btan\s*\(/gi, 'Math.tan(')
      .replace(/\blog\s*\(/gi, 'Math.log(')
      .replace(/\bexp\s*\(/gi, 'Math.exp(')
      .replace(/\bpow\s*\(/gi, 'Math.pow(')
      .replace(/\bPI\b/gi, 'Math.PI')
      .replace(/\bE\b/gi, 'Math.E');
    
    // Validate parentheses are balanced
    let depth = 0;
    for (const char of processed) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth < 0) {
        return { result: null, error: 'Unmatched closing parenthesis' };
      }
    }
    if (depth !== 0) {
      return { result: null, error: 'Unmatched opening parenthesis' };
    }
    
    // Use Function constructor in a safe way
    // Note: This is still eval-like, but we've validated the input
    // For production, consider using a proper math parser library like 'mathjs'
    const result = Function(`"use strict"; return (${processed})`)();
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      // Format result nicely
      const formatted = result % 1 === 0 ? result.toString() : result.toFixed(10).replace(/\.?0+$/, '');
      return { result: formatted };
    } else {
      return { result: null, error: 'Invalid expression or result' };
    }
  } catch (error: any) {
    return { result: null, error: `Calculation error: ${error.message}` };
  }
}

function handleGetCurrentDateTime(
  timezone?: string,
  format?: string
): { result: any; error?: string } {
  try {
    const now = new Date();
    
    let formatted: string;
    
    if (format === 'date') {
      formatted = now.toLocaleDateString('en-US', {
        timeZone: timezone || 'UTC',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else if (format === 'time') {
      formatted = now.toLocaleTimeString('en-US', {
        timeZone: timezone || 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });
    } else {
      // Full format
      formatted = now.toLocaleString('en-US', {
        timeZone: timezone || 'UTC',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });
    }
    
    const result = {
      datetime: formatted,
      timestamp: now.getTime(),
      iso: now.toISOString(),
      timezone: timezone || 'UTC',
    };
    
    return { result: JSON.stringify(result) };
  } catch (error: any) {
    return { result: null, error: `Date/time error: ${error.message}` };
  }
}

async function handleGetSessionStats(
  sessionId: string,
  env?: any
): Promise<{ result: any; error?: string }> {
  try {
    if (!env?.CHAT_SESSIONS) {
      return { result: null, error: 'Session storage not available' };
    }
    
    // Get session data
    const sessionData = await env.CHAT_SESSIONS.get(`session:${sessionId}`);
    const conversationData = await env.CHAT_SESSIONS.get(`conversation:${sessionId}`);
    
    let stats: any = {
      sessionId,
      messageCount: 0,
      lastActivity: null,
      createdAt: null,
    };
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      stats.messageCount = session.messageCount || 0;
      stats.lastActivity = session.lastActivity ? new Date(session.lastActivity).toISOString() : null;
      stats.createdAt = session.createdAt ? new Date(session.createdAt).toISOString() : null;
    }
    
    if (conversationData) {
      const conversation = JSON.parse(conversationData);
      stats.conversationLength = conversation.messages?.length || 0;
      stats.lastUpdated = conversation.lastUpdated ? new Date(conversation.lastUpdated).toISOString() : null;
    }
    
    return { result: JSON.stringify(stats, null, 2) };
  } catch (error: any) {
    return { result: null, error: `Session stats error: ${error.message}` };
  }
}

