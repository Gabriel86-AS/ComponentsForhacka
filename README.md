# Chatbot Demo — Claude AI

A reusable, streaming chatbot component powered by **Claude** via the **Vercel AI SDK v5**.

![Architecture](https://img.shields.io/badge/Vite-React-blueviolet) ![AI SDK](https://img.shields.io/badge/AI%20SDK-v5-blue) ![Claude](https://img.shields.io/badge/Claude-Haiku%204.5-orange)

## Quick Start

```bash
# 1. Copy the env template and paste your Anthropic API key
cp .env.example .env

# 2. Install / re-resolve dependencies (pins AI SDK v5 trio)
npm install

# 3. Start both the Vite dev server and Express API
npm run dev

# 4. Open in your browser
#    → http://localhost:5173
```

## Environment Variables

| Variable            | Required | Default | Description                        |
| ------------------- | -------- | ------- | ---------------------------------- |
| `ANTHROPIC_API_KEY` | ✅       | —       | Your Anthropic API key             |
| `PORT`              | ❌       | `3001`  | Port for the Express API server    |

## Architecture

```
┌──────────────────────────┐         ┌──────────────────────────┐
│  Vite dev (port 5173)    │  /api/* │  Express (port 3001)     │
│  React + shadcn          │ ──────▶ │  POST /api/chat          │
│  useChat() → streaming   │  proxy  │  streamText + Anthropic  │
└──────────────────────────┘         └──────────────────────────┘
```

- **Frontend**: Vite proxies `/api/*` to the Express server in development.
- **Backend**: Express loads `ANTHROPIC_API_KEY` via dotenv, calls `streamText` with `@ai-sdk/anthropic`, and streams the response via `pipeUIMessageStreamToResponse`.
- **Default model**: `claude-haiku-4-5` (fast, cheap — perfect for demos). Overridable via the `model` prop.

## Reusable `<Chatbot />` Component

The component is fully self-contained — a single import with props is all you need:

```tsx
import { Chatbot } from "@/components/Chatbot";

export function SupportPage() {
  return (
    <Chatbot
      title="Support"
      system="You are a helpful support agent."
      model="claude-haiku-4-5"
      placeholder="How can we help?"
    />
  );
}
```

### Props

| Prop              | Type          | Default            | Description                                |
| ----------------- | ------------- | ------------------ | ------------------------------------------ |
| `apiEndpoint`     | `string`      | `"/api/chat"`      | Backend chat endpoint URL                  |
| `model`           | `string`      | `"claude-haiku-4-5"` | Claude model ID                          |
| `system`          | `string`      | —                  | System prompt                              |
| `placeholder`     | `string`      | `"Type a message…"` | Input placeholder text                    |
| `title`           | `string`      | `"Chat with Claude"` | Card header title                        |
| `className`       | `string`      | —                  | Additional CSS classes for the root card   |
| `initialMessages` | `UIMessage[]` | —                  | Seed the conversation with existing messages |

## Porting to Another Project

To use `<Chatbot />` in a different repo, copy:

1. `src/components/Chatbot.tsx`
2. `src/components/ui/*` (Button, Input, Card)
3. `src/lib/utils.ts` (the `cn()` helper)
4. The `/api/chat` server route (see `server/index.ts`)
5. Add the AI SDK v5 trio to your `package.json`:
   ```json
   "ai": "^5.0.0",
   "@ai-sdk/react": "^2.0.0",
   "@ai-sdk/anthropic": "^2.0.0"
   ```

## Scripts

| Script          | Description                                       |
| --------------- | ------------------------------------------------- |
| `npm run dev`   | Start Vite + Express concurrently for development |
| `npm run build` | Type-check with tsc, then build with Vite         |
| `npm run start` | Run the Express server in production mode         |
| `npm run preview` | Preview the Vite production build               |
