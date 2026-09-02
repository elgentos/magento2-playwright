// @ts-check

import { expect, type Page, type Request } from '@playwright/test';

/**
 * Magewire traffic observed for a single Page.
 *
 * @property inFlight - requests that have started but not yet settled. Keyed on
 *   the Request object rather than the URL: a Magewire cascade can have two
 *   concurrent posts to the same component, and keying on URL collapses them
 *   into one entry so the first response drains the set while the second is
 *   still open.
 * @property lastActivityAt - timestamp of the most recent request or response,
 *   used to measure how long the cascade has been quiet.
 */
type MagewireTraffic = {
	inFlight: Set<Request>;
	lastActivityAt: number;
};

class MagewireUtils {
	/**
	 * Traffic is tracked per Page, not per instance. Every page object extending
	 * MagewireUtils creates its own instance, so instance-local state means each
	 * page object observes nothing but its own listeners - and a page object that
	 * never called startMonitoring() sees an empty set forever, turning
	 * waitForMagewireRequests() into a fixed short sleep.
	 */
	protected static readonly traffic = new WeakMap<Page, MagewireTraffic>();

	protected page: Page;

	constructor(page: Page) {
		this.page = page;
		this.startMonitoring();
	}

	/**
	 * Sets up request/response monitoring for Magewire traffic.
	 *
	 * Called from the constructor, so monitoring is always active before any
	 * Magewire activity this instance could wait on. Idempotent per Page:
	 * listeners are attached once, however many page objects wrap that Page.
	 */
	startMonitoring(): void {
		if (MagewireUtils.traffic.has(this.page)) {
			return;
		}

		const traffic: MagewireTraffic = { inFlight: new Set(), lastActivityAt: 0 };
		MagewireUtils.traffic.set(this.page, traffic);

		this.page.on('request', (request) => {
			if (this.isMagewireRequest(request.url())) {
				traffic.inFlight.add(request);
				traffic.lastActivityAt = Date.now();
			}
		});

		const settle = (request: Request) => {
			if (traffic.inFlight.delete(request)) {
				traffic.lastActivityAt = Date.now();
			}
		};

		this.page.on('response', (response) => settle(response.request()));
		this.page.on('requestfailed', settle);
	}

	protected get traffic(): MagewireTraffic {
		return MagewireUtils.traffic.get(this.page) ?? { inFlight: new Set(), lastActivityAt: 0 };
	}

	/**
	 * Waits until all Magewire network requests are completed.
	 *
	 * The triggering action (e.g. a radio check) typically returns before the
	 * Magewire POST fires, because Alpine.js debounces input/change events.
	 * Without a wait for the request to *start*, the active-set check below
	 * trivially passes and we move on while a request is still queued.
	 *
	 * Selecting a shipping or payment method also starts a *cascade*: only once
	 * that syncInput response lands does the client fire follow-up requests
	 * (shipping_method_selected, payment_method_selected, ...) at the other
	 * checkout components. Those gaps run 1-2.5s with nothing in flight and
	 * window.magewire.processing false, so "no requests right now" does not mean
	 * settled - hence the quiet period rather than a short settling sleep.
	 */
	async waitForMagewireRequests(): Promise<void> {
		const debounceWindow = 600; // covers typical Alpine.js @input.debounce delays
		const quietPeriod = 2500; // must exceed the gaps between cascaded requests
		const maxWaitTime = 30000;
		const checkInterval = 50;

		const traffic = this.traffic;

		// If nothing is in flight yet, give a pending request a chance to fire.
		if (traffic.inFlight.size === 0) {
			await this.page
				.waitForRequest(/\/magewire\//, { timeout: debounceWindow })
				.catch(() => null);
		}

		const start = Date.now();

		while (Date.now() - start <= maxWaitTime) {
			const quiet =
				traffic.inFlight.size === 0 && Date.now() - traffic.lastActivityAt >= quietPeriod;

			if (quiet) {
				await this.waitForMagewireDomIdle();

				// The DOM-idle wait is itself a window in which the cascade can resume.
				if (traffic.inFlight.size === 0) {
					return;
				}
			}

			await this.page.waitForTimeout(checkInterval);
		}

		throw new Error('[Magewire] Timeout: Still pending requests after wait');
	}

	protected async waitForMagewireDomIdle(): Promise<void> {
		// 1. Check if there is no processing ongoing
		await this.page.waitForFunction(
			() => {
				return !(window.magewire && (window.magewire as any).processing);
			},
			{ timeout: 30000 },
		);

		// 2. Wait for all loader elements to disappear from the DOM
		const loader = this.page.locator('.magewire.notification.message.relative.sync-input');
		await expect(loader).toHaveCount(0, { timeout: 30000 });
	}

	protected isMagewireRequest(url: string): boolean {
		// Magewire posts go to /magewire/post/livewire/message/...
		return url.includes('/magewire/');
	}
}

export default MagewireUtils;
