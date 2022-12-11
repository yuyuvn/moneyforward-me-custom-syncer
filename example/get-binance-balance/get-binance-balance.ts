import { BinanceSource } from "../../src/sources/binance";

(async () => {
  const client = new BinanceSource({});
  const balance = await client.fetch();
  console.log(`balance: ${balance} JPY`);
})();
