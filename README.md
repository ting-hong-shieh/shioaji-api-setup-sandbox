# Shioaji API Setup Sandbox

English | [中文](#中文)

This is a personal sandbox for validating the basic setup flow of the SinoPac Shioaji API, including environment-based authentication, account inspection, contract lookup, and simulated order placement.

It is not a trading system or a strategy repository.

It currently supports:

- Loading API credentials from environment variables
- Testing Shioaji API login
- Inspecting available accounts
- Looking up futures contracts
- Placing simulated stock orders
- Testing simulated futures orders, if a futures account is available

## Disclaimer

This project is for learning and testing purposes only.  
The order examples use simulation mode and are not intended as investment advice.

## Official Resources

To use Shioaji for trading, users need to apply for API access through SinoPac Securities, sign the API electronic trading risk disclosure, apply for an API Key, and complete the required API test. Stock and futures permissions are handled separately.

- [SinoPac Python API introduction and application process](https://ai.sinotrade.com.tw/python/Main/index.aspx)
- [Shioaji official documentation](https://sinotrade.github.io/)

## Project Structure

```text
.
├── check_accounts.py
├── check_futures_contracts.py
├── test_login.py
├── test_stock_order.py
├── test_futures_order.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Setup

Create a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```bash
cp .env.example .env
```

Then fill in your own Shioaji API credentials:

```env
SJ_API_KEY=your_api_key_here
SJ_SECRET_KEY=your_secret_key_here
```

## Usage

Test login:

```bash
python test_login.py
```

Check accounts:

```bash
python check_accounts.py
```

Check futures contracts:

```bash
python check_futures_contracts.py
```

Test simulated stock order:

```bash
python test_stock_order.py
```

Test simulated futures order:

```bash
python test_futures_order.py
```

## Notes

- `.env` is ignored by Git and should never be committed.
- `.venv` is ignored by Git.
- The stock order example uses Shioaji simulation mode.
- Futures trading requires a valid futures account and API permission.
- Being able to look up futures contracts does not necessarily mean the account can place futures orders.

---

# 中文

[English](#shioaji-api-setup-sandbox) | 中文

這是一個個人測試用 sandbox，用來驗證永豐 Shioaji API 的基本設定流程，包含環境變數登入、帳戶檢查、商品合約查詢與模擬委託。

這不是完整交易系統，也不是交易策略專案。

目前支援：

- 從環境變數讀取 API credentials
- 測試 Shioaji API 登入
- 檢查可用帳戶
- 查詢期貨商品合約
- 送出模擬股票委託單
- 若帳戶已開通期貨權限，可測試模擬期貨委託單

## 免責聲明

本專案僅供學習與測試用途。  
範例委託單皆使用模擬模式，內容不構成任何投資建議。

## 官方資源

若要使用 Shioaji 進行交易，使用者需要透過永豐金證券申請 API 權限、簽署 API 電子交易風險預告書、申請 API Key，並完成 API 測試。證券與期貨權限需要分別簽署與測試。

- [永豐金證券 Python API 介紹與申請流程](https://ai.sinotrade.com.tw/python/Main/index.aspx)
- [Shioaji 官方文件](https://sinotrade.github.io/)

## 專案結構

```text
.
├── check_accounts.py
├── check_futures_contracts.py
├── test_login.py
├── test_stock_order.py
├── test_futures_order.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## 環境設定

建立虛擬環境：

```bash
python -m venv .venv
source .venv/bin/activate
```

安裝套件：

```bash
pip install -r requirements.txt
```

建立 `.env` 檔案：

```bash
cp .env.example .env
```

接著填入你自己的 Shioaji API credentials：

```env
SJ_API_KEY=your_api_key_here
SJ_SECRET_KEY=your_secret_key_here
```

## 使用方式

測試登入：

```bash
python test_login.py
```

檢查帳戶：

```bash
python check_accounts.py
```

查詢期貨合約：

```bash
python check_futures_contracts.py
```

測試模擬股票下單：

```bash
python test_stock_order.py
```

測試模擬期貨下單：

```bash
python test_futures_order.py
```

## 注意事項

- `.env` 已被 Git 忽略，不應該被提交到 GitHub。
- `.venv` 已被 Git 忽略。
- 股票委託範例使用 Shioaji 模擬模式。
- 期貨交易需要有效的期貨帳戶與 API 權限。
- 查得到期貨合約不代表帳戶一定能下期貨單。