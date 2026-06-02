// @ts-check

import type { APIRequestContext, APIResponse, HTTPCredentials } from '@playwright/test';
import { request } from '@playwright/test';

import { getHttpCredentials, requireEnv } from './tests/utils/env.utils';

type PlaywrightRequestConfig = {
  baseURL: string;
  httpCredentials?: HTTPCredentials;
};

function getEnvOrFallback(varName: string, fallbackVarName: string): string {
  return process.env[varName] || requireEnv(fallbackVarName);
}

/**
 * Get HTTP authentication credentials from URL if they are provided.
 * @param rawUrl - URL from env variables.
 * @returns username and password from URL. If not present in URL,
 * returns them using 'getHttpCredentials' function instead.
 */
export function getPlaywrightRequestConfig(rawUrl = requireEnv('PLAYWRIGHT_BASE_URL')): PlaywrightRequestConfig {
  const parsedUrl = new URL(rawUrl);
  const username = decodeURIComponent(parsedUrl.username);
  const password = decodeURIComponent(parsedUrl.password);

  parsedUrl.username = '';
  parsedUrl.password = '';

  return {
    baseURL: parsedUrl.toString(),
    ...(username || password ? { httpCredentials: getHttpCredentials() } : {}),
  };
}

export function getPlaywrightApiRequestConfig(
  rawUrl = getEnvOrFallback('PLAYWRIGHT_API_BASE_URL', 'PLAYWRIGHT_BASE_URL')): PlaywrightRequestConfig {
  const parsedUrl = new URL(rawUrl);
  const username = decodeURIComponent(parsedUrl.username);
  const password = decodeURIComponent(parsedUrl.password);

  parsedUrl.username = '';
  parsedUrl.password = '';

  return {
    baseURL: parsedUrl.toString(),
    ...(username || password ? { httpCredentials: { username, password, send: 'always' as const } } : {}),
  };
}
