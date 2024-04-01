import {BinanceSource} from '../../src/sources/binance';
import {MoneyforwardCashAccount} from '../../src/target/moneyforward';

(async () => {
  const client = new BinanceSource({});
  const assets = await client.fetchAll();

  const mf = new MoneyforwardCashAccount({debug: false});
  await mf.updateCryptoBalance('Binance', 'crypto', assets);


  const client2 = new PaypaySource({});
  const balance = await client.fetch();
  const balance = 109080;
  await mf.updatePayBalance('Paypay', balance);

  mf.finalize();
  console.log('Done!');
})();
