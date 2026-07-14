
import fs from 'fs';
import {Asset} from '../../sources/base';
import {
  chromium,
  LaunchOptions,
  Page,
  Browser,
  ElementHandle,
  BrowserContext,
} from 'playwright';
import { generateSync } from 'otplib';

let debugCount = 0;

interface MoneyforwardCashAccountConfig {
  email?: string;
  password?: string;
  playwrightOptions?: LaunchOptions;
  debug?: boolean;
  twoFASecret?: string;
}

export class MoneyforwardCashAccount {
  private config: MoneyforwardCashAccountConfig;
  private initiated: boolean;
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;

  /**
   * Creates an instance of MoneyforwardCashAccount
   * @param {MoneyforwardCashAccountConfig} config
   * @memberof MoneyforwardCashAccount
   */
  constructor(config: MoneyforwardCashAccountConfig) {
    this.config = {
      email: process.env.MONEYFORWARD_USER,
      password: process.env.MONEYFORWARD_PASSWORD,
      playwrightOptions: {},
      debug: false,
      twoFASecret: process.env.MONEYFORWARD_2FA_SECRET,
      ...config,
    };
    this.initiated = false;
  }

  /**
   * Generate a TOTP code using the secret key
   *
   * @private
   * @return {string} The generated 2FA code
   * @memberof MoneyforwardCashAccount
   */
  private generateTOTPCode(): string {
    if (!this.config.twoFASecret) {
      throw new Error('Two-factor authentication secret is required');
    }

    return generateSync({ secret: this.config.twoFASecret });
  }

  /**
   * Update current balance for a manual account
   *
   * @param {string} account
   * @param {Asset[]} assets
   * @memberof MoneyforwardCashAccount
   */
  public async updateCryptoBalance(account: string, assets: Asset[]) {
    if (!this.initiated) await this.initiate();

    const page = await this.createNewPage();

    try {
      if (account.startsWith('https://')) {
        await page.goto(account);
      } else {
      await page.goto('https://moneyforward.com/accounts');
        await (
          (await page.waitForSelector(
            `xpath=.//section[@class='manual_accounts']//a[contains(., '${account}')]`
          )) as ElementHandle<Element>
        )?.click();
      }

      for (const asset of assets) {
        await page.waitForSelector("xpath=.//a[contains(., '手入力で資産を追加')]", {
          state: 'visible',
        });
        const [row] = await page.$$(
          `xpath=.//table[@id="TABLE_1"]//tr[contains(., "${asset.name}")]`
        );
        if (row) {
          await (await row.waitForSelector('.btn-asset-action'))?.click();
        } else {
          await (
            (await page.waitForSelector("xpath=.//a[contains(., '手入力で資産を追加')]", {
              state: 'visible',
            })) as ElementHandle<Element>
          )?.click();
          await page.waitForSelector('div.modal.in #user_asset_det_asset_subclass_id', {
            state: 'visible'
          });
          await page.selectOption(
            'div.modal.in #user_asset_det_asset_subclass_id',
            '66'
          ); // 暗号資産
          await page.fill('div.modal.in #user_asset_det_name', asset.name);
        }
        await page.waitForSelector('div.modal.in #user_asset_det_value', {
          state: 'visible',
        });
        await page.fill(
          'div.modal.in #user_asset_det_value',
          Math.round(asset.value).toString()
        );
        if (asset.bought) {
          await page.fill(
            'div.modal.in #user_asset_det_entried_price',
            Math.round(asset.bought).toString()
          );
        }
        const jstDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
        const dateStr = `${jstDate.getFullYear()}/${String(jstDate.getMonth() + 1).padStart(2, '0')}/${String(jstDate.getDate()).padStart(2, '0')}`;
        await page.evaluate(({ selector, value }) => {
          const el = document.querySelector(selector) as HTMLInputElement;
          if (el) el.value = value;
        }, { selector: 'div.modal.in #user_asset_det_entried_at', value: dateStr });
        await (
          await page.waitForSelector(
            'div.modal.in input[value="この内容で登録する"]',
            {
              state: 'visible',
            }
          )
        )?.click();
      }
    } catch (error) {
      await this.debug(error as Error);
      throw error;
    }
  }

  /**
   * Update digital pay balance for a manual account
   *
   * @param {string} account
   * @param {numer} balance
   * @memberof MoneyforwardCashAccount
   */
  public async updatePayBalance(account: string, balance: number) {
    if (!this.initiated) await this.initiate();

    const page = this.page!;

    try {
      await page.goto('https://moneyforward.com/accounts');
      await (
        (await page.waitForSelector(
          `xpath=.//section[@class='manual_accounts']//a[contains(., '${account}')]`
        )) as ElementHandle<Element>
      )?.click();

      await page.waitForSelector("xpath=.//h1[contains(., '残高推移')]", {
        state: 'visible',
      });

      await (await page.waitForSelector('.heading-small > .btn-success.btn'))?.click();

      await page.fill('#rollover_info_value', balance.toString());
      await (
        await page.waitForSelector(
          '.controls > .btn-success.btn',
          {
            state: 'visible',
          }
        )
      )?.click();
    } catch (error) {
      await this.debug(error as Error);
      throw error;
    }
  }

  /**
   * Update points balance for a manual account
   *
   * @param {string} account
   * @param {numer} balance
   * @memberof MoneyforwardCashAccount
   */
  public async updatePointsBalance(account: string, balance: number) {
    if (!this.initiated) await this.initiate();
    else {
      this.page = await this.createNewPage();
    }

    const page = this.page!;

    try {
      await page.goto('https://moneyforward.com/accounts');
      await (
        (await page.waitForSelector(
          `xpath=.//section[@class='manual_accounts']//a[contains(., '${account}')]`
        )) as ElementHandle<Element>
      )?.click();

      await page.waitForSelector(`xpath=.//h1[contains(., '${account}')]`, {
        state: 'visible',
      });

      await (await page.waitForSelector('.btn-asset-action'))?.click();

      const input = (await page.waitForSelector(
        '#portfolio_det_po #user_asset_det_value',
        { state: 'visible' }
      )) as ElementHandle<Element>;
      await input.fill(balance.toString());
      await (
        await page.waitForSelector(
          '#portfolio_det_po .controls > .btn-success.btn',
          {
            state: 'visible',
          }
        )
      )?.click();
    } catch (error) {
      await this.debug(error as Error);
      throw error;
    }
  }

  /**
   * Close chrome
   *
   * @return {*}
   * @memberof MoneyforwardCashAccount
   */
  public finalize() {
    if (!this.browser) return;

    this.browser.close();
  }

  /**
   * Prepair chromedriver and login to Moneyforward
   *
   * @private
   * @memberof MoneyforwardCashAccount
   */
  private async initiate() {
    const launchOptions: LaunchOptions = {
      headless: true,
      slowMo: 100,
      executablePath: process.env.CHRONIUM_BINARY_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
      ...this.config.playwrightOptions,
    };
    this.browser = await chromium.launch(launchOptions);
    this.context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0',
    });
    this.page = await this.context.newPage();
    this.page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.login(this.page);
    this.initiated = true;
  }

  /**
   * Create new page with same settings as main page
   *
   * @private
   * @returns {Promise<Page>}
   * @memberof MoneyforwardCashAccount
   */
  private async createNewPage(): Promise<Page> {
    const page = await this.context!.newPage();
    if (this.page) {
      await this.page.close();
    }
    this.page = page;
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    return page;
  }

  /**
   * Login to Moneyforward
   *
   * @private
   * @param {Page} page
   * @memberof MoneyforwardCashAccount
   */
  private async login(page: Page) {
    try {
      await page.goto('https://moneyforward.com/login');
      await (
        await page.waitForSelector('a.link-btn-reg', {
          state: 'visible',
        })
      )?.click();
      await (
        await page.waitForSelector('[id="mfid_user[email]"]', {
          state: 'visible',
        })
      )?.fill(this.config.email!);
      await (
        await page.waitForSelector('#submitto', {
          state: 'visible',
        })
      )?.click();
      await (
        await page.waitForSelector('[id="mfid_user[password]"]', {
          state: 'visible',
        })
      )?.fill(this.config.password!);
      await (
        await page.waitForSelector('#submitto', {
          state: 'visible',
        })
      )?.click();
      // Wait for either the OTP screen or a successful login
      await page.waitForSelector('#otp_attempt, .right-nav', {
        state: 'visible',
      });

      if (await page.$('#otp_attempt')) {
        // Handle 2FA if required
        await this.generateAndEnterOTP(page);
      }
      await page.waitForSelector('.right-nav', {
        state: 'visible',
      });
    } catch (error) {
      await this.debug(error as Error);
      throw error;
    }
  }

  /**
   * Generate and enter one-time passcode for two-factor authentication
   *
   * @private
   * @param {Page} page - The Playwright page instance
   * @return {Promise<void>}
   * @memberof MoneyforwardCashAccount
   */
  private async generateAndEnterOTP(page: Page): Promise<void> {
    try {
      // Check if we're on the OTP screen
      const otpInput = await page.$('#otp_attempt');
      if (!otpInput) {
        console.log('Not on OTP screen');
        return;
      }

      // Get the OTP code - either from the config or generate it
      let otpCode: string;
      if (this.config.twoFASecret) {
        otpCode = this.generateTOTPCode();
        if (this.config.debug) {
          console.log('Generated OTP code:', otpCode);
        }
      } else {
        throw new Error('No two-factor authentication method provided (code or secret)');
      }

      // Wait for the OTP input to be visible
      await page.waitForSelector('#otp_attempt', { state: 'visible' });

      // Enter the OTP code
      await page.fill('#otp_attempt', otpCode);

      // Click the verify button
      await page.click('#submitto');

      await page.waitForSelector('.right-nav', {
        state: 'visible',
      });
    } catch (error) {
      await this.debug(error as Error);
      throw new Error(`Failed to generate or enter OTP: ${error}`);
    }
  }

  /**
   * Wait for X miliseconds
   *
   * @private
   * @param {number} miliseconds
   * @memberof MoneyforwardCashAccount
   */
  private async wait(miliseconds: number) {
    await new Promise(r => setTimeout(r, miliseconds));
  }

  /**
   * Take screenshot and dump html of current page.
   *
   * @private
   * @param {Error} [error]
   * @return {*}
   * @memberof MoneyforwardCashAccount
   */
  private async debug(error?: Error) {
    if (!this.config.debug) return;

    if (!error) {
      const stack = new Error().stack?.split('\n')[2];
      console.debug('Debug:', stack);
    }
    console.log('Current url:', this.page?.url());
    const currentFolder = process.cwd();
    const html = await this.page?.content();
    fs.writeFileSync(
      `${currentFolder}/debug_${debugCount}.html`,
      html || 'null'
    );
    await this.page!.screenshot({
      path: `${currentFolder}/debug_${debugCount}.png`,
      fullPage: true,
    });
    console.debug(
      'Screenshot saved at',
      `${currentFolder}/debug_${debugCount}.png`
    );
    debugCount += 1;
  }

  public async closePage() {
    if (this.page) {
      await this.page.close();
      this.page = undefined;
    }
  }
}
