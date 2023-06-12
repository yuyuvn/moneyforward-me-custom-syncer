import {SourceBase, Asset} from '../base';
import Binance from 'node-binance-api';

const CurrencyConverter = require('currency-converter-lt');

/**
 * Config for binance source
 *
 * @interface BinanceSourceConfig
 */
export interface BinanceSourceConfig {
  apiKey?: string;
  secretKey?: string;
}

export class BinanceSource extends SourceBase<BinanceSourceConfig> {
  private binance: Binance;

  constructor(config: BinanceSourceConfig) {
    super(config);
    this.binance = new Binance().options({
      APIKEY: config.apiKey || process.env.BINANCE_API_KEY,
      APISECRET: config.secretKey || process.env.BINANCE_SECRET_KEY,
      useServerTime: true,
      family: 4,
    });
  }

  async fetch(): Promise<number> {
    const balances = await this.binance.balance();
    const ticker = await this.binance.prices();
    const currencyConverter = new CurrencyConverter({from: 'USD', to: 'JPY'});
    let walletBalanceUSD = 0;

    console.log(JSON.stringify(balances));
    for (let currency in balances) {
      const balance = balances[currency];
      const available =
        parseFloat(balance.available) + parseFloat(balance.onOrder);
      if (available === 0.0) {
        continue;
      }

      // it's worthless
      if (currency === 'ETHW') continue;

      currency = currency.replace(/^LD/, '');

      if (currency.match(/USD/)) {
        walletBalanceUSD += available;
      } else {
        walletBalanceUSD += parseFloat(ticker[`${currency}BUSD`]) * available;
      }
    }

    return await currencyConverter.convert(walletBalanceUSD);
  }

  async fetchAll(): Promise<Asset[]> {
    const assetsHash: {[index: string]: Asset} = {};
    try {
      const balances = await this.binance.balance();
      const ticker = await this.binance.prices();
      const currencyConverter = new CurrencyConverter({from: 'USD', to: 'JPY'});
      const UsdJpyRate: number = await currencyConverter.convert(1.0);

      for (let currency in balances) {
        const balance = balances[currency];
        const available =
          parseFloat(balance.available) + parseFloat(balance.onOrder);
        if (available === 0.0) {
          continue;
        }

        // it's worthless
        if (currency === 'ETHW') continue;

        currency = currency.replace(/^LD/, '');

        const asset = assetsHash[currency] || {name: currency, value: 0.0};
        if (currency.match(/USD/)) {
          asset.value = available * UsdJpyRate + asset.value;
        } else {
          asset.value =
            parseFloat(ticker[`${currency}BUSD`]) * available * UsdJpyRate +
            asset.value;
        }
        assetsHash[currency] = asset;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }

    return Object.values(assetsHash);
  }
}
