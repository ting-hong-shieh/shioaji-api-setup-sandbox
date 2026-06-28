import os
import time
import shioaji as sj
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("SJ_API_KEY")
secret_key = os.getenv("SJ_SECRET_KEY")

if not api_key or not secret_key:
    raise ValueError("請確認 .env 裡面有 SJ_API_KEY 和 SJ_SECRET_KEY")

# 模擬模式，不是真實下單
api = sj.Shioaji(simulation=True)

accounts = api.login(
    api_key=api_key,
    secret_key=secret_key,
)

print("登入成功")
print(accounts)

print("期貨帳號：")
print(api.futopt_account)

# 商品檔：台指期近月範例
# 如果 TXFE6 不存在，下面我再教你怎麼查可用商品
contract = api.Contracts.Futures.TXF.TXFR1

order = sj.FuturesOrder(
    action=sj.Action.Buy,                    # 買進
    price=37000,                             # 測試價格
    quantity=1,                              # 1 口
    price_type=sj.FuturesPriceType.LMT,      # 限價
    order_type=sj.OrderType.ROD,             # 當日有效
    octype=sj.FuturesOCType.Auto,            # 自動新平倉
    account=api.futopt_account               # 期貨帳號
)

# 官方提醒：下單測試間隔至少 1 秒
time.sleep(1)

trade = api.place_order(contract, order)

print("下單回傳：")
print(trade)

print("委託狀態：")
print(trade.status.status)

print("狀態碼：")
print(trade.status.status_code)

api.logout()