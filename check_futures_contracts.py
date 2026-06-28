import os
import shioaji as sj
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("SJ_API_KEY")
secret_key = os.getenv("SJ_SECRET_KEY")

api = sj.Shioaji(simulation=True)

api.login(
    api_key=api_key,
    secret_key=secret_key,
)

print("可用的 TXF contracts：")
print(api.Contracts.Futures.TXF)

api.logout()