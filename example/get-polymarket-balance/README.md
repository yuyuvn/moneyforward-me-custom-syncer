# get-polymarket-balance

Grab an api key from [PolygonScan](https://polygonscan.com/myapikey)

Get your polygon address from [Polymarket](https://polymarket.com/profile)

```bash
export POLYSCAN_API_KEY=your_api_key
export POLYGON_ADDRESS=your_polygon_address
```

run python to generate api
```bash
cd src/sources/polymarket
pip3 install -r requirements.txt
python3 generate_api.py
```

```bash
npm run compile > /dev/null && node dist/example/get-polymarket-balance/get-polymarket-balance.js
```
