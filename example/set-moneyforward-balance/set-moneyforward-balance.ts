import {BinanceSource} from '../../src/sources/binance';
import {PaypaySource} from '../../src/sources/paypay';
import {PolymarketSource} from '../../src/sources/polymarket';
import {MoneyforwardCashAccount} from '../../src/target/moneyforward';

(async () => {
  const mf = new MoneyforwardCashAccount({debug: process.env.DEBUG === 'true'});

  const binanceClient = new BinanceSource({});
  const assets = await binanceClient.fetchAll();
  await mf.updateCryptoBalance('Binance', assets);
  await mf.closePage();

  // const client2 = new PaypaySource({});
  // try {
  //   const assets2 = await client2.fetchAll();

  //   for (const asset of assets2) {
  //     if (asset.name === 'PayPay Investment Points') {
  //       await mf.updatePointsBalance('Paypay Points', asset.value);
  //     }
  //   }
  // } catch (error) {
  //   console.error('Error fetching PayPay balance:', error);
  // }
  // await mf.closePage();

  const JPYRate = await binanceClient.getUSDJPYRate();
  const client3 = new PolymarketSource({JPYRate});
  const assets3 = await client3.fetchAll();
  await mf.updateCryptoBalance('Polymarket', assets3);
  await mf.closePage();

  mf.finalize();
  console.log('Done!');
})();
