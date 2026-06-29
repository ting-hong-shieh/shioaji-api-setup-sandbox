# Shioaji API 啟用測試工具

中文 | [English](#english)

這是一個跑在使用者自己電腦上的 Shioaji API 啟用檢查器。它把登入、帳戶權限、股票模擬委託、期貨模擬委託整理成一個瀏覽器介面，讓正在申請或驗證永豐金 Shioaji API 的使用者，不必自己打指令或拆讀 Python 範例，就能知道目前卡在哪一步。

這不是永豐官方專案，也不是交易系統、交易策略或代操工具。所有委託檢查都固定使用 `simulation=true` 模擬模式，不會送出真實交易。

## 這個工具想解決什麼

申請 Shioaji API 時，使用者常遇到的痛點不是「怎麼寫交易策略」，而是更前面的幾件事：

- API Key / Secret Key 到底能不能登入。
- 證券帳戶和期貨帳戶是否都已經開通 API 權限。
- 能查到商品合約，是否也代表可以送出模擬委託。
- 測試結果要怎麼整理成一段可複製的摘要，方便回報給客服、同事或自己留存。

這個專案的角色，就是把上述流程收斂成一次「開始檢查」。

## 使用者最後會怎麼操作

使用者不是連到某個雲端網站輸入金鑰，而是把這個 GitHub 專案下載到自己的電腦，在本機啟動一個小型網頁服務。

建議流程：

1. 到 GitHub 專案頁點 `Code` -> `Download ZIP`，或用 `git clone` 下載。
2. 解壓縮後打開資料夾。
3. macOS 連點 `start.command`；Windows 連點 `start.bat`。
4. 瀏覽器會開啟 `http://127.0.0.1:8011`。
5. 貼上 API Key / Secret Key，按「開始檢查」。
6. 查看登入、帳戶權限、股票與期貨模擬委託結果，必要時複製摘要。

之所以採用本機執行，是因為 API Key 和 Secret Key 不應該送到不明的外部伺服器。這個工具只接受 `127.0.0.1` / `localhost` 連線，前端資源也放在專案內，不依賴 CDN。

## 快速開始

### macOS

在 Finder 連點兩下：

```text
start.command
```

第一次執行若被 macOS 擋下，請在檔案上按右鍵，選「打開」。

如果仍然無法開啟，請用下面的 Terminal 指令解除下載檔案的安全標記後再啟動：

```bash
cd ~/Downloads/shioaji-api-setup-sandbox-main
xattr -dr com.apple.quarantine .
chmod +x start.command
./start.command
```

如果你的資料夾不在 `~/Downloads/shioaji-api-setup-sandbox-main`，請先把 `cd` 後面的路徑換成你實際解壓縮的位置。

### Windows

連點兩下：

```text
start.bat
```

啟動腳本會自動建立 `.venv`、安裝 Python 套件、啟動本機服務，並開啟瀏覽器。

## 手動啟動

如果你偏好命令列：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8011
```

Windows 啟用虛擬環境的指令是：

```bat
.venv\Scripts\activate
```

接著開啟：

```text
http://127.0.0.1:8011
```

## macOS 被擋怎麼辦

從 GitHub 下載 ZIP 後，macOS 可能會把 `start.command` 標記為「來自網路下載的檔案」，因此第一次雙擊時會被 Gatekeeper 擋下。這是 macOS 的安全機制，不代表工具壞掉。

建議依序嘗試：

1. 在 Finder 對 `start.command` 按右鍵，選「打開」，再按一次「打開」確認。
2. 若還是被擋，打開 Terminal，進到專案資料夾後執行：

```bash
xattr -dr com.apple.quarantine .
chmod +x start.command
./start.command
```

這只會移除這個下載資料夾的 quarantine 標記，讓 macOS 允許你執行本機啟動腳本。

## 檢查項目

- Shioaji API 登入。
- 證券帳戶權限。
- 期貨帳戶權限。
- 股票模擬委託：永豐金 `TSE2890`，限價買進 1 張。
- 期貨模擬委託：自動挑選可用的 TXF 台指期合約，限價買進 1 口。
- 可複製的文字摘要與完整回傳資料。

如果帳戶尚未開通某一類權限，該項委託會標示為「未執行」，不會中斷整份報告。

## 安全設計

- 固定以 `simulation=true` 建立 Shioaji 連線。
- Web 服務只接受本機 loopback 連線。
- 頁面資源使用本地檔案，不向 CDN 載入 three.js 或字型。
- `.env`、`.venv`、`shioaji.log` 已加入 `.gitignore`。
- 前端不會把金鑰存入瀏覽器儲存空間；金鑰只在按下檢查時送到本機服務使用。

## 專案結構

```text
.
├── app.py                  # FastAPI 本機服務與 loopback 防護
├── shioaji_tester.py       # Shioaji 登入、帳戶與模擬委託檢查邏輯
├── templates/index.html    # 單頁介面
├── static/app.css          # Liquid glass / aurora 介面樣式
├── static/app.js           # 檢查流程、報告渲染與互動背景
├── static/vendor/three.min.js
├── start.command           # macOS 一鍵啟動
├── start.bat               # Windows 一鍵啟動
├── requirements.txt
└── README.md
```

## 需求

- Python 3.9 或更新版本。
- 已向永豐金證券申請 Shioaji API Key / Secret Key。
- 若要檢查期貨模擬委託，需要期貨帳戶與對應 API 權限。

實際申請條件、風險預告書簽署與測試規則，請以永豐官方說明為準。

## 官方資源

- 永豐 Python API 介紹與申請流程：<https://ai.sinotrade.com.tw/python/Main/index.aspx>
- Shioaji 官方文件：<https://sinotrade.github.io/>

## 免責聲明

本專案僅供學習、申請流程檢查與本機驗證用途。測試標的、價格與委託內容只是用來確認 API 權限與模擬委託流程，不構成任何投資建議。

---

# English

[中文](#shioaji-api-啟用測試工具) | English

This is a local Shioaji API activation checker that runs on the user's own computer. It turns login validation, account permission checks, simulated stock orders, and simulated futures orders into a browser-based workflow, so users who are applying for or verifying SinoPac Shioaji API access can see where they are blocked without running several Python scripts by hand.

This is not an official SinoPac project, a trading system, a trading strategy, or a managed trading tool. All order checks are locked to `simulation=true`, so the app does not place real trades.

## What This Tool Solves

When users apply for Shioaji API access, the immediate pain point is usually not strategy development. It is the setup and verification process:

- Whether the API Key / Secret Key can log in successfully.
- Whether stock and futures API permissions are both enabled.
- Whether being able to query contracts also means simulated orders can be submitted.
- How to turn the test result into a copyable summary for support, teammates, or personal records.

This project compresses that flow into one "Start Check" action.

## How Users Run It

Users should not enter API credentials into an unknown cloud website. Instead, they download this GitHub project and run a small local web service on their own computer.

Recommended flow:

1. On the GitHub project page, click `Code` -> `Download ZIP`, or download it with `git clone`.
2. Unzip the project and open the folder.
3. On macOS, double-click `start.command`; on Windows, double-click `start.bat`.
4. The browser opens `http://127.0.0.1:8011`.
5. Paste the API Key / Secret Key and click "開始檢查".
6. Review the login, account permission, simulated stock order, and simulated futures order results. Copy the summary if needed.

The app is designed this way because API Key and Secret Key values should stay on the user's own machine. The web service only accepts `127.0.0.1` / `localhost` connections, and frontend assets are bundled locally instead of loaded from a CDN.

## Quick Start

### macOS

Double-click this file in Finder:

```text
start.command
```

If macOS blocks the first launch, right-click the file and choose "Open".

If it is still blocked, remove the download quarantine flag from the extracted folder and launch it from Terminal:

```bash
cd ~/Downloads/shioaji-api-setup-sandbox-main
xattr -dr com.apple.quarantine .
chmod +x start.command
./start.command
```

If your folder is not located at `~/Downloads/shioaji-api-setup-sandbox-main`, replace the `cd` path with the actual extracted project path.

### Windows

Double-click:

```text
start.bat
```

The launcher creates `.venv`, installs Python dependencies, starts the local service, and opens the browser.

## Manual Start

If you prefer the command line:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8011
```

On Windows, activate the virtual environment with:

```bat
.venv\Scripts\activate
```

Then open:

```text
http://127.0.0.1:8011
```

## macOS Gatekeeper Troubleshooting

When the project is downloaded as a GitHub ZIP file, macOS may mark `start.command` as a file downloaded from the internet and block it on the first launch. This is Gatekeeper protection; it does not mean the app is broken.

Try these steps in order:

1. In Finder, right-click `start.command`, choose "Open", then confirm "Open" again.
2. If it is still blocked, open Terminal, enter the project folder, and run:

```bash
xattr -dr com.apple.quarantine .
chmod +x start.command
./start.command
```

This only removes the quarantine flag from this downloaded project folder so macOS can run the local launcher script.

## Checks

- Shioaji API login.
- Stock account permission.
- Futures account permission.
- Simulated stock order: SinoPac Holdings `TSE2890`, limit buy, 1 board lot.
- Simulated futures order: automatically selects an available TXF contract, limit buy, 1 contract.
- Copyable text summary and full raw response.

If an account permission is not enabled, the related order check is marked as skipped instead of stopping the whole report.

## Safety Design

- Shioaji is always initialized with `simulation=true`.
- The web service only accepts local loopback connections.
- Page assets are served from local files; three.js and fonts are not loaded from a CDN.
- `.env`, `.venv`, and `shioaji.log` are ignored by Git.
- The frontend does not store credentials in browser storage. Credentials are sent only to the local service when the user starts a check.

## Project Structure

```text
.
├── app.py                  # FastAPI local service and loopback guard
├── shioaji_tester.py       # Shioaji login, account, and simulated order checks
├── templates/index.html    # Single-page UI
├── static/app.css          # Liquid glass / aurora interface styles
├── static/app.js           # Check flow, report rendering, and interactive background
├── static/vendor/three.min.js
├── start.command           # macOS one-click launcher
├── start.bat               # Windows one-click launcher
├── requirements.txt
└── README.md
```

## Requirements

- Python 3.9 or newer.
- A Shioaji API Key / Secret Key issued through SinoPac Securities.
- A futures account and matching API permission are required for the futures simulated order check.

Actual application requirements, risk disclosure signing, and testing rules should always follow SinoPac's official instructions.

## Official Resources

- SinoPac Python API introduction and application flow: <https://ai.sinotrade.com.tw/python/Main/index.aspx>
- Shioaji official documentation: <https://sinotrade.github.io/>

## Disclaimer

This project is for learning, application-flow checks, and local verification only. The sample symbols, prices, and orders are used only to verify API permissions and simulated order flow. They are not investment advice.
