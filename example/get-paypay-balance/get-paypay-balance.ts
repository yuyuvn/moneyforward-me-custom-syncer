import {PaypaySource} from '../../src/sources/paypay';

(async () => {
  const client = new PaypaySource({});
  const balance = await client.fetchAll();
  console.log('PayPay Balance Details:', JSON.stringify(balance));
})();
