// @ts-check

import { request, APIRequestContext, APIResponse } from '@playwright/test';
import { requireEnv, getHttpCredentials } from '@utils/env.utils';

class ApiClient {
	private context!: APIRequestContext;
	private token: string | undefined;
	private tokenExpiry: number | undefined;

	constructor() {}

	// ==============================================
	// General / initialization methods
	// ==============================================

	/**
	 * Initializes the ApiClient by ensuring a valid token and setting up the request context.
	 * @returns {Promise<ApiClient>} A Promise that resolves to an instance of ApiClient.
	 */
	async create(): Promise<ApiClient> {
		await this.ensureToken();

		this.context = await request.newContext({
			baseURL: requireEnv('PLAYWRIGHT_BASE_URL'),
			extraHTTPHeaders: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.token}`,
			},
			httpCredentials: getHttpCredentials(),
		});

		return this;
	}

	/**
	 * Ensures the API token is valid, refreshing it if expired or absent.
	 * @private
	 * @returns {Promise<void>}
	 */
	private async ensureToken(): Promise<void> {
		if (!this.token || this.isTokenExpired()) {
			this.token = await this.refreshIntegrationToken();
		}
	}

	/**
	 * Fetches a new API token from the server and sets the expiry time.
	 * @private
	 * @returns {Promise<string>} A Promise that resolves to the token string.
	 * @throws {Error} If token retrieval fails.
	 */
	private async refreshIntegrationToken(): Promise<string> {
		const tempContext = await request.newContext({
			baseURL: requireEnv('PLAYWRIGHT_BASE_URL'),
			extraHTTPHeaders: {
				'Content-Type': 'application/json',
			},
			httpCredentials: getHttpCredentials(),
		});

		const response = await tempContext.post('/rest/V1/integration/admin/token', {
			data: {
				username: requireEnv('MAGENTO_ADMIN_USERNAME'),
				password: requireEnv('MAGENTO_ADMIN_PASSWORD'),
			},
		});

		if (!response.ok()) {
			const errorBody = await response.text();
			await tempContext.dispose();
			throw new Error(
				`Failed to obtain integration token: ${response.status()} ${errorBody}`,
			);
		}

		const token = await response.json();
		const expiresHeader = response.headers()['expires'];
		if (expiresHeader) {
			this.tokenExpiry = new Date(expiresHeader).getTime();
		} else {
			this.tokenExpiry = Date.now() + 3600 * 1000;
		}

		await tempContext.dispose();
		return token;
	}

	/**
	 * Determines if the current token is expired.
	 * @private
	 * @returns {boolean} True if the token is expired, otherwise false.
	 */
	private isTokenExpired(): boolean {
		return !this.tokenExpiry || Date.now() >= this.tokenExpiry;
	}

	// ==============================================
	// CRUD methods
	// ==============================================

	/**
	 * Performs a GET request to the specified URL.
	 * @param {string} url The endpoint URL to send the request to.
	 * @returns {Promise<any>} A Promise that resolves to the response JSON.
	 */
	async get(url: string): Promise<any> {
		const response = await this.context.get(url);
		return this.handleResponse(response);
	}

	/**
	 * Performs a POST request with the given payload to the specified URL.
	 * @param {string} url The endpoint URL to send the request to.
	 * @param {Record<string, unknown>} payload The data payload to send with the request.
	 * @returns {Promise<any>} A Promise that resolves to the response JSON.
	 * @throws {Error} If the response indicates failure.
	 */
	async post(url: string, payload: Record<string, unknown>): Promise<any> {
		const response = await this.context.post(url, { data: payload });
		return this.handleResponse(response);
	}

	/**
	 * Performs a PUT request with the given payload to the specified URL.
	 * @param {string} url The endpoint URL to send the request to.
	 * @param {Record<string, unknown>} payload The data payload to send with the request.
	 * @returns {Promise<any>} A Promise that resolves to the response JSON.
	 * @throws {Error} If the response indicates failure.
	 */
	async put(url: string, payload: Record<string, unknown>): Promise<any> {
		const response = await this.context.put(url, { data: payload });
		return this.handleResponse(response);
	}

	/**
	 * Performs a DELETE request to the specified URL.
	 * @param {string} url The endpoint URL to send the request to.
	 * @returns {Promise<void>} does not return anything except if the delete request failed.
	 */
	async delete(url: string): Promise<void> {
		const response = await this.context.delete(url);
		if (!response.ok()) {
			throw new Error(`API call failed [${response.status()}]: ${await response.text()}`);
		}
		await this.handleResponse(response);
	}

	/**
	 * Performs a GET to check if stale accounts are present.
	 * These items come from account tests. If found, performs a DELETE request.
	 * @param {string} item account to search for.
	 * @returns {Promise<void>} does not return anything except if the delete request failed.
	 */
	async clearStaleAccounts(item: string): Promise<void> {
		const searchResponse = await this.get(
			`/rest/V1/customers/search` +
				`?searchCriteria[filterGroups][0][filters][0][field]=email` +
				`&searchCriteria[filterGroups][0][filters][0][value]=${item}` +
				`&searchCriteria[filterGroups][0][filters][0][conditionType]=eq`,
		);

		if (searchResponse.items?.length > 0) {
			await this.delete(`/rest/V1/customers/${searchResponse.items[0].id}`);
		}
	}

	// ==============================================
	// Handling methods
	// ==============================================

	/**
	 * Handles an API response, checking for success and parsing the JSON body.
	 * @param {APIResponse} response The response object to handle.
	 * @returns {Promise<any>} A Promise that resolves to the response JSON.
	 * @throws {Error} If the response is not successful.
	 */
	async handleResponse(response: APIResponse): Promise<any> {
		if (!response.ok()) {
			const body = await response.text();
			throw new Error(`API call failed [${response.status()}]: ${body}`);
		}
		return await response.json();
	}

	/**
	 * Disposes of the current request context.
	 * @returns {Promise<void>}
	 */
	async dispose(): Promise<void> {
		await this.context.dispose();
	}
}

export default ApiClient;
