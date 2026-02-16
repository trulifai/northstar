import type { Response } from 'express';
import { runtimeConfig, type ProviderName } from '../config/runtime';

const PROVIDER_LABELS: Record<ProviderName, string> = {
  congressGov: 'Congress.gov',
  gemini: 'Gemini',
  newsRss: 'RSS News',
  federalRegister: 'Federal Register',
  fec: 'FEC',
  lda: 'LDA',
};

export function providerStatus(): Record<ProviderName, 'enabled' | 'disabled'> {
  return {
    congressGov: runtimeConfig.providers.congressGov ? 'enabled' : 'disabled',
    gemini: runtimeConfig.providers.gemini ? 'enabled' : 'disabled',
    newsRss: runtimeConfig.providers.newsRss ? 'enabled' : 'disabled',
    federalRegister: runtimeConfig.providers.federalRegister ? 'enabled' : 'disabled',
    fec: runtimeConfig.providers.fec ? 'enabled' : 'disabled',
    lda: runtimeConfig.providers.lda ? 'enabled' : 'disabled',
  };
}

export function sendProviderDisabled(res: Response, provider: ProviderName) {
  return res.status(503).json({
    success: false,
    error: {
      code: 'PROVIDER_DISABLED',
      message: `${PROVIDER_LABELS[provider]} integration is disabled in this environment.`,
    },
    meta: {
      demoMode: runtimeConfig.demoMode,
      provider,
    },
  });
}

export function sendDemoSyncBlocked(res: Response, provider: ProviderName) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'DEMO_MODE_SYNC_DISABLED',
      message: `Live ${PROVIDER_LABELS[provider]} sync is blocked while DEMO_MODE=true.`,
    },
    meta: {
      demoMode: runtimeConfig.demoMode,
      provider,
    },
  });
}

export function isProviderEnabled(provider: ProviderName): boolean {
  return runtimeConfig.providers[provider];
}
