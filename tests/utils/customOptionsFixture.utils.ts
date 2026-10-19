// @ts-check

import { inputValues } from '@config';
import ApiClient from '@utils/apiClient.utils';

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
	custom_attributes?: Array<{ attribute_code: string; value: unknown }>;
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

function optionValues(optionCode: string) {
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
			sku: `${inputValues.customOptions.skuPrefix}-${optionCode}-${index + 1}`,
			sort_order: index + 1,
			title: value.title,
		}),
	);
}

function attributeValue(product: MagentoProduct, code: string): string | undefined {
	const value = product.custom_attributes?.find(
		(attribute) => attribute.attribute_code === code,
	)?.value;
	return typeof value === 'string' ? value : undefined;
}

function projectSlot(projectName: string): number {
	const browserProjects = ['chromium', 'firefox', 'webkit'];
	const knownSlot = browserProjects.indexOf(projectName);
	if (knownSlot >= 0) {
		return knownSlot;
	}

	return [...projectName].reduce((total, character) => total + character.charCodeAt(0), 0) % 3;
}

async function selectFixtureProduct(
	apiClient: ApiClient,
	projectName: string,
): Promise<MagentoProduct> {
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
	const slot = projectSlot(projectName);
	const candidates = search.items.filter((_, index) => index % 3 === slot);

	for (const candidate of candidates) {
		const product = (await apiClient.get(
			`/rest/V1/products/${encodeURIComponent(candidate.sku)}`,
		)) as MagentoProduct;
		const urlKey = attributeValue(product, 'url_key');
		const hasUnrelatedOptions = product.options?.some(
			(option) => !option.sku?.startsWith(inputValues.customOptions.skuPrefix),
		);
		if (!urlKey || hasUnrelatedOptions) {
			continue;
		}

		const stockStatus = (await apiClient.get(
			`/rest/V1/stockStatuses/${encodeURIComponent(product.sku)}`,
		)) as StockStatus;
		if (stockStatus.stock_status) {
			return product;
		}
	}

	throw new Error(`No in-stock simple fixture product is available for project ${projectName}.`);
}

async function removeOptions(
	apiClient: ApiClient,
	sku: string,
	optionIds: number[],
): Promise<void> {
	for (const optionId of optionIds) {
		await apiClient.delete(`/rest/V1/products/${encodeURIComponent(sku)}/options/${optionId}`);
	}
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
	const product = await selectFixtureProduct(apiClient, projectName);
	const existingFixtureOptions = (product.options ?? []).filter((option) =>
		option.sku?.startsWith(inputValues.customOptions.skuPrefix),
	);
	await removeOptions(
		apiClient,
		product.sku,
		existingFixtureOptions
			.map((option) => option.option_id)
			.filter((optionId): optionId is number => optionId !== undefined),
	);

	const options = [
		{
			is_require: true,
			max_characters: 24,
			price: 5,
			price_type: 'fixed',
			product_sku: product.sku,
			sku: `${inputValues.customOptions.skuPrefix}-field`,
			sort_order: 100,
			title: inputValues.customOptions.fieldLabel,
			type: 'field',
		},
		{
			is_require: true,
			max_characters: 80,
			price: 10,
			price_type: 'percent',
			product_sku: product.sku,
			sku: `${inputValues.customOptions.skuPrefix}-area`,
			sort_order: 110,
			title: inputValues.customOptions.areaLabel,
			type: 'area',
		},
		{
			file_extension: 'png',
			image_size_x: 100,
			image_size_y: 100,
			is_require: true,
			price: 7,
			price_type: 'fixed',
			product_sku: product.sku,
			sku: `${inputValues.customOptions.skuPrefix}-file`,
			sort_order: 120,
			title: inputValues.customOptions.fileLabel,
			type: 'file',
		},
		{
			is_require: true,
			product_sku: product.sku,
			sku: `${inputValues.customOptions.skuPrefix}-dropdown`,
			sort_order: 130,
			title: inputValues.customOptions.dropdownLabel,
			type: 'drop_down',
			values: optionValues('dropdown'),
		},
		{
			is_require: true,
			product_sku: product.sku,
			sku: `${inputValues.customOptions.skuPrefix}-radio`,
			sort_order: 140,
			title: inputValues.customOptions.radioLabel,
			type: 'radio',
			values: optionValues('radio'),
		},
		{
			is_require: true,
			product_sku: product.sku,
			sku: `${inputValues.customOptions.skuPrefix}-checkbox`,
			sort_order: 150,
			title: inputValues.customOptions.checkboxLabel,
			type: 'checkbox',
			values: optionValues('checkbox'),
		},
		{
			is_require: true,
			product_sku: product.sku,
			sku: `${inputValues.customOptions.skuPrefix}-multiple`,
			sort_order: 160,
			title: inputValues.customOptions.multipleLabel,
			type: 'multiple',
			values: optionValues('multiple'),
		},
		{
			is_require: true,
			price: 4,
			price_type: 'fixed',
			product_sku: product.sku,
			sku: `${inputValues.customOptions.skuPrefix}-date`,
			sort_order: 170,
			title: inputValues.customOptions.dateLabel,
			type: 'date',
		},
		{
			is_require: true,
			price: 5,
			price_type: 'percent',
			product_sku: product.sku,
			sku: `${inputValues.customOptions.skuPrefix}-date-time`,
			sort_order: 180,
			title: inputValues.customOptions.dateTimeLabel,
			type: 'date_time',
		},
		{
			is_require: true,
			price: 3,
			price_type: 'fixed',
			product_sku: product.sku,
			sku: `${inputValues.customOptions.skuPrefix}-time`,
			sort_order: 190,
			title: inputValues.customOptions.timeLabel,
			type: 'time',
		},
	];
	const optionIds: number[] = [];

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
		name: product.name,
		optionIds,
		sku: product.sku,
		slug: `/${attributeValue(product, 'url_key')}.html`,
	};
}
