# Shioaji API 啟用測試工具

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
