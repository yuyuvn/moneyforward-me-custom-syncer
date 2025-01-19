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
  polymarketPrivateKey?: string;
  polymarketApiKey?: string;
  polymarketApiSecret?: string;
  polymarketApiPassphrase?: string;
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
        polymarketPrivateKey: process.env.POLYMARKET_PRIVATE_KEY,
        polymarketApiKey: process.env.POLYMARKET_API_KEY,
        polymarketApiSecret: process.env.POLYMARKET_API_SECRET,
        polymarketApiPassphrase: process.env.POLYMARKET_API_PASSPHRASE,
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
    const response = await fetch(`https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=${this.tokenAddress}&address=${this.config.polygonAddress}&tag=latest&apikey=${this.config.polyscanApiKey}`);
    const data = await response.json();

    if (data.status == 1) {
        return parseFloat(data.result) / 10 ** 6 * this.config.JPYRate!;
    } else {
        throw new Error(data);
    }
  }

  async fetchPositionBalance(): Promise<number> {
    const provider = ethers.getDefaultProvider('matic');
    const signer = new ethers.Wallet(this.config.polymarketPrivateKey || '', provider);
    const creds: ApiKeyCreds = {
        key: this.config.polymarketApiKey || '',
        secret: this.config.polymarketApiSecret || '',
        passphrase: this.config.polymarketApiPassphrase || '',
    };

    const clobClient = new ClobClient(POLYMARKET_HOST, CHAIN_ID, signer, creds);
    const positions: { [maker_address: string]: { [outcome: string]: number } } = {};
    const markets: { [maker_address: string]: {closed: boolean, tokens: {price: number, outcome: string}[]} } = {};

    // Fetch user positions
    const threeMonthsAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60);
    const trades = await clobClient.getTrades({after: threeMonthsAgo.toString()});
    for (const fill of trades) {
        // if (fill.status != 'CONFIRMED') {
        //     continue;
        // }

        const { market, outcome, size, price, side } = fill;

        if (!markets[market]) {
            try {
                markets[market] = await clobClient.getMarket(market);
            } catch (error) {
                markets[market] = {
                    closed: true,
                    tokens: [],
                };
            }
        }
        if (markets[market].closed) {
            continue;
        }

        const signedSize = side === "BUY" ? size : -size;

        if (!positions[market]) {
            positions[market] = {};
        }
    
        positions[market][outcome] = Number(positions[market][outcome] || 0) + Number(signedSize);
    }

    // Fetch market prices and calculate total value
    let totalValue = 0;
    for (const [marketId, outcomes] of Object.entries(positions)) {
      const market = markets[marketId];

      for (const [outcomeId, balance] of Object.entries(outcomes)) {
        const abcBalance = Math.abs(balance);
        if (abcBalance < 0.1) {
            continue;
        }
        const price = market.tokens.find(t => t.outcome === outcomeId)?.price || 0;
        const value = abcBalance * price;
        totalValue += value;
      }
    }

    return totalValue * this.config.JPYRate!;
  }
}

                                     