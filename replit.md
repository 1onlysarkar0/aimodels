# DuckAI OpenAI Server

## Overview

DuckAI OpenAI Server is a high-performance HTTP server that provides an OpenAI-compatible API interface using DuckDuckGo's AI backend. It enables free access to multiple AI models (GPT-4o-mini, Claude 3 Haiku, Mistral) through the standard OpenAI API format, making it a drop-in replacement for applications using the OpenAI SDK.

The server is built with Bun runtime for high performance and includes features like streaming responses, tool/function calling support, rate limiting, and a web dashboard for management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Runtime & Framework
- **Bun Runtime**: Uses Bun as the JavaScript/TypeScript runtime instead of Node.js for better performance
- **Native HTTP Server**: Uses Bun's built-in `Bun.serve()` for HTTP handling - no Express or other frameworks needed
- **TypeScript**: Full TypeScript support with strict type checking

### Core Components

**Server Layer (`src/server.ts`)**
- Main entry point handling HTTP routing
- CORS support for cross-origin requests
- Endpoints: `/v1/chat/completions`, `/v1/models`, `/health`, `/dashboard`
- VPN control endpoint for optional WireGuard integration

**DuckAI Client (`src/duckai.ts`)**
- Core client for communicating with DuckDuckGo's AI backend
- Handles VQD token management for authentication with DuckDuckGo
- Implements sliding window rate limiting with configurable thresholds
- User-agent rotation using the `user-agents` library

**OpenAI Service (`src/openai-service.ts`)**
- Translates OpenAI API format to DuckAI requests
- Handles both streaming and non-streaming responses
- Implements tool/function calling by injecting tool instructions into prompts

**Tool Service (`src/tool-service.ts`)**
- Generates system prompts for function calling
- Parses AI responses for tool call JSON
- Built-in functions: `get_current_time`, `calculate`, `get_weather`

### Rate Limiting Strategy
- Sliding window algorithm tracking request timestamps
- Shared rate limit store using filesystem (`/tmp/duckai/rate-limit.json`)
- Cross-process rate limit synchronization for multi-instance deployments
- Configurable limits (default optimized for VPN usage with high limits)

### Data Flow
1. Client sends OpenAI-format request
2. OpenAIService validates and transforms request
3. If tools are present, ToolService injects instructions
4. DuckAI client fetches VQD token from DuckDuckGo
5. Request sent to DuckDuckGo's AI endpoint
6. Response parsed and formatted as OpenAI response
7. Tool calls extracted and executed if present

## External Dependencies

### Third-Party Libraries
- **openai**: OpenAI SDK (used in tests to verify compatibility)
- **jsdom**: DOM parsing for extracting data from DuckDuckGo responses
- **user-agents**: Generates random user agent strings to avoid detection

### External Services
- **DuckDuckGo AI Backend**: Primary AI service (`duckduckgo.com/duckchat`)
  - Requires VQD token obtained from status endpoint
  - Supports models: gpt-4o-mini, claude-3-haiku, mistral-small, llama, mixtral

### Optional Integrations
- **WireGuard VPN**: Optional VPN support via `wg-quick` for rate limit bypass
- **Docker**: Container deployment via `amirkabiri/duckai` image

### Filesystem
- Rate limit data stored in `/tmp/duckai/rate-limit.json` for cross-process sharing