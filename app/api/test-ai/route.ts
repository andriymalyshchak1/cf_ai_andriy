import { getRequestContext } from '@cloudflare/next-on-pages'
import { NextRequest } from 'next/server';

export const runtime = 'edge'

/**
 * Test endpoint to verify Workers AI binding works
 * This helps debug AI binding issues
 */
export async function GET(req: NextRequest) {
  try {
    const context = getRequestContext();
    
    if (!context?.env?.AI) {
      return new Response(
        JSON.stringify({ 
          error: 'AI binding not available',
          contextExists: !!context,
          envExists: !!context?.env,
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Try to call Workers AI directly (following Cloudflare's demo pattern)
    try {
      // Use simple prompt format like Cloudflare demo
      const testInput = {
        prompt: 'Say hello in one sentence'
      };
      
      const testResponse = await context.env.AI.run('@cf/meta/llama-3-8b-instruct', testInput);
      
      // The response type can vary - handle it safely
      const responseAny = testResponse as any;
      
      return new Response(
        JSON.stringify({ 
          success: true,
          aiBindingType: typeof context.env.AI,
          aiBindingAvailable: !!context.env.AI,
          testInput,
          responseType: typeof testResponse,
          responseKeys: testResponse && typeof testResponse === 'object' ? Object.keys(responseAny) : [],
          responsePreview: testResponse && typeof testResponse === 'object' ? 
            (responseAny.response?.substring(0, 100) || JSON.stringify(responseAny).substring(0, 200)) :
            String(testResponse).substring(0, 200),
        }, null, 2),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (aiCallError: any) {
      return new Response(
        JSON.stringify({ 
          error: 'AI call failed',
          message: aiCallError?.message || 'Unknown error',
          stack: aiCallError?.stack,
          aiBindingType: typeof context.env.AI,
          aiBindingAvailable: !!context.env.AI,
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        error: 'Test endpoint error',
        message: error?.message || 'Unknown error',
        stack: error?.stack,
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

