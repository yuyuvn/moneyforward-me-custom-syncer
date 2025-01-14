import sys
from PayPaython_mobile import PayPay

paypay=PayPay(os.getenv('PAYPAY_PHONE'),os.getenv('PAYPAY_PASSWORD'),os.getenv('PAYPAY_DEVICE_UUID'),os.getenv('PAYPAY_CLIENT_UUID'))
print(f"export PAYPAY_ACCESS_TOKEN={paypay.access_token}")#アクセストークンは2ヶ月と28日有効
print(f"export PAYPAY_REFRESH_TOKEN={paypay.refresh_token}")
#URLを入力する必要はない
