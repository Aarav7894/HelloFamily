# hello-family

Created with [create-lumos-app](https://github.com/lumos-fellows/create-lumos-app).

## Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS) + React Native Reusables
- **Linter/Formatter**: Biome
- **Integrations**: Supabase

## Getting Started

```bash
# Install dependencies
pnpm install

# Fill in your env vars
$EDITOR .env.local

# Start the dev server
npx expo start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

Fill in your values in `.env.local`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start Expo dev server |
| `pnpm android` | Run on Android |
| `pnpm ios` | Run on iOS |
| `pnpm prebuild` | Generate native projects |
| `pnpm format` | Format code with Biome |
| `pnpm lint` | Lint code with Biome |
| `pnpm typecheck` | Run TypeScript type checking |

## Optional: Doppler for Secrets Management

For team environments, consider using [Doppler](https://www.doppler.com/) to manage env vars:

```bash
# Install Doppler CLI, then:
doppler setup
doppler run -- npx expo start
```
