# Meal Credits Planner 🍽️

A vegetarian meal planning app that helps you track meals, earn credits for healthy eating, and get AI-powered suggestions.

## Features

- **Meal Library**: Browse 45+ vegetarian meals with nutritional info
- **Credit System**: Earn 1-3 credits for healthy meals, spend on cheat meals
- **Daily Planning**: Plan meals for today or tomorrow
- **AI Chat**: Get personalized meal suggestions from ChatGPT
- **History**: Track your meal history and credits over time
- **PWA Support**: Install on your phone for easy access

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Vercel Serverless Functions (for secure API proxy)
- OpenAI API (GPT-4o-mini)

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` from the example:
   ```bash
   cp .env.local.example .env.local
   ```

4. Add your OpenAI API key to `.env.local`:
   ```
   VITE_OPENAI_API_KEY=sk-your-api-key-here
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

> **Note**: In development, the API key is used directly (fine for local use). In production, it's kept secure on the server via the Vercel proxy.

## Deployment to Vercel

### 1. Push to GitHub

Push your code to a GitHub repository.

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the Vite framework

### 3. Configure Environment Variables

In Vercel project settings, add the following environment variable:

| Name | Value |
|------|-------|
| `OPENAI_API_KEY` | `sk-your-openai-api-key` |

> **Important**: Do NOT prefix with `VITE_`. The key is kept server-side for security.

### 4. Deploy

Click "Deploy" and wait for the build to complete. Your app will be live at `your-project.vercel.app`.

## Project Structure

```
meal-credits-planner/
├── api/
│   └── chat.ts          # Vercel serverless function (OpenAI proxy)
├── src/
│   ├── components/      # Reusable UI components
│   ├── data/            # Meal data (breakfast, lunch, dinner, cheat)
│   ├── pages/           # Route pages
│   ├── types/           # TypeScript interfaces
│   └── utils/           # Helper functions
├── public/              # Static assets & PWA files
├── vercel.json          # Vercel configuration
└── .env.local.example   # Environment variables template
```

## Security

- The OpenAI API key is stored server-side only
- API calls are proxied through `/api/chat` serverless function
- No sensitive data is exposed to the browser

## License

MIT
