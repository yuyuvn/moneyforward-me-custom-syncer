declare module 'node-binance-api' {
  type BinanceBalances = Record<string, {available: string; onOrder: string}>;
  type BinancePrices = Record<string, number>;

  export interface BinanceOptions {
    APIKEY?: string;
    APISECRET?: string;
    useServerTime?: boolean;
    family?: number;
  }

  export default class Binance {
    options(options: BinanceOptions): Binance;
    useServerTime(): Promise<void>;
    balance(): Promise<BinanceBalances>;
    prices(): Promise<BinancePrices>;
    signedRequest(
      url: string,
      data: Record<string, unknown>,
      method: string,
      callback?: (error: unknown, response: unknown) => void
    ): Promise<any>;
  }
}
