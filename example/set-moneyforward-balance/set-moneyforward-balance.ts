import {BinanceSource} from '../../src/sources/binance';
import {PaypaySource} from '../../src/sources/paypay';
import {MoneyforwardCashAccount} from '../../src/target/moneyforward';

(async () => {
  const client = new BinanceSource({});
  const assets = await client.fetchAll();

  const mf = new MoneyforwardCashAccount({debug: false});
  await mf.updateCryptoBalance('Binance', assets);

  const client2 = new PaypaySource({});
  const assets2 = await client2.fetchAll();
  await mf.updateCryptoBalance('Paypay', assets2);

  mf.finalize();
  console.log('Done!');
})();
