import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import pkce from 'pkce-challenge';
import * as cheerio from 'cheerio';

class PayPayError extends Error {}
class PayPayLoginError extends Error {}
class NetworkError extends Error {}
class PayPayNetworkError extends Error {}

interface PayPayHeaders extends Record<string, string> {
  'Host': string;
  'Accept-Charset': string;
  'Client-Mode': string;
  'Client-OS-Release-Version': string;
  'Client-OS-Type': string;
  'Client-OS-Version': string;
  'Client-Type': string;
  'Client-UUID': string;
  'Client-Version': string;
  'Device-Brand-Name': string;
  'Device-Hardware-Name': string;
  'Device-Manufacturer-Name': string;
  'Device-Name': string;
  'Device-UUID': string;
  'Is-Emulator': string;
  'Network-Status': string;
  'System-Locale': string;
  'Timezone': string;
  'User-Agent': string;
  'Authorization': string;
}

class PayPay {
  private session: ReturnType<typeof axios.create>;
  private deviceUuid: string;
  private clientUuid: string;
  private proxy: any;
  private params: { payPayLang: string };
  private version: string;
  private headers: PayPayHeaders;
  private accessToken: string | null;
  public refreshToken: string | null;
  private timestamp: string | null;
  private codeVerifier: string;
  private codeChallenge: string;

  public money: number | null;
  public money_light: number | null;
  public all_balance: number | null;
  public useable_balance: number | null;
  public point: number | null;

  constructor() {
    this.session = axios.create();
    this.deviceUuid = uuidv4().toUpperCase();
    this.clientUuid = uuidv4().toUpperCase();
    this.params = {
      payPayLang: 'ja'
    };
    this.accessToken = '';
    this.refreshToken = null;
    this.timestamp = null;
    this.codeVerifier = '';
    this.codeChallenge = '';
    this.version = '';
    this.headers = {
      'Host': 'app4.paypay.ne.jp',
      'Accept-Charset': 'UTF-8',
      'Content-Type': 'application/json',
      'Client-Mode': 'NORMAL',
      'Client-OS-Release-Version': '16.7.5',
      'Client-OS-Type': 'IOS',
      'Client-OS-Version': '16.7.5',
      'Client-Type': 'PAYPAYAPP',
      'Client-UUID': this.clientUuid,
      'Client-Version': '',
      'Device-Brand-Name': 'apple',
      'Device-Hardware-Name': 'iPhone10,1',
      'Device-Manufacturer-Name': 'apple',
      'Device-Name': 'iPhone10,1',
      'Device-UUID': this.deviceUuid,
      'Is-Emulator': 'false',
      'Network-Status': 'WIFI',
      'System-Locale': 'ja',
      'Timezone': 'Asia/Tokyo',
      'User-Agent': '',
      'Authorization': ''
    };
    this.money = null;
    this.money_light = null;
    this.all_balance = null;
    this.useable_balance = null;
    this.point = null;
  }

  async init(accessToken: string, proxy: any = null) {
    // Get iOS app version
    const response = await axios.get('https://apps.apple.com/jp/app/paypay-%E3%83%9A%E3%82%A4%E3%83%9A%E3%82%A4/id1435783608', {
      proxy: this.proxy
    })

    const $ = cheerio.load(response.data);
    this.version = $('.l-column.small-6.medium-12.whats-new__latest__version').text().split(' ')[1];

    // Update headers with version
    this.headers['Client-Version'] = this.version;
    this.headers['User-Agent'] = `PaypayApp/${this.version} iOS16.7.5 Ktor`;

    if (accessToken) {
      this.headers['Authorization'] = `Bearer ${accessToken}`;
      this.accessToken = accessToken;
    }
  }

