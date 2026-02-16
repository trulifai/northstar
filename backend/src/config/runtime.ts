import dotenv from 'dotenv';

dotenv.config();

function parseFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;

  const normalized = value.trim().toLowerCase();
  return !['0', 'false', 'no', 'off'].includes(normalized);
}

export const runtimeConfig = {
  demoMode: parseFlag(process.env.DEMO_MODE, false),
  providers: {
    congressGov: parseFlag(process.env.CONGRESS_ENABLED, true) && Boolean(process.env.CONGRESS_GOV_API_KEY),
    gemini: parseFlag(process.env.GEMINI_ENABLED, true) && Boolean(process.env.GEMINI_API_KEY),
    newsRss: parseFlag(process.env.NEWS_RSS_ENABLED, true),
    federalRegister: parseFlag(process.env.FEDERAL_REGISTER_ENABLED, true),
    fec: parseFlag(process.env.FEC_ENABLED, true),
    lda: parseFlag(process.env.LDA_ENABLED, true),
  },
} as const;

export type ProviderName = keyof typeof runtimeConfig.providers;
