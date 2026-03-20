# CLAIR — Credit Limit AI Review

AI-powered credit assessments for overseas buyers. Built with Next.js, Claude (Anthropic), and Stripe.

## How It Works

1. User fills in buyer details (country, registration number, payment terms, credit limit)
2. User pays $2.50 via Stripe Checkout
3. Claude analyses the buyer using a professional credit underwriting methodology (3-pillar: Country · Sector · Buyer)
4. A structured report is displayed in-browser
5. User enters name + email to download the report as PDF

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with:
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com/settings/keys)
- `STRIPE_SECRET_KEY` — from [Stripe Dashboard](https://dashboard.stripe.com/apikeys) (use `sk_test_...` for dev)
- `STRIPE_WEBHOOK_SECRET` — from your Stripe webhook endpoint
- `STRIPE_PRICE_ID` — create a one-time $2.50 product in Stripe and paste the Price ID
- `NEXT_PUBLIC_URL` — `http://localhost:3000` for local dev

### 3. Set up Stripe

1. Go to [dashboard.stripe.com/products](https://dashboard.stripe.com/products)
2. Create a product: **"CLAIR Credit Report"**, one-time price: **$2.50 USD**
3. Copy the `price_...` ID → `STRIPE_PRICE_ID` in `.env.local`
4. For local webhook testing, install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   Copy the `whsec_...` secret → `STRIPE_WEBHOOK_SECRET`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Deploy
5. In Stripe Dashboard → Webhooks, add your Vercel URL: `https://your-app.vercel.app/api/webhook`
   - Event: `checkout.session.completed`
   - Copy the signing secret → update `STRIPE_WEBHOOK_SECRET` in Vercel env vars

## Security

- All API keys are server-side only — never sent to the browser
- The AI system prompt (`credit_underwriting_master_prompt_v2.md`) is read server-side and never transmitted to the client
- Payment bypass is prevented by Stripe webhook signature verification
- Input is sanitised before being sent to Claude
- Rate limiting: 10 requests per IP per hour

## Architecture

```
app/
├── page.tsx                    # Home: input form
├── report/[sessionId]/page.tsx # Report view (polls until ready)
├── api/
│   ├── create-checkout/        # Creates Stripe session, stores form data
│   ├── webhook/                # Stripe webhook → triggers Claude API call
│   └── report/[sessionId]/     # GET report status/content
│       └── lead/               # POST lead capture (name + email)
├── components/                 # UI components (all client-side)
└── lib/                        # Server-side: Claude, Stripe, store
```

## Disclaimer

CLAIR is an independent tool. Reports are advisory only and are not a substitute for formal credit insurance decisions. Not affiliated with any credit insurer.
