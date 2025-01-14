import sys
from PayPaython_mobile import PayPay

paypay=PayPay(os.getenv('PAYPAY_PHONE'), os.getenv('PAYPAY_PASSWORD'))
url=input("Received ID: ")#URLと書いてあるけどIDだけでもOK
paypay.login(url)#URLなら https://www.paypay.ne.jp/portal/oauth2/l?id=TK4602 をそのままいれる、IDをいれるなら id=の横、TK4602
print(f"export PAYPAY_DEVICE_UUID={paypay.device_uuid}")#デバイスUUIDで登録デバイスを管理してるぽい
print(f"export PAYPAY_CLIENT_UUID={paypay.client_uuid}")#クライアントUUIDは特に必要ない
print(f"export PAYPAY_ACCESS_TOKEN={paypay.access_token}")#アクセストークンは2ヶ月と28日有効
print(f"export PAYPAY_REFRESH_TOKEN={paypay.refresh_token}")
