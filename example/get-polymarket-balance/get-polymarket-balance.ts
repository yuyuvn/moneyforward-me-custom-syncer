import {PolymarketSource} from '../../src/sources/polymarket';

(async () => {
  const client = new PolymarketSource({});
  const balance = await client.fetchAll();
  console.log('Polymarket Balance Details:', JSON.stringify(balance));
})();
