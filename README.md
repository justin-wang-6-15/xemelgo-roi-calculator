# Xemelgo ROI Calculator

A multi-step ROI calculator for Xemelgo's manufacturing inventory platform, built with React, Tailwind CSS, and Vite.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the dist/ build locally
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Vercel auto-detects Vite — no extra configuration needed.
4. Set any environment variables (e.g. HubSpot IDs) in the Vercel project settings under **Settings → Environment Variables**.

## HubSpot Form Integration

The email gate in Step 4 (`src/components/steps/Step4_EmailGate.jsx`) submits contact info to a HubSpot form via the HubSpot Forms API.

To connect your HubSpot account:

1. In HubSpot, go to **Marketing → Forms** and create (or locate) a form with fields: `firstname`, `lastname`, `company`, `email`.
2. Copy your **Portal ID** (found in HubSpot account settings) and the **Form ID** (the GUID shown in the form's embed code).
3. Open `src/components/steps/Step4_EmailGate.jsx` and replace:
   ```js
   const HUBSPOT_PORTAL_ID = 'YOUR_PORTAL_ID';
   const HUBSPOT_FORM_ID   = 'YOUR_FORM_ID';
   ```
4. Rebuild and redeploy.

Submissions silently swallow errors — the user always proceeds to the results page regardless of API success, so the gate never blocks access due to a network issue.

## Customizing Benchmarks

Default values for all savings inputs live in `src/App.jsx` under `defaultSavings`:

| Key | Default | Description |
|-----|---------|-------------|
| `meetingMinutesSaved` | 30 | Minutes saved per person per day on production meetings |
| `meetingPeopleAffected` | 5 | Number of people attending daily production meetings |
| `handlerSearchMinutesSaved` | 45 | Minutes saved per material handler per day searching for parts |
| `handlerSearchPeopleAffected` | 8 | Number of material handlers |
| `productionSearchMinutesSaved` | 30 | Minutes saved per planner per day on exception management |
| `productionSearchPeopleAffected` | 3 | Number of planners / production control staff |
| `cycleCountQuarterlySavings` | 15000 | Dollar savings per quarterly cycle count |
| `revenueAccelerationMonthly` | 8000 | Monthly revenue acceleration from reduced WIP delays |

Default financial inputs live in `defaultFin`:

| Key | Default | Description |
|-----|---------|-------------|
| `capex` | 50000 | One-time hardware & installation cost |
| `contingencyRate` | 0.10 | 10% contingency buffer on CapEx |
| `monthlyPlatformFee` | 3000 | Xemelgo monthly SaaS fee |
| `wacc` | 0.10 | Weighted average cost of capital (10%) |

## Project Structure

```
src/
  App.jsx                          # Root component, state, step routing
  index.css                        # Tailwind directives
  utils/
    calculations.js                # All financial math (labor savings, NPV, IRR, payback)
    format.js                      # Display formatters ($, %, weeks, hrs/wk)
  components/
    ProgressIndicator.jsx          # Step progress bar
    ThankYou.jsx                   # Final results page
    steps/
      Step1_OperationProfile.jsx   # Facility & headcount inputs
      Step2_SavingsInputs.jsx      # Labor & other savings with live calc
      Step3_FinancialResults.jsx   # CapEx/SaaS inputs + metric cards
      Step4_EmailGate.jsx          # Contact form + HubSpot submission
```
