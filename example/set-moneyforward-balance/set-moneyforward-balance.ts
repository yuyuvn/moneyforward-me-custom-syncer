import {BinanceSource} from '../../src/sources/binance';
import {MoneyforwardCashAccount} from '../../src/target/moneyforward';

(async () => {
  const client = new BinanceSource({});
  const assets = await client.fetchAll();

  const mf = new MoneyforwardCashAccount({debug: false});
  await mf.updateBalance('Binance', assets);
  mf.finalize();
  console.log('Done!');
})();
