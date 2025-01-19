import {BinanceSource} from '../../src/sources/binance';
import {PaypaySource} from '../../src/sources/paypay';
import {PolymarketSource} from '../../src/sources/polymarket';
import {MoneyforwardCashAccount} from '../../src/target/moneyforward';

(async () => {
  const client = new BinanceSource({});
  const assets = await client.fetchAll();

  const client2 = new PaypaySource({});
  let assets2: {name: string, value: number}[] = [];
  let skipPaypay = false;
  try {
    assets2 = await client2.fetchAll();
  } catch (error) {
    console.error('Error fetching PayPay balance:', error);
    skipPaypay = true;
  }

  const JPYRate = await client.getUSDJPYRate();
  const client3 = new PolymarketSource({JPYRate});
  const assets3 = await client3.fetchAll();

  const mf = new MoneyforwardCashAccount({debug: process.env.DEBUG === 'true'});
  await mf.updateCryptoBalance('Binance', assets);
  if (!skipPaypay) {
    for (const asset of assets2) {
      if (asset.name === 'PayPay Investment Points') {
        await mf.updatePointsBalance('Paypay Points', asset.value);
      }
    }
  }
  await mf.updateCryptoBalance('Polymarket', assets3);

  mf.finalize();
  console.log('Done!');
})();
