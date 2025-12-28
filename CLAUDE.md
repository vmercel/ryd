# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OnSpace AI (onspace-app) is an AI-powered travel concierge mobile application built with React Native and Expo. It enables users to plan trips through natural language (voice or text), with an agentic AI that searches flights, compares options, and handles bookings.

## Development Commands

```bash
pnpm install         # Install dependencies (uses pnpm)
pnpm start           # Start Expo development server
pnpm run ios         # Launch iOS simulator
pnpm run android     # Launch Android emulator
pnpm run web         # Start web version
pnpm run lint        # Run ESLint
pnpm run reset-project  # Reset project cache
```

## Architecture

### Frontend Stack
- **React Native 0.79** with **Expo 53** (new architecture enabled)
- **Expo Router** for file-based navigation with typed routes
- **Supabase** for authentication, database, and edge functions
- **Zustand** for state management

### Directory Structure

```
app/                    # Expo Router screens
  _layout.tsx          # Root layout with AuthProvider and AlertProvider
  (tabs)/              # Tab navigation screens
    index.tsx          # Main chat/agent interface (HomeScreen)
    trips.tsx          # Trip history list
    calendar.tsx       # Calendar view
    settings.tsx       # User settings
  trip/[id].tsx        # Dynamic trip details route
  login.tsx            # Authentication screen

components/
  ui/                  # Reusable UI components (Button, Input)
  feature/             # Feature-specific components (AgentDisk, ChatBubble, TripCard, ProposalCard)

services/
  agentService.ts      # Trip planning API calls to edge functions
  chatService.ts       # Streaming chat functionality
  proactiveService.ts  # NLP inference for trip parameters

hooks/
  useAgentChat.ts      # Chat state management with streaming
  useLocation.ts       # GPS location and nearest airport
  useCalendar.ts       # Device calendar integration
  useVoiceInput.ts     # Voice recording and transcription

template/              # Reusable infrastructure modules
  core/                # Supabase client singleton (getSupabaseClient)
  auth/                # Auth providers (Supabase + mock for development)
  ui/                  # Alert system (AlertProvider, useAlert)

constants/
  theme.ts             # Design system: Colors, Typography, Spacing, Shadows

supabase/functions/    # Deno edge functions
  atlas-chat/          # Main AI agent function (OpenAI + Duffel API)

types/index.ts         # TypeScript interfaces for domain models
```

### Core Data Flow

1. User speaks/types destination request in HomeScreen
2. `planTrip()` calls Supabase edge function `atlas-chat`
3. Edge function uses OpenAI to parse intent, Duffel API to search flights
4. Results stored in Supabase tables: `trip_requests`, `agent_runs`, `calendar_events`, `bookings`
5. UI displays proposal via `ProposalCard`, user approves/adjusts
6. Trip status updates through execution phases: understand → search → compare → book

### Key Patterns

- **Path alias**: Use `@/` for root imports (e.g., `@/template`, `@/components`)
- **Supabase client**: Always use `getSupabaseClient()` from `@/template` - never create new clients
- **Styling**: Use theme constants from `constants/theme.ts` for colors, spacing, typography
- **Auth context**: Access user via `useAuth()` hook from `@/template`

### Type Definitions

Core types in `types/index.ts`:
- `TripRequest`: Trip parameters with origin, destination, dates, budget
- `TripStatus`: 'planning' | 'watching' | 'holding' | 'booked' | 'in-trip' | 'complete' | 'needs-attention'
- `ExecutionPhase`: 'understand' | 'search' | 'compare' | 'hold' | 'book' | 'pay' | 'confirm' | 'calendar' | 'monitor'
- `AgentRun`: Agent execution record with task plan and results
- `ChatMessage`: Conversation messages with role-based content

### Environment Variables

Required in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Edge function secrets (Supabase dashboard):
- `OPENAI_API_KEY` - For intent parsing
- `DUFFEL_API_KEY` - For flight search (optional, falls back to mock)

## Testing Edge Functions

Deploy and test Supabase functions:
```bash
supabase functions deploy atlas-chat
supabase functions invoke atlas-chat --body '{"userMessage":"I want to go to Tokyo"}'
```
