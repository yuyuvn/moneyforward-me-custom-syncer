import {SourceBase, Asset} from '../base';
import PayPay from './paypaymobile';

/**
 * Config for Paypay source
 *
 * @interface PaypaySourceConfig
 */
export interface PaypaySourceConfig {
  accessToken?: string;
  refreshToken?: string;
}

export class PaypaySource extends SourceBase<PaypaySourceConfig> {
  public config: PaypaySourceConfig;

  constructor(config: PaypaySourceConfig) {
    super(config);
    this.config = {
      accessToken: process.env.PAYPAY_ACCESS_TOKEN || '',
      refreshToken: process.env.PAYPAY_REFRESH_TOKEN || '',
      ...config,
    }
  }

  async fetch(): Promise<number> {
    const paypay = new PayPay();
    await paypay.init(this.config.accessToken!);

    await paypay.tokenRefresh(this.config.refreshToken!);
    await paypay.getBalance();
    return paypay.all_balance || 0;
  }

  async fetchAll(): Promise<Asset[]> {
    // const paypay = new PayPay();
    // await paypay.init(this.config.accessToken!);

    // await paypay.tokenRefresh(this.config.refreshToken!);
    // await paypay.getBalance();
    // const test = await paypay.getPointHistory();
    // console.log('Point History:', JSON.stringify(test));

    let allBalance: number = 0;
    let useableBalance: number = 0;
    let moneyLight: number = 0;
    let money: number = 0;
    let point: number = 0;
    let investmentPoints: number = 0;
    const { execSync } = require('child_process');
    try {
      const output = execSync(`python3 ./src/sources/paypay/paypay.py "${this.config.accessToken}" "${this.config.refreshToken}"`).toString();
      [allBalance, useableBalance, moneyLight, money, point, investmentPoints] = output.split('\n').map(Number);
    } catch (error) {
      console.error('Error executing Python script:', error);
    }

    return [
      {value: money || 0, name: 'PayPay Money'},
      {value: moneyLight || 0, name: 'PayPay Money Light'},
      {value: point || 0, name: 'PayPay Point'},
      {value: investmentPoints || 0, name: 'PayPay Investment Points'},
    ]
  }
}
