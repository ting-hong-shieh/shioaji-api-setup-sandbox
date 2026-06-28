import os
import shioaji as sj
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("SJ_API_KEY")
secret_key = os.getenv("SJ_SECRET_KEY")

if not api_key or not secret_key:
    raise ValueError("請確認 .env 裡面有 SJ_API_KEY 和 SJ_SECRET_KEY")

api = sj.Shioaji(simulation=True)

accounts = api.login(
    api_key=api_key,
    secret_key=secret_key,
)

print("登入成功")
print(accounts)

api.logout()