// @ts-check

import { APIRequestContext, request, expect } from '@playwright/test';
import { requireEnv } from '@utils/env.utils';

/**
 * Utility to create an api call.
 */
class ApiClient {
  private context: APIRequestContext;

  constructor(context: APIRequestContext) {
	this.context = context;
  }

  static async create(): Promise<ApiClient> {
	const context = await request.newContext({
	  baseURL: process.env.API_BASE_URL,
	  extraHTTPHeaders: {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${process.env.API_TOKEN || ''}`,
	  },
	});
	return new ApiClient(context);
  }

  async get(url: string) {
	const response = await this.context.get(`${url}`);
	expect(response.ok()).toBeTruthy();
	return await response.json();
  }

  async post(url: string, payload: Record<string, unknown>) {
	const response = await this.context.post(`${url}`, { data: payload });
	expect(response.ok()).toBeTruthy();
	return await response.json();
  }

  async delete(url: string) {
	const response = await this.context.delete(`${url}`);
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