## get-paypay-balance

Require python 3.6 or later.

### Write nessesary information to .env
```bash
export PAYPAY_PHONE=080-1234-5678
export PAYPAY_PASSWORD=password
```

### Install dependencies
```bash
cd src/sources/paypay
pip3 install -r requirements.txt
```

### Login
New login:
```bash
python3 src/sources/paypay/paypay_login.py
```
Then add output to .env and run `source .env`

If already logged in and token is expired:
```bash
python3 src/sources/paypay/paypay_extend.py >> .env
source .env
```

### Run
```bash
npm run compile > /dev/null && node dist/example/get-paypay-balance/get-paypay-balance.js
```

Note: If you don't use python3, you need to add alias to python3.
```bash
alias python3='python'
```

Source code copied from [PayPaython-mobile](https://github.com/paypay/PayPaython-mobile).
If he fix endpoint for point history, we can remove source code and just use pip install to use it.
