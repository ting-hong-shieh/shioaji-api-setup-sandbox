@echo off
REM 一鍵啟動（Windows）：建立虛擬環境、安裝套件、啟動本機服務並開啟瀏覽器。
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8011

if not exist ".venv" (
  echo 建立虛擬環境...
  python -m venv .venv
)

call .venv\Scripts\activate.bat
echo 安裝／更新套件...
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r requirements.txt

echo 啟動服務：http://127.0.0.1:%PORT% （關閉此視窗即停止）
start "" "http://127.0.0.1:%PORT%"
python -m uvicorn app:app --host 127.0.0.1 --port %PORT%