  async login(url: string) {
    if (!this.accessToken) throw new PayPayLoginError('まずはログインしてください');

    if (url.includes('https://')) {
      url = url.replace('https://www.paypay.ne.jp/portal/oauth2/l?id=', '');
    }

    const headers = {
      'Host': 'www.paypay.ne.jp',
      'Content-Type': 'application/json',
      'Client-App-Load-Start': this.timestamp,
      'Client-Os-Version': '16.7.5',
      'Accept': 'application/json, text/plain, */*',
      'Client-Type': 'PAYPAYAPP',
      'Client-Id': 'pay2-mobile-app-client',
      'Client-Version': this.version,
      'Accept-Language': 'ja-jp',
      'Accept-Encoding': 'gzip, deflate, br',
      'Origin': 'https://www.paypay.ne.jp',
      'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Safari jp.pay2.app.ios/${this.version}`,
      'Referer': 'https://www.paypay.ne.jp/portal/oauth2/l?id=7FXQCJ&client_id=pay2-mobile-app-client',
      'Client-Os-Type': 'IOS'
    };

    try {
      const response = await this.session.post(`https://www.paypay.ne.jp/portal/api/v2/oauth2/authorization/${url}`, {}, {
        headers: headers,
        proxy: this.proxy
      });

      if (!response.data) {
        throw new PayPayNetworkError('Network error occurred');
      }

      if (response.data.header.resultCode !== 'S0000') {
        throw new PayPayLoginError(response.data);
      }

      return response.data;
    } catch (error) {
      throw new PayPayError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getBalance() {
    if (!this.accessToken) throw new PayPayLoginError('まずはログインしてください');

    try {
      const response = await this.session.get('https://app4.paypay.ne.jp/bff/v2/getBalanceInfo', {
        headers: this.headers as any,
        params: this.params,
        proxy: this.proxy
      });

      if (!response.data) {
        throw new PayPayNetworkError('Network error occurred');
      }

      if (response.data.header.resultCode !== 'S0000') {
        throw new PayPayError(response.data);
      }

      try {
        this.money = response.data.payload.walletDetail.emoneyBalanceInfo.balance;
      } catch {
        this.money = null;
      }
      this.money_light = response.data.payload.walletDetail.prepaidBalanceInfo.balance;
      this.all_balance = response.data.payload.walletSummary.allTotalBalanceInfo.balance;
      this.useable_balance = response.data.payload.walletSummary.usableBalanceInfoWithoutCashback.balance;
      this.point = response.data.payload.walletDetail.cashBackBalanceInfo.balance;

      return response.data;
    } catch (error) {
      throw new PayPayError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getTransactions(offset = 0) {
    if (!this.accessToken) throw new PayPayLoginError('まずはログインしてください');

    try {
      const response = await this.session.get('https://app4.paypay.ne.jp/bff/v2/getPay2BalanceHistory', {
        headers: this.headers as any,
        params: {
          ...this.params,
          offset: offset,
          limit: 10
        },
        proxy: this.proxy
      });

      if (!response.data) {
        throw new PayPayNetworkError('Network error occurred');
      }

      if (response.data.header.resultCode !== 'S0000') {
        throw new PayPayError(response.data);
      }

      return response.data.payload.historyList;
    } catch (error) {
      throw new PayPayError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getPointHistory(offset = 0) {
    if (!this.accessToken) throw new PayPayLoginError('まずはログインしてください');

    try {
      const response = await this.session.get('https://app4.paypay.ne.jp/bff/v2/getPointHistory', {
        headers: this.headers as any,
        params: {
          ...this.params,
          offset: offset,
          limit: 10
        },
        proxy: this.proxy
      });

      if (!response.data) {
        throw new PayPayNetworkError('Network error occurred');
      }

      if (response.data.header.resultCode !== 'S0000') {
        throw new PayPayError(response.data);
      }

      return response.data.payload;
    } catch (error) {
      throw new PayPayError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async tokenRefresh(refreshToken: string) {
    if (!this.accessToken) throw new PayPayLoginError('まずはログインしてください');

    try {
      const response = await axios.create().post('https://app4.paypay.ne.jp/bff/v2/oauth2/refresh', {data: {
        clientId: 'pay2-mobile-app-client',
        refreshToken: refreshToken,
        tokenVersion: 'v2'
      }}, {
        headers: this.headers,
        proxy: this.proxy,
      });

      console.log(response.data);

      if (!response.data) {
        throw new PayPayNetworkError('Network error occurred');
      }

      if (response.data.header.resultCode === 'S0001' || response.data.header.resultCode === 'S1003') {
        throw new PayPayLoginError(response.data);
      }

      if (response.data.header.resultCode === 'S0003') {
        throw new PayPayLoginError(response.data);
      }

      if (response.data.header.resultCode !== 'S0000') {
        throw new PayPayError(response.data);
      }

      this.accessToken = response.data.payload.accessToken;
      this.refreshToken = response.data.payload.refreshToken;
      this.headers.Authorization = `Bearer ${response.data.payload.accessToken}`;

      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new PayPayError(JSON.stringify(error));
      }
      throw new PayPayError('Unknown error occurred');
    }
  }
}

export default PayPay;
