# Aura — AI Wardrobe Stylist

An AI-powered wardrobe stylist iOS app built with Expo. Scan your clothes with your camera, catalog them automatically using AI vision, get outfit suggestions, chat with an AI style advisor, and plan looks by weather and occasion.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/aura run dev` — run the Expo app (Metro bundler)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — typecheck composite libs only
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit OpenAI AI integration

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native), expo-router, NativeTabs (liquid glass on iOS 26)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (conversations, messages)
- AI: OpenAI gpt-5.4 via Replit AI Integrations proxy
- Wardrobe data: AsyncStorage on device (no cloud sync)
- Validation: Zod (`zod/v4`), `drizzle-zod`

## Where things live

- `artifacts/aura/` — Expo mobile app
  - `app/(tabs)/` — 5 tab screens (wardrobe, scan, outfits, style, plan)
  - `app/item/[id].tsx` — clothing item detail
  - `context/WardrobeContext.tsx` — global wardrobe state (AsyncStorage)
  - `types/wardrobe.ts` — shared TypeScript types
  - `constants/colors.ts` — dark fashion theme (light + dark palettes)
  - `components/` — ClothingCard, OutfitCard, GlassPanel
- `artifacts/api-server/src/routes/wardrobe.ts` — AI clothing analyze, outfit suggestions, style chat
- `artifacts/api-server/src/routes/openai/conversations.ts` — chat conversation CRUD + SSE streaming
- `lib/api-spec/openapi.yaml` — source-of-truth for API contract
- `lib/db/src/schema/` — conversations + messages tables

## Architecture decisions

- Wardrobe items stored in AsyncStorage on-device only (no cloud DB). Keeps the app simple and private; no auth required.
- AI calls go through the backend (never directly from the app) to keep API keys server-side.
- Style chat uses direct fetch + ReadableStream SSE (not Orval-generated hooks) since SSE requires streaming which Orval can't type.
- NativeTabs (liquid glass) used on iOS 26+; falls back to classic Tabs with BlurView on older iOS and Android.
- Base64 image upload for clothing analysis — body limit set to 15mb in Express.

## Product

- **Wardrobe** tab: browse all clothing items in a grid, filtered by category
- **Scan** tab: photograph or pick from library → AI analyzes the item → add to wardrobe
- **Outfits** tab: select weather + occasion → AI generates outfit combinations from your wardrobe → save favorites
- **Style** tab: chat with "Aura" AI stylist that knows your wardrobe
- **Plan** tab: pick a day + weather + occasion → get a single recommended outfit

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `lib/api-spec/openapi.yaml`
- Always run `pnpm --filter @workspace/db run push` after editing `lib/db/src/schema/`
- The Expo web preview picks up the system color scheme; test on a real device for the dark fashion theme
- Camera permissions require a real device (simulator supports photo library only)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `ai-integrations-openai` skill for OpenAI integration details
