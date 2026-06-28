#!/bin/bash
# 一鍵啟動（macOS）：建立虛擬環境、安裝套件、啟動本機服務並開啟瀏覽器。
cd "$(dirname "$0")" || exit 1
PORT=8011

if [ ! -d ".venv" ]; then
  echo "建立虛擬環境..."
  python3 -m venv .venv
fi

source .venv/bin/activate
echo "安裝／更新套件..."
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r requirements.txt

echo "啟動服務：http://127.0.0.1:$PORT （關閉此視窗即停止）"
( sleep 2; open "http://127.0.0.1:$PORT" ) &
exec python -m uvicorn app:app --host 127.0.0.1 --port "$PORT"
