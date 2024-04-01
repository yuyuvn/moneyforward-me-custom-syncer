import {PaypaySource} from '../../src/sources/paypay';

(async () => {
  const client = new PaypaySource({debug: true});
  const balance = await client.fetch();
  console.log(`balance: ${balance} JPY`);
})();
