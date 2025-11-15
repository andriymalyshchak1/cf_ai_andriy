import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

import { createWorkersAI } from 'workers-ai-provider';
import { streamText, tool } from 'ai';
import { NextRequest } from 'next/server';
import { tools, executeTool } from '@/lib/tools';

export async function POST(req: NextRequest) {
  try {
    const resJson: any = await req.json();
    let messages: any = resJson["messages"];
    const sessionId = resJson["sessionId"] || crypto.randomUUID();

    const context = getRequestContext();
    if (!context?.env?.AI) {
      return new Response(
        JSON.stringify({ 
          error: 'AI binding is not available. Make sure Workers AI is configured in wrangler.jsonc and you have a Cloudflare account with Workers AI enabled.' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Test the AI binding is accessible
    console.log('AI binding type:', typeof context.env.AI);
    console.log('AI binding available:', !!context.env.AI);

    // Save conversation to memory/state using KV
    // Using type assertion for optional bindings that may not be in CloudflareEnv type
    const envAny = context.env as any;
    if (envAny.CHAT_SESSIONS) {
      try {
        await envAny.CHAT_SESSIONS.put(
          `conversation:${sessionId}`,
          JSON.stringify({
            sessionId,
            messages,
            lastUpdated: Date.now(),
          }),
          { expirationTtl: 86400 } // 24 hours
        );

        // Update session activity
        await envAny.CHAT_SESSIONS.put(
          `session:${sessionId}`,
          JSON.stringify({
            id: sessionId,
            lastActivity: Date.now(),
            messageCount: messages.length,
          }),
          { expirationTtl: 86400 }
        );
      } catch (storageError) {
        console.warn('Failed to save to storage:', storageError);
        // Continue even if storage fails
      }
    }

    // Coordinate workflow if service binding is available
    if (envAny.CHAT_COORDINATOR) {
      try {
        await envAny.CHAT_COORDINATOR.fetch(
          new Request(`${req.url.split('/api/chat')[0]}/api/chat/coordinate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              messageCount: messages.length,
              action: 'process_chat',
            }),
          })
        );
      } catch (coordError) {
        console.warn('Coordination failed:', coordError);
        // Continue even if coordination fails
      }
    }

    let workersai;
    try {
      workersai = createWorkersAI({ binding: context.env.AI });
      console.log('WorkersAI provider created successfully');
    } catch (aiError: any) {
      console.error('Failed to create WorkersAI provider:', aiError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create AI provider',
          message: aiError?.message || 'Unknown error',
          details: aiError?.stack
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Define tools for function calling
    const availableTools = {
      calculator: tool({
        description: tools.calculator.description,
        parameters: tools.calculator.parameters as any,
        execute: async ({ expression }) => {
          const result = await executeTool('calculator', { expression }, { sessionId, env: context.env });
          if (result.error) {
            return `Error: ${result.error}`;
          }
          return `Result: ${result.result}`;
        },
      }),
      getCurrentDateTime: tool({
        description: tools.getCurrentDateTime.description,
        parameters: tools.getCurrentDateTime.parameters as any,
        execute: async ({ timezone, format }) => {
          const result = await executeTool('getCurrentDateTime', { timezone, format }, { sessionId, env: context.env });
          if (result.error) {
            return `Error: ${result.error}`;
          }
          return result.result;
        },
      }),
      getSessionStats: tool({
        description: tools.getSessionStats.description,
        parameters: tools.getSessionStats.parameters as any,
        execute: async ({ sessionId: toolSessionId }) => {
          const targetSessionId = toolSessionId || sessionId;
          const result = await executeTool('getSessionStats', { sessionId: targetSessionId }, { sessionId: targetSessionId, env: context.env });
          if (result.error) {
            return `Error: ${result.error}`;
          }
          return result.result;
        },
      }),
    };

    try {
      console.log('Starting streamText with model:', '@cf/meta/llama-3.1-8b-instruct');
      console.log('Messages count:', messages.length);
      
      const textStream = streamText({
        model: workersai('@cf/meta/llama-3.1-8b-instruct'),
        messages: messages,
        tools: availableTools,
        maxSteps: 5, // Allow multiple tool calls in sequence
        onFinish: async ({ text, finishReason, usage }) => {
          console.log('Stream finished:', { text: text.substring(0, 100), finishReason, usage });
        },
        onError: async (error) => {
          console.error('StreamText onError callback:', error);
          const errorObj = error?.error || error;
          console.error('StreamText onError details:', {
            error: errorObj,
            message: (errorObj as any)?.message,
            stack: (errorObj as any)?.stack,
            cause: (errorObj as any)?.cause,
            type: typeof errorObj,
          });
        },
      });

      console.log('StreamText created, converting to response...');
      
      const response = textStream.toDataStreamResponse({
        headers: {
          // add these headers to ensure that the
          // response is chunked and streamed
          'Content-Type': 'text/x-unknown',
          'content-encoding': 'identity',
          'transfer-encoding': 'chunked',
          'X-Session-Id': sessionId,
        },
      });
      
      console.log('Response created successfully');
      return response;
    } catch (streamError: any) {
      console.error('StreamText error:', streamError);
      console.error('StreamText error details:', {
        message: streamError?.message,
        stack: streamError?.stack,
        cause: streamError?.cause,
        name: streamError?.name,
      });
      
      // Return a more descriptive error
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create AI stream',
          message: streamError?.message || 'Unknown streaming error',
          details: process.env.NODE_ENV === 'development' ? streamError?.stack : undefined
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: any) {
    console.error('Chat API error:', error);
    console.error('Chat API error details:', {
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause,
      name: error?.name,
    });
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'An error occurred while processing your request',
        details: error?.stack,
        type: error?.name || 'UnknownError'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}