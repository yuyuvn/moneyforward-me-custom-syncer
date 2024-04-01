import {SourceBase, Asset} from '../base';
import fs from 'fs';
import puppeteer, {
  PuppeteerLaunchOptions,
  Page,
  Browser,
  ElementHandle,
} from 'puppeteer';

let debugCount = 0;

/**
 * Config for Paypay source
 *
 * @interface PaypaySourceConfig
 */
export interface PaypaySourceConfig {
  yahooUserName?: string;
  yahooPassword?: string;
  puppeteerOptions?: PuppeteerLaunchOptions;
  debug?: boolean;
}

export class PaypaySource extends SourceBase<PaypaySourceConfig> {
  public config: PaypaySourceConfig;
  private initiated: boolean;
  private browser?: Browser;
  private page?: Page;

  constructor(config: PaypaySourceConfig) {
    super(config);
    this.config = {
      yahooUserName: process.env.YAHOO_USERNAME,
      yahooPassword: process.env.YAHOO_PASSWORD,
      puppeteerOptions: {},
      debug: false,
      ...config,
    }
    this.initiated = false;
  }

  async fetch(): Promise<number> {
    if (!this.initiated) await this.initiate();

    const page = this.page!;
    try {
      await page.goto('https://paypay.yahoo.co.jp/balance');
      const rawText = await page.evaluate(el => el?.textContent, await page.waitForSelector('.balance__amount'))
      const balance = parseInt(rawText!.replace(/[^0-9]/g, ''));

      return balance;
    } catch (error) {
      await this.debug(error as Error);
      throw error;
    }
  }

   /**
   * Prepair chromedriver and login to Yahoo
   *
   * @private
   */
   private async initiate() {
    const puppeteerOptions: PuppeteerLaunchOptions = {
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
      ...this.config.puppeteerOptions,
    };
    this.browser = await puppeteer.launch(puppeteerOptions);
    this.page = await this.browser.newPage();
    await this.page.setUserAgent(
      ''
    );
    this.page.on('dialog', async (dialog: any) => {
      await dialog.accept();
    });
    await this.login(this.page);
    this.initiated = true;
  }

  /**
   * Login to Yahoo
   *
   * @private
   * @param {Page} page
   */
  private async login(page: Page) {
    try {
      await page.goto('https://login.yahoo.co.jp/config/login?.src=paypay&.done=https%3A%2F%2Fpaypay.yahoo.co.jp%2Fbalance%3Fsc_e%3Dunknown&sc_e=unknown');
      await (
        await page.waitForSelector('#login_handle', {
          visible: true,
        })
      )?.type(this.config.yahooUserName!);
      await (
        await page.waitForSelector('form > .stack > div button', {
          visible: true,
        })
      )?.click();
      await (
        await page.waitForSelector('#password', {
          visible: true,
        })
      )?.type(this.config.yahooPassword!);
      await Promise.all([
        page.waitForNavigation({waitUntil: 'load'}),
        (
          await page.waitForSelector('.login > button', {
            visible: true,
          })
        )?.click(),
    ]);
    } catch (error) {
      await this.debug(error as Error);
      throw error;
    }
  }

  /**
   * Take screenshot and dump html of current page.
   *
   * @private
   * @param {Error} [error]
   * @return {*}
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
      `${currentFolder}/debug_yahoo_${debugCount}.html`,
      html || 'null'
    );
    await this.page!.screenshot({
      path: `${currentFolder}/debug_yahoo_${debugCount}.png`,
      fullPage: true,
    });
    console.debug(
      'Screenshot saved at',
      `${currentFolder}/debug_yahoo_${debugCount}.png`
    );
    debugCount += 1;
  }

  async fetchAll?(): Promise<Asset[]> {
    const balance = await this.fetch();
    return [{name: "Paypay", value: balance}];
  }
}
