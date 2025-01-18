import {BinanceSource} from '../../src/sources/binance';

(async () => {
  const client = new BinanceSource({});
  const assets = await client.fetchAll();
  console.log('Assets:');
  for (const asset of assets) {
    console.log(`${asset.name}: ¥${Math.round(asset.value).toLocaleString()}`);
  }
})();
