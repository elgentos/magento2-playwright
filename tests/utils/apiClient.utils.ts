// @ts-check

import {request, expect, APIRequestContext, APIResponse} from '@playwright/test';
import {requireEnv} from '@utils/env.utils';

class ApiClient {
  private context!: APIRequestContext;
  private token: string | undefined;
  private tokenExpiry: number | undefined;

  constructor() {
  }

  async create(): Promise<ApiClient> {
	await this.ensureToken();

	this.context = await request.newContext({
	  baseURL: requireEnv('PLAYWRIGHT_BASE_URL'),
	  extraHTTPHeaders: {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${this.token}`,
	  },
	});

	return this;
  }

  private async ensureToken(): Promise<void> {
	if (!this.token || this.isTokenExpired()) {
	  this.token = await this.refreshIntegrationToken();
	}
  }

  private async refreshIntegrationToken(): Promise<string> {
	// Create temporary request context for the token.
	const tempContext = await request.newContext({
	  baseURL: requireEnv('PLAYWRIGHT_BASE_URL'),
	  extraHTTPHeaders: {
		'Content-Type': 'application/json',
	  },
	});

	const response = await tempContext.post('/rest/V1/integration/admin/token', {
	  data: {
		username: requireEnv('MAGENTO_API_USERNAME'),
		password: requireEnv('MAGENTO_API_PASSWORD'),
	  },
	});

	if (!response.ok()) {
	  const errorBody = await response.text();
	  await tempContext.dispose();
	  throw new Error(`Failed to obtain integration token: ${response.status()} ${errorBody}`);
	}

	const token = await response.json();
	const expiresHeader = response.headers()['expires'];
	if (expiresHeader) {
	  this.tokenExpiry = new Date(expiresHeader).getTime(); // Converts to timestamp
	} else {
	  this.tokenExpiry = Date.now() + (3600 * 1000); // Fallback if no Expires header is present
	}

	console.log('response', expiresHeader, this.tokenExpiry);

	await tempContext.dispose();
	return token;
  }

  private isTokenExpired(): boolean {
	return !this.tokenExpiry || Date.now() >= this.tokenExpiry;
  }

  async get(url: string) {
	const response = await this.context.get(url);
	expect(response.ok()).toBeTruthy();
	return await response.json();
  }

  async post(url: string, payload: Record<string, unknown>) {
	const response = await this.context.post(url, {data: payload});
	expect(response.ok()).toBeTruthy();
	return await response.json();
  }

  async delete(url: string) {
	const response = await this.context.delete(url);
	expect(response.ok()).toBeTruthy();
  }

  async handleResponse(response: APIResponse) {
	if (!response.ok()) {
	  const body = await response.text();
	  throw new Error(`API call failed [${response.status()}]: ${body}`);
	}
	return await response.json();
  }

  async dispose() {
	await this.context.dispose();
  }
}

export default ApiClient;