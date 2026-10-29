// @ts-check

import { randomUUID } from 'node:crypto';
import { inputValues } from '@config';
import ApiClient from '@utils/apiClient.utils';

const allocationTimeout = 60_000;
const allocationPollInterval = 500;
const staleFixtureAge = 30 * 60_000;

export interface CustomOptionsProductFixture {
	name: string;
	optionIds: number[];
	sku: string;
	slug: string;
}

interface MagentoCustomOption {
	option_id?: number;
	sku?: string;
}

interface MagentoProduct {
	id?: number;
	name: string;
	options?: MagentoCustomOption[];
	sku: string;
}

interface ProductSearchResult {
	items: MagentoProduct[];
}

interface StockStatus {
	stock_status: boolean;
}

function optionValues(optionSkuPrefix: string, optionCode: string) {
	return inputValues.customOptions.selectionValues.map(
		(
			value: {
				price: number;
				priceType: string;
				title: string;
			},
			index: number,
		) => ({
			price: value.price,
			price_type: value.priceType,
			sku: `${optionSkuPrefix}-${optionCode}-${index + 1}`,
			sort_order: index + 1,
			title: value.title,
		}),
	);
}

function fixtureNamespace(projectName: string): string {
	const project =
		projectName
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 8) || 'project';
	const timestamp = Date.now().toString(36);
	const uniqueId = randomUUID().replace(/-/g, '').slice(0, 4);
	return `${timestamp}-${project}-${uniqueId}`;
}

function isFixtureOption(option: MagentoCustomOption): boolean {
	return option.sku?.startsWith(`${inputValues.customOptions.skuPrefix}-`) ?? false;
}

function isStaleFixtureOption(option: MagentoCustomOption): boolean {
	if (!isFixtureOption(option) || !option.sku) {
		return false;
	}
	const timestampPart = option.sku
		.slice(inputValues.customOptions.skuPrefix.length + 1)
		.split('-')[0];
	const timestamp = Number.parseInt(timestampPart, 36);
	return !Number.isFinite(timestamp) || Date.now() - timestamp > staleFixtureAge;
}

async function readProduct(apiClient: ApiClient, sku: string): Promise<MagentoProduct> {
	return (await apiClient.get(`/rest/V1/products/${encodeURIComponent(sku)}`)) as MagentoProduct;
}

async function discoverEligibleProducts(apiClient: ApiClient): Promise<MagentoProduct[]> {
	const search = (await apiClient.get(
		'/rest/V1/products' +
			'?searchCriteria[filterGroups][0][filters][0][field]=type_id' +
			'&searchCriteria[filterGroups][0][filters][0][value]=simple' +
			'&searchCriteria[filterGroups][0][filters][0][conditionType]=eq' +
			'&searchCriteria[filterGroups][1][filters][0][field]=status' +
			'&searchCriteria[filterGroups][1][filters][0][value]=1' +
			'&searchCriteria[filterGroups][1][filters][0][conditionType]=eq' +
			'&searchCriteria[filterGroups][2][filters][0][field]=visibility' +
			'&searchCriteria[filterGroups][2][filters][0][value]=2%2C3%2C4' +
			'&searchCriteria[filterGroups][2][filters][0][conditionType]=in' +
			'&searchCriteria[sortOrders][0][field]=sku' +
			'&searchCriteria[sortOrders][0][direction]=ASC' +
			'&searchCriteria[pageSize]=100',
	)) as ProductSearchResult;
	const eligibleProducts: MagentoProduct[] = [];

	for (const candidate of search.items) {
		const product = await readProduct(apiClient, candidate.sku);
		const hasUnrelatedOptions = product.options?.some((option) => !isFixtureOption(option));
		if (product.id === undefined || hasUnrelatedOptions) {
			continue;
		}

		const stockStatus = (await apiClient.get(
			`/rest/V1/stockStatuses/${encodeURIComponent(product.sku)}`,
		)) as StockStatus;
		if (stockStatus.stock_status) {
			eligibleProducts.push(product);
		}
	}

	if (!eligibleProducts.length) {
		throw new Error('No in-stock simple product is available for the custom-options fixture.');
	}
	return eligibleProducts;
}

async function removeOptions(
	apiClient: ApiClient,
	sku: string,
	optionIds: number[],
): Promise<void> {
	for (const optionId of [...optionIds].reverse()) {
		await apiClient.delete(`/rest/V1/products/${encodeURIComponent(sku)}/options/${optionId}`);
	}
}

async function removeStaleFixtureOptions(
	apiClient: ApiClient,
	product: MagentoProduct,
): Promise<MagentoProduct> {
	const staleOptionIds = (product.options ?? [])
		.filter(isStaleFixtureOption)
		.map((option) => option.option_id)
		.filter((optionId): optionId is number => optionId !== undefined);
	if (!staleOptionIds.length) {
		return product;
	}

	await removeOptions(apiClient, product.sku, staleOptionIds);
	return readProduct(apiClient, product.sku);
}

async function tryClaimProduct(
	apiClient: ApiClient,
	candidate: MagentoProduct,
	optionSkuPrefix: string,
): Promise<{ lockId: number; product: MagentoProduct } | undefined> {
	let product = await readProduct(apiClient, candidate.sku);
	if (product.options?.some((option) => !isFixtureOption(option))) {
		return undefined;
	}
	product = await removeStaleFixtureOptions(apiClient, product);
	if (product.options?.some(isFixtureOption)) {
		return undefined;
	}

	const lock = (await apiClient.post('/rest/V1/products/options', {
		option: {
			is_require: false,
			max_characters: 1,
			price: 0,
			price_type: 'fixed',
			product_sku: product.sku,
			sku: `${optionSkuPrefix}-lock`,
			sort_order: 1000,
			title: `${inputValues.customOptions.fixtureLockLabel} ${optionSkuPrefix}`,
			type: 'field',
		},
	})) as MagentoCustomOption;
	if (lock.option_id === undefined) {
		throw new Error(`Magento did not return an ID for the fixture lock on ${product.sku}.`);
	}

	try {
		product = await readProduct(apiClient, product.sku);
		const winningLock = (product.options ?? [])
			.filter(
				(option) =>
					isFixtureOption(option) &&
					option.sku?.endsWith('-lock') &&
					option.option_id !== undefined,
			)
			.sort((first, second) => (first.option_id ?? 0) - (second.option_id ?? 0))[0];
		if (winningLock?.option_id === lock.option_id) {
			return { lockId: lock.option_id, product };
		}
	} catch (error) {
		await removeOptions(apiClient, product.sku, [lock.option_id]);
		throw error;
	}

	await removeOptions(apiClient, product.sku, [lock.option_id]);
	return undefined;
}

async function claimFixtureProduct(
	apiClient: ApiClient,
	eligibleProducts: MagentoProduct[],
	optionSkuPrefix: string,
): Promise<{ lockId: number; product: MagentoProduct }> {
	const deadline = Date.now() + allocationTimeout;
	while (Date.now() < deadline) {
		for (const candidate of eligibleProducts) {
			const claimed = await tryClaimProduct(apiClient, candidate, optionSkuPrefix);
			if (claimed) {
				return claimed;
			}
		}
		await new Promise((resolve) => setTimeout(resolve, allocationPollInterval));
	}

	throw new Error('Timed out waiting for an available custom-options fixture product.');
}

export async function removeCustomOptions(
	apiClient: ApiClient,
	fixture: CustomOptionsProductFixture,
): Promise<void> {
	await removeOptions(apiClient, fixture.sku, fixture.optionIds);
}

export async function createCustomOptions(
	apiClient: ApiClient,
	projectName: string,
): Promise<CustomOptionsProductFixture> {
	const eligibleProducts = await discoverEligibleProducts(apiClient);
	const namespace = fixtureNamespace(projectName);
	const optionSkuPrefix = `${inputValues.customOptions.skuPrefix}-${namespace}`;
	const claimed = await claimFixtureProduct(apiClient, eligibleProducts, optionSkuPrefix);
	const optionIds = [claimed.lockId];

	const options = [
		{
			is_require: true,
			max_characters: 24,
			price: 5,
			price_type: 'fixed',
			product_sku: claimed.product.sku,
			sku: `${optionSkuPrefix}-field`,
			sort_order: 100,
			title: inputValues.customOptions.fieldLabel,
			type: 'field',
		},
		{
			is_require: true,
			max_characters: 80,
			price: 10,
			price_type: 'percent',
			product_sku: claimed.product.sku,
			sku: `${optionSkuPrefix}-area`,
			sort_order: 110,
			title: inputValues.customOptions.areaLabel,
			type: 'area',
		},
		{
			file_extension: inputValues.customOptions.upload.extension,
			image_size_x: 100,
			image_size_y: 100,
			is_require: true,
			price: 7,
			price_type: 'fixed',
			product_sku: claimed.product.sku,
			sku: `${optionSkuPrefix}-file`,
			sort_order: 120,
			title: inputValues.customOptions.fileLabel,
			type: 'file',
		},
		{
			is_require: true,
			product_sku: claimed.product.sku,
			sku: `${optionSkuPrefix}-dropdown`,
			sort_order: 130,
			title: inputValues.customOptions.dropdownLabel,
			type: 'drop_down',
			values: optionValues(optionSkuPrefix, 'dropdown'),
		},
		{
			is_require: true,
			product_sku: claimed.product.sku,
			sku: `${optionSkuPrefix}-radio`,
			sort_order: 140,
			title: inputValues.customOptions.radioLabel,
			type: 'radio',
			values: optionValues(optionSkuPrefix, 'radio'),
		},
		{
			is_require: true,
			product_sku: claimed.product.sku,
			sku: `${optionSkuPrefix}-checkbox`,
			sort_order: 150,
			title: inputValues.customOptions.checkboxLabel,
			type: 'checkbox',
			values: optionValues(optionSkuPrefix, 'checkbox'),
		},
		{
			is_require: true,
			product_sku: claimed.product.sku,
			sku: `${optionSkuPrefix}-multiple`,
			sort_order: 160,
			title: inputValues.customOptions.multipleLabel,
			type: 'multiple',
			values: optionValues(optionSkuPrefix, 'multiple'),
		},
		{
			is_require: true,
			price: 4,
			price_type: 'fixed',
			product_sku: claimed.product.sku,
			sku: `${optionSkuPrefix}-date`,
			sort_order: 170,
			title: inputValues.customOptions.dateLabel,
			type: 'date',
		},
		{
			is_require: true,
			price: 5,
			price_type: 'percent',
			product_sku: claimed.product.sku,
			sku: `${optionSkuPrefix}-date-time`,
			sort_order: 180,
			title: inputValues.customOptions.dateTimeLabel,
			type: 'date_time',
		},
		{
			is_require: true,
			price: 3,
			price_type: 'fixed',
			product_sku: claimed.product.sku,
			sku: `${optionSkuPrefix}-time`,
			sort_order: 190,
			title: inputValues.customOptions.timeLabel,
			type: 'time',
		},
	];

	try {
		for (const option of options) {
			const created = (await apiClient.post('/rest/V1/products/options', {
				option,
			})) as MagentoCustomOption;
			if (created.option_id === undefined) {
				throw new Error(`Magento did not return an ID for custom option ${option.title}.`);
			}
			optionIds.push(created.option_id);
		}

		return {
			name: claimed.product.name,
			optionIds,
			sku: claimed.product.sku,
			slug: `/catalog/product/view/id/${claimed.product.id}`,
		};
	} catch (error) {
		await removeOptions(apiClient, claimed.product.sku, optionIds);
		throw error;
	}
}
