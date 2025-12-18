import {SourceBase, Asset} from '../base';
import {ethers} from 'ethers';
import {ClobClient, ApiKeyCreds} from '@polymarket/clob-client';

const POLYMARKET_HOST = "https://clob.polymarket.com";
const CHAIN_ID = 137; // Polygon Mainnet chain ID
let debugCount = 0;

/**
 * Config for binance source
 *
 * @interface PolymarketSourceConfig
 */
export interface PolymarketSourceConfig {
  polygonAddress?: string;
  polyscanApiKey?: string;
  JPYRate?: number;
}

export class PolymarketSource extends SourceBase<PolymarketSourceConfig> {
  public config: PolymarketSourceConfig;
  private tokenAddress: string = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'; // USDC

  constructor(config: PolymarketSourceConfig) {
    super(config);
    this.config = {
        polygonAddress: process.env.POLYGON_ADDRESS,
        polyscanApiKey: process.env.POLYSCAN_API_KEY,
        JPYRate: 150,
        ...config,
      };
  }

  async fetch(): Promise<number> {
    const cash = await this.fetchCash();
    const position = await this.fetchPositionBalance();

    return cash + position;
  }

  async fetchAll(): Promise<Asset[]> {
    const cash = await this.fetchCash();
    const position = await this.fetchPositionBalance();

    return [
      {
        name: 'Cash',
        value: cash,
      },
      {
        name: 'Position',
        value: position,
      },
    ];
  }

  async fetchCash(): Promise<number> {
    // Use Etherscan V2 API for multichain support (Polygon chainId: 137)
    const url = `https://api.etherscan.io/v2/api?chainid=137&module=account&action=tokenbalance&contractaddress=${this.tokenAddress}&address=${this.config.polygonAddress}&tag=latest&apikey=${this.config.polyscanApiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    // Etherscan V2 returns balances as strings, decimals depend on token (USDC: 6)
    if (data.status === "1" && data.result) {
      return parseFloat(data.result) / 10 ** 6 * this.config.JPYRate!;
    } else {
      throw new Error(data.message || "Failed to fetch token balance");
    }
  }

  async fetchPositionBalance(): Promise<number> {
    const url = `https://data-api.polymarket.com/value?user=${this.config.polygonAddress}`;
    const response = await fetch(url);
    const json = await response.json();

    // Expected shape: [{ user: string, value: number }]
    if (
      Array.isArray(json) &&
      json.length > 0 &&
      json[0] &&
      typeof json[0].value === "number"
    ) {
      const usdValue = json[0].value;
      return usdValue * this.config.JPYRate!;
    }

    throw new Error("Failed to fetch Polymarket position value");
  }
}

                                     