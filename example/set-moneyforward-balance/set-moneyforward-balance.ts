import {BinanceSource} from '../../src/sources/binance';
import {PaypaySource} from '../../src/sources/paypay';
import {MoneyforwardCashAccount} from '../../src/target/moneyforward';

(async () => {
  const client = new BinanceSource({});
  const assets = await client.fetchAll();

  const client2 = new PaypaySource({});
  const assets2 = await client2.fetchAll();

  const mf = new MoneyforwardCashAccount({debug: true});
  await mf.updateCryptoBalance('Binance', assets);
  for (const asset of assets2) {
    if (asset.name === 'PayPay Investment Points') {
      await mf.updatePointsBalance('Paypay', asset.value);
    }
  }

  mf.finalize();
  console.log('Done!');
})();
