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

# 商品：永豐金 2890
contract = api.Contracts.Stocks.TSE.TSE2890

# 證券委託單
order = sj.StockOrder(
    action=sj.Action.Buy,                    # 買進
    price=28,                                # 測試價格
    quantity=1,                              # 1 張
    price_type=sj.StockPriceType.LMT,        # 限價
    order_type=sj.OrderType.ROD,             # 當日有效
    order_lot=sj.StockOrderLot.Common,       # 整股
    order_cond=sj.StockOrderCond.Cash,       # 現股
    account=api.stock_account                # 證券帳號
)

# 官方提醒：下單測試間隔至少 1 秒
time.sleep(1)

trade = api.place_order(contract, order)
Í
print("下單回傳：")
print(trade)

print("委託狀態：")
print(trade.status.status)
print("狀態碼：")
print(trade.status.status_code)

api.logout()