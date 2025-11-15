# AI-Powered Chatbot on Cloudflare

An AI-powered chatbot application built on Cloudflare's platform, demonstrating all required components for a comprehensive AI application.

## Assignment Requirements Coverage

This project includes all required components:

✅ **LLM**: Uses Llama 3.3 70B Instruct (recommended model) via Workers AI  
✅ **Workflow/Coordination**: Implements Workers and service bindings for chat coordination  
✅ **User Input**: Chat interface via Cloudflare Pages  
✅ **Memory/State**: Persistent storage using KV namespaces and Durable Objects  

## Tech Stack

- **[Cloudflare Pages](https://pages.cloudflare.com)** – Frontend deployment and hosting
- **[Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)** – LLM inference using Llama 3.3 70B
- **[Cloudflare Workers](https://workers.cloudflare.com/)** – Serverless functions for coordination
- **[Cloudflare KV](https://developers.cloudflare.com/kv/)** – Key-value storage for session management
- **[Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)** – Persistent memory/state storage
- **[Next.js](https://nextjs.org/)** – React framework
- **[Vercel AI SDK](https://sdk.vercel.ai/docs)** – AI integration library
- **[TailwindCSS](https://tailwindcss.com/)** – Styling
- **[Kibo UI](http://www.kibo-ui.com)** – UI component library

## Architecture

### Components

1. **LLM (Workers AI)**
   - Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
   - Location: `app/api/chat/route.ts`
   - Provides AI-powered text generation

2. **Workflow/Coordination**
   - Chat Coordinator Worker: `workers/chat-coordinator.ts`
   - Service binding: `CHAT_COORDINATOR`
   - Handles session management and workflow coordination

3. **Memory/State**
   - KV Namespace: `CHAT_SESSIONS` for session data
   - Durable Object: `ChatMemory` for persistent conversation storage
   - Location: `workers/chat-memory.ts`
   - Stores conversation history and session state

4. **User Input (Chat Interface)**
   - Cloudflare Pages frontend
   - Real-time chat UI
   - Location: `app/page.tsx`

## Prerequisites

- Node.js 20+ (required for Wrangler)
- pnpm (or npm/yarn)
- Cloudflare account with:
  - Workers AI enabled
  - KV namespace created (or use local dev)
  - Durable Objects enabled (for production)

## Local Development

### Installation

1. Clone or fork this repository

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```

4. Create KV namespace (if needed):
   ```bash
   npx wrangler kv:namespace create "CHAT_SESSIONS"
   npx wrangler kv:namespace create "CHAT_SESSIONS" --preview
   ```
   Update the IDs in `wrangler.jsonc` after creation.

5. Deploy Durable Object class (if using in production):
   ```bash
   npx wrangler deploy --config workers/chat-memory.ts
   ```

### Running Locally

1. Run the development server:
   ```bash
   pnpm run preview
   ```

2. Open your browser to `http://localhost:8788`

3. Start chatting! The application will:
   - Use Llama 3.3 for AI responses
   - Save conversation history to KV storage
   - Coordinate workflow via Workers
   - Persist state across sessions

### Build Commands

```bash
# Install dependencies
pnpm install

# Run local development
pnpm run preview

# Build for production
pnpm run pages:build

# Deploy to Cloudflare Pages
pnpm run deploy

# Generate Cloudflare types
pnpm run cf-typegen
```

## Deployment

### Option 1: Cloudflare Pages (Recommended)

1. Fork this repository or push to your own repository with `cf_ai_` prefix
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create Application** > **Pages**
3. Connect your repository
4. **Configure build settings** (IMPORTANT - REQUIRED IN DASHBOARD):
   - Navigate to: **Settings** > **Builds & deployments** > **Edit configuration**
   - **Framework preset**: None (or Next.js if available)
   - **Build command**: `pnpm install && pnpm run pages:build`
     - If pnpm fails, try: `corepack enable && pnpm install && pnpm run pages:build`
     - Or use npm: `npm install && npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (leave empty)
   - **Node.js version**: 20.x or higher
   - ⚠️ **The build command MUST be set in the dashboard - it cannot be auto-detected**
5. **Create KV Namespace** (REQUIRED for memory/state):
   - Go to **Workers & Pages** > **KV** > **Create a namespace**
   - Name it: `CHAT_SESSIONS`
   - Copy the namespace ID (looks like: `abc123def456...`)

6. **Add environment variables and bindings** (in Page Settings > Functions):
   - **Workers AI Binding**: Enable Workers AI binding
   - **KV Namespace**: 
     - Click "Add binding"
     - Variable name: `CHAT_SESSIONS`
     - Select your `CHAT_SESSIONS` namespace
     - Save
7. Save and deploy!

**Note**: The `workers` field has been removed from `wrangler.jsonc` as it's not supported in Pages configuration. The worker code in the `workers/` directory demonstrates the workflow/coordination component and can be deployed separately if needed.

### Option 2: Manual Deployment

```bash
# Build the application
pnpm run pages:build

# Deploy to Cloudflare Pages
pnpm run deploy

# Or deploy using Wrangler directly
npx wrangler pages deploy .vercel/output/static
```

## Configuration

### Wrangler Configuration (`wrangler.jsonc`)

The project is configured with:
- Workers AI binding
- KV namespace for sessions
- Durable Objects for memory
- Service bindings for coordination
- Node.js compatibility

### Environment Setup

For local development, create a `.dev.vars` file (optional):
```
# Not needed - authentication handled via wrangler login
```

## Project Structure

```
cloudflare-chatbot/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   ├── route.ts          # Main chat API with LLM
│   │   │   └── session/
│   │   │       └── route.ts      # Session management API
│   │   └── hello/
│   │       └── route.ts
│   ├── page.tsx                  # Chat UI frontend
│   └── layout.tsx
├── workers/
│   ├── chat-coordinator.ts       # Workflow/coordination Worker
│   └── chat-memory.ts            # Durable Object for memory
├── lib/
│   └── tools.ts                  # Tool definitions and handlers for function calling
├── components/                   # UI components
├── wrangler.jsonc                # Cloudflare configuration
├── package.json
└── README.md
```

## Features

- **Streaming AI Responses**: Real-time streaming using Vercel AI SDK
- **Tool/Function Calling**: AI can use tools to perform calculations, get date/time, and check session stats
- **Session Management**: Persistent chat sessions with automatic expiration
- **Conversation History**: Saved to KV storage for retrieval
- **Error Handling**: Comprehensive error handling with user feedback
- **Responsive UI**: Modern, responsive chat interface
- **Dark Mode**: Supports light and dark themes

### Available Tools

The chatbot includes the following tools that extend its capabilities:

1. **Calculator Tool** (`calculator`)
   - Evaluates mathematical expressions
   - Supports basic arithmetic and common math functions (sqrt, sin, cos, log, etc.)
   - Example: "What's 15 * 23?" or "Calculate sqrt(144)"

2. **Date/Time Tool** (`getCurrentDateTime`)
   - Gets current date and time
   - Supports timezone specification and format options
   - Example: "What time is it?" or "What's today's date?"

3. **Session Stats Tool** (`getSessionStats`)
   - Retrieves statistics about the current chat session
   - Shows message count, last activity, and session metadata
   - Example: "How many messages have we exchanged?"

## Testing the Components

### Test LLM
1. Open the chat interface
2. Type a message and send
3. Verify AI response appears (using Llama 3.3)

### Test Memory/State
1. Start a conversation
2. Check KV storage for saved session:
   ```bash
   npx wrangler kv:key get "session:<session-id>" --namespace-id=<your-namespace-id>
   ```

### Test Workflow/Coordination
1. Send multiple messages
2. Check coordination service logs in Cloudflare dashboard
3. Verify session activity is tracked

### Test User Input
1. Use the chat interface
2. Send various messages
3. Verify real-time responses

### Test Tool/Function Calling
1. Try a math question: "What's 25 * 47?"
2. Ask for current time: "What time is it?"
3. Check session stats: "How many messages have we sent?"
4. Verify the AI uses the appropriate tool and returns accurate results

## Troubleshooting

### "AI binding is not available" error
- Ensure you're logged in: `npx wrangler login`
- Verify Workers AI is enabled in your Cloudflare account
- Check `wrangler.jsonc` has AI binding configured

### Storage errors
- For local dev, KV and Durable Objects work in preview mode
- For production, ensure KV namespaces are created and bound
- Check namespace IDs in `wrangler.jsonc`

### Build errors
- Ensure Node.js 20+ is installed
- Clear `.vercel` and `.next` directories and rebuild
- Check `pnpm install` completed successfully

## Documentation

- [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)
- [Cloudflare Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)

## License

This project is provided as-is for demonstration purposes.

## Notes

⚠️ **Important**: Before submitting, ensure your repository name is prefixed with `cf_ai_` (e.g., `cf_ai_chatbot`) as required by the assignment.

For production deployments, you may need to:
- Create KV namespaces in Cloudflare dashboard
- Deploy Durable Objects separately
- Configure proper CORS if needed
- Set up custom domains
