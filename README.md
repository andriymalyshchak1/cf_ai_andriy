# AI Chatbot on Cloudflare

A chatbot application built on Cloudflare's platform using Workers AI, Pages, and KV storage.

## What This Includes

- **LLM**: Llama 3-8B Instruct via Workers AI with tool calling support
- **Memory/State**: KV namespace for storing conversation history
- **Coordination**: Workers for managing chat sessions and workflow
- **Frontend**: Next.js chat interface deployed on Cloudflare Pages

## Quick Start

### Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Login to Cloudflare:
   ```bash
   npx wrangler login
   ```

3. Run locally:
   ```bash
   pnpm run preview
   ```

4. Open `http://localhost:8788` and start chatting

### Deployment to Cloudflare Pages

1. Push your code to a GitHub repo (must be prefixed with `cf_ai_`)

2. In Cloudflare Dashboard:
   - Go to Workers & Pages > Create Application > Pages
   - Connect your repository
   - Configure build settings:
     - Build command: `pnpm install && pnpm run pages:build`
     - Output directory: `.vercel/output/static`
     - Node.js version: 20.x

3. Enable required features:
   - **Compatibility Flags**: Add `nodejs_compat` in Settings > Functions
   - **Workers AI**: Enable in Settings > Functions > Workers AI
   - **KV Namespace**: Create a namespace named `CHAT_SESSIONS` and bind it in Page Settings > Functions

4. Save and deploy

## Features

The chatbot can use tools for:
- Math calculations (e.g., "What's 25 * 47?")
- Date/time queries (e.g., "What time is it?")
- Session statistics (e.g., "How many messages have we sent?")

Conversations are saved to KV storage and persist across sessions.

## Project Structure

- `app/api/chat/route.ts` - Main chat API endpoint
- `app/page.tsx` - Chat UI frontend
- `workers/` - Worker scripts for coordination
- `lib/tools.ts` - Tool definitions for function calling

## Troubleshooting

**"AI binding is not available"**: Enable Workers AI in your Pages project settings under Functions.

**Build fails**: Make sure the build command and output directory are set correctly in the Cloudflare Pages dashboard.

**Storage errors**: Ensure your KV namespace is created and bound to your Pages project.

## Tech Stack

- Cloudflare Workers AI
- Cloudflare Pages
- Cloudflare KV
- Next.js
- Vercel AI SDK
