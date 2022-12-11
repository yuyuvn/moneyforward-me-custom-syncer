import { SourceBase } from "../base";
import Binance from "node-binance-api";

const CurrencyConverter = require("currency-converter-lt");

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
      family: 0,
    });
  }

  async fetch(): Promise<number> {
    const balances = await this.binance.balance();
    const ticker = await this.binance.prices();
    const currencyConverter = new CurrencyConverter({ from: "USD", to: "JPY" });
    let walletBalanceUSD = 0;

    for (let currency in balances) {
      const balance = balances[currency];
      const available = parseFloat(balance.available);
      if (available === 0.0) {
        continue;
      }

      // TODO: not sure what is it
      if (currency === "ETHW") continue;

      currency = currency.replace(/^LD/, "");

      if (currency.match(/USD/)) {
        walletBalanceUSD += available;
      } else {
        walletBalanceUSD += parseFloat(ticker[`${currency}BUSD`]) * available;
      }
    }

    return await currencyConverter.convert(walletBalanceUSD);
  }
}
