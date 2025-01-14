import sys
from PayPaython_mobile import PayPay

paypay=PayPay(access_token=sys.argv[1])
#ログインをスキップ

paypay.token_refresh(sys.argv[2])#アクセストークンは90日経つと失効するので失効したらリフレッシュしよう

paypay.get_balance()#これも引数なし、PayPay残高を取得する
print(paypay.all_balance)#すべての残高
print(paypay.useable_balance)#すべての使用可能な残高
print(paypay.money_light)#もってるマネーライト
print(paypay.money)#もってるマネー
print(paypay.point)#もってるポイント

# print(paypay.get_history(size=20))#支出入の履歴を取得する、size=どれだけ履歴を取得するか、デフォルトは20だったけど少なくもできる
# print(paypay.get_chat_rooms(size=20))#PayPayのDMリストを取得する
# # print(paypay.get_chat_room_messages(chat_room_id="sendbird_group_channel_なんとか_なんとか"))#グループIDのDMを取得する sendbird_group_channel_ はなくてもOK
points = paypay.get_point_history()['payload']['pointDetails']['investmentAssets']['valuationAmount']
print(points)#ポイントの履歴を取得する
