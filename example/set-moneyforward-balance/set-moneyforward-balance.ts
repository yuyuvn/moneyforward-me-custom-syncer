import {BinanceSource} from '../../src/sources/binance';
import {PaypaySource} from '../../src/sources/paypay';
import {MoneyforwardCashAccount} from '../../src/target/moneyforward';

(async () => {
  const client = new BinanceSource({});
  const assets = await client.fetchAll();

  const mf = new MoneyforwardCashAccount({debug: false});
  await mf.updateCryptoBalance('Binance', assets);

  // const client2 = new PaypaySource({});
  // const balance = await client2.fetch();
  // await mf.updatePayBalance('Paypay', balance);

  mf.finalize();
  console.log('Done!');
})();
