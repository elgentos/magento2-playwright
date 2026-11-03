// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { inputValues, outcomeMarker, UIReference } from '@config';
import type { CustomOptionsProductFixture } from '@utils/customOptionsFixture.utils';
import NotificationValidatorUtils from '@utils/notificationValidator.utils';

export class ProductOptionsPage {
	constructor(public readonly page: Page) {}

	get addToCartButton(): Locator {
		return this.page.getByRole('button', {
			name: UIReference.text.shared.buttons.addToCart,
			exact: true,
		});
	}

	get optionsWrapper(): Locator {
		return this.page.locator(UIReference.selectors.frontend.product.customOptions.wrapper);
	}

	private option(title: string): Locator {
		return this.page
			.locator(UIReference.selectors.frontend.product.customOptions.container)
			.filter({ has: this.page.getByText(title, { exact: true }) });
	}

	private async selectFirstValues(select: Locator, count = 1): Promise<void> {
		const values = await select.locator('option').evaluateAll(
			(options, requested) =>
				options
					.map((option) => (option as HTMLOptionElement).value)
					.filter(Boolean)
					.slice(0, requested),
			count,
		);
		await select.selectOption(values);
	}

	private async setDate(title: string, includeDate: boolean, includeTime: boolean) {
		const selectors = UIReference.selectors.frontend.product.customOptions;
		const option = this.option(title);

		if (includeDate) {
			const month = option.locator(selectors.dateMonth);
			const day = option.locator(selectors.dateDay);
			const year = option.locator(selectors.dateYear);

			await month.selectOption('2');
			await day.selectOption('31');
			await this.selectFirstValues(year);
			await expect(day).not.toHaveValue('31');
			await day.selectOption('14');
		}

		if (includeTime) {
			await this.selectFirstValues(option.locator(selectors.dateHour));
			await option.locator(selectors.dateMinute).selectOption('15');
			const dayPart = option.locator(selectors.dateDayPart);
			if (await dayPart.count()) {
				await dayPart.selectOption('pm');
			}
		}
	}

	async open(fixture: CustomOptionsProductFixture): Promise<void> {
		await this.page.goto(fixture.slug);
		await expect(
			this.page.getByRole('heading', { level: 1, name: fixture.name }),
		).toBeVisible();
		await expect(this.optionsWrapper).toBeVisible();
	}

	async selectRequiredOptions(fixture: CustomOptionsProductFixture): Promise<void> {
		const labels = inputValues.customOptions;
		const selectors = UIReference.selectors.frontend.product.customOptions;
		await this.open(fixture);

		await this.page.evaluate(() => {
			window.dispatchEvent(new CustomEvent('update-product-final-price', { detail: 120 }));
			window.dispatchEvent(new CustomEvent('update-product-base-price', { detail: 100 }));
		});

		const file = this.option(labels.fileLabel).locator(selectors.file);
		const dropdown = this.option(labels.dropdownLabel).getByRole('combobox');
		const multiple = this.option(labels.multipleLabel).getByRole('listbox');

		await this.addToCartButton.press('Enter');
		await expect(file).toHaveJSProperty(
			'validationMessage',
			outcomeMarker.customOptions.fileRequired,
		);
		for (const select of [dropdown, multiple]) {
			await expect(select).toHaveJSProperty(
				'validationMessage',
				outcomeMarker.customOptions.selectionRequired,
			);
		}

		await this.option(labels.fieldLabel).getByRole('textbox').fill(labels.fieldValue);
		await this.option(labels.areaLabel).getByRole('textbox').fill(labels.areaValue);

		await file.setInputFiles({
			name: labels.upload.name,
			mimeType: labels.upload.mimeType,
			buffer: Buffer.from(labels.upload.base64, 'base64'),
		});
		await expect(file).toHaveJSProperty('validationMessage', '');

		await this.selectFirstValues(dropdown);
		await expect(dropdown).toHaveJSProperty('validationMessage', '');

		const radios = this.option(labels.radioLabel).getByRole('radio');
		await radios.nth(1).check();
		await radios.first().check();

		const checkboxes = this.option(labels.checkboxLabel).getByRole('checkbox');
		await checkboxes.first().check();
		await checkboxes.first().uncheck();
		await expect(checkboxes.first()).toHaveJSProperty(
			'validationMessage',
			outcomeMarker.customOptions.selectionRequired,
		);
		await checkboxes.first().check();

		await this.setDate(labels.dateLabel, true, false);
		await this.setDate(labels.dateTimeLabel, true, true);
		await this.setDate(labels.timeLabel, false, true);

		await this.addToCartButton.press('Enter');
		await expect(multiple).toBeFocused();
		await expect(multiple).toHaveJSProperty(
			'validationMessage',
			outcomeMarker.customOptions.selectionRequired,
		);
		await this.selectFirstValues(multiple, 2);
		await expect(multiple.locator('option:checked')).toHaveCount(2);
		await expect(multiple).toHaveJSProperty('validationMessage', '');
	}

	async addToCart(fixture: CustomOptionsProductFixture): Promise<void> {
		await this.addToCartButton.press('Enter');
		await new NotificationValidatorUtils(this.page).validate(
			`${outcomeMarker.productPage.simpleProductAddedNotification} ${fixture.name} ${outcomeMarker.productPage.productAddedNotificationSuffix}`,
		);
	}

	async replaceExistingFile(): Promise<void> {
		const selectors = UIReference.selectors.frontend.product.customOptions;
		await this.page
			.getByLabel(UIReference.text.frontend.common.navigation.toggleMinicart)
			.press('Enter');
		await this.page.getByLabel(UIReference.text.frontend.minicart.editProduct).press('Enter');

		const multiple = this.option(inputValues.customOptions.multipleLabel).getByRole('listbox');
		await expect(multiple.locator('option:checked')).toHaveCount(2);

		const file = this.page.locator(selectors.file);
		await expect(file).toBeDisabled();
		await this.page
			.getByRole('button', { name: UIReference.text.shared.buttons.change, exact: true })
			.press('Enter');
		await expect(file).toBeEnabled();
		await expect(this.page.locator(selectors.hiddenFile)).toHaveValue('save_new');
	}
}
