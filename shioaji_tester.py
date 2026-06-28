from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

import shioaji as sj


class ShioajiTestError(Exception):
    """Raised when a Shioaji API test cannot be completed."""


@dataclass(frozen=True)
class Credentials:
    api_key: str
    secret_key: str

    def validate(self) -> None:
        if not self.api_key.strip() or not self.secret_key.strip():
            raise ShioajiTestError("請輸入 API Key 和 Secret Key。")


def test_login(credentials: Credentials, *, simulation: bool = True) -> dict[str, Any]:
    return _with_login(credentials, simulation=simulation, action=_account_payload)


def run_full_check(credentials: Credentials, *, simulation: bool = True) -> dict[str, Any]:
    def action(api: sj.Shioaji, accounts: Any) -> dict[str, Any]:
        payload = _account_payload(api, accounts)
        steps = [
            _step("登入", "passed", "API Key / Secret Key 可正常登入。"),
            _step(
                "證券帳戶權限",
                "passed" if api.stock_account is not None else "skipped",
                "已取得證券帳戶。" if api.stock_account is not None else "尚未取得證券帳戶權限。",
                payload.get("stock_account"),
            ),
            _step(
                "期貨帳戶權限",
                "passed" if api.futopt_account is not None else "skipped",
                "已取得期貨帳戶。" if api.futopt_account is not None else "尚未取得期貨帳戶權限。",
                payload.get("futures_account"),
            ),
        ]

        if api.stock_account is None:
            stock_order = None
            steps.append(_step("股票模擬委託", "skipped", "因尚未取得證券帳戶權限，未執行。"))
        else:
            try:
                stock_order = _place_stock_order(api)
                steps.append(_step("股票模擬委託", "passed", "已送出股票模擬委託。"))
            except ShioajiTestError as exc:
                stock_order = None
                steps.append(_step("股票模擬委託", "failed", str(exc)))

        if api.futopt_account is None:
            futures_order = None
            steps.append(_step("期貨模擬委託", "skipped", "因尚未取得期貨帳戶權限，未執行。"))
        else:
            try:
                futures_order = _place_futures_order(api)
                steps.append(_step("期貨模擬委託", "passed", "已送出期貨模擬委託。"))
            except ShioajiTestError as exc:
                futures_order = None
                steps.append(_step("期貨模擬委託", "failed", str(exc)))

        return {
            **payload,
            "steps": steps,
            "orders": {
                "stock": stock_order,
                "futures": futures_order,
            },
            "summary": _summary_lines(steps),
        }

    return _with_login(credentials, simulation=simulation, action=action)


def test_stock_order(credentials: Credentials, *, simulation: bool = True) -> dict[str, Any]:
    def action(api: sj.Shioaji, accounts: Any) -> dict[str, Any]:
        if api.stock_account is None:
            raise ShioajiTestError("此 API 尚未取得證券帳戶權限。")

        return {
            **_account_payload(api, accounts),
            "order": _place_stock_order(api),
        }

    return _with_login(credentials, simulation=simulation, action=action)


def test_futures_order(credentials: Credentials, *, simulation: bool = True) -> dict[str, Any]:
    def action(api: sj.Shioaji, accounts: Any) -> dict[str, Any]:
        if api.futopt_account is None:
            raise ShioajiTestError("此 API 尚未取得期貨帳戶權限。")

        return {
            **_account_payload(api, accounts),
            "order": _place_futures_order(api),
        }

    return _with_login(credentials, simulation=simulation, action=action)


def _with_login(
    credentials: Credentials,
    *,
    simulation: bool,
    action: Any,
) -> dict[str, Any]:
    credentials.validate()

    api = sj.Shioaji(simulation=simulation)
    try:
        try:
            accounts = api.login(
                api_key=credentials.api_key.strip(),
                secret_key=credentials.secret_key.strip(),
            )
        except Exception as exc:
            raise _step_error("登入", exc) from exc

        return action(api, accounts)
    except ShioajiTestError:
        raise
    except Exception as exc:
        raise ShioajiTestError(str(exc) or exc.__class__.__name__) from exc
    finally:
        try:
            api.logout()
        except Exception:
            pass


def _account_payload(api: sj.Shioaji, accounts: Any) -> dict[str, Any]:
    return {
        "accounts": _safe_text(accounts),
        "stock_account": _safe_text(api.stock_account),
        "futures_account": _safe_text(api.futopt_account),
    }


def _place_stock_order(api: sj.Shioaji) -> dict[str, Any]:
    try:
        contract = api.Contracts.Stocks.TSE.TSE2890
    except Exception as exc:
        raise _step_error("取得股票合約", exc) from exc

    order_request = {
        "商品類型": "上市股票",
        "測試標的": "永豐金 2890",
        "合約代碼": "TSE2890",
        "買賣方向": "買進",
        "委託價格": "28",
        "委託數量": "1 張",
        "價格類型": "限價",
        "委託條件": "ROD，當日有效",
        "交易類別": "現股",
        "測試說明": "送出一筆 Shioaji 模擬模式的股票委託，用來確認 API 具備證券委託測試能力。",
    }

    try:
        order = sj.StockOrder(
            action=sj.Action.Buy,
            price=28,
            quantity=1,
            price_type=sj.StockPriceType.LMT,
            order_type=sj.OrderType.ROD,
            order_lot=sj.StockOrderLot.Common,
            order_cond=sj.StockOrderCond.Cash,
            account=api.stock_account,
        )
    except Exception as exc:
        raise _step_error("建立股票委託", exc) from exc

    time.sleep(1)
    try:
        trade = api.place_order(contract, order)
    except Exception as exc:
        raise _step_error("送出股票委託", exc) from exc

    return _order_payload(
        "TSE2890",
        trade,
        contract=contract,
        order_request=order_request,
    )


def _place_futures_order(api: sj.Shioaji) -> dict[str, Any]:
    try:
        contract, available_contracts = _select_txf_contract(api)
    except Exception as exc:
        raise _step_error("取得期貨合約", exc) from exc

    contract_code = _contract_code(contract) or "TXF"
    order_request = {
        "商品類型": "台指期貨",
        "測試標的": contract_code,
        "合約代碼": contract_code,
        "買賣方向": "買進",
        "委託價格": "37000",
        "委託數量": "1 口",
        "價格類型": "限價",
        "委託條件": "ROD，當日有效",
        "新平倉": "Auto，自動新平倉",
        "測試說明": "先從 Shioaji 商品檔查詢目前可用的 TXF 合約，再送出一筆模擬期貨委託。",
    }

    try:
        order = sj.FuturesOrder(
            action=sj.Action.Buy,
            price=37000,
            quantity=1,
            price_type=sj.FuturesPriceType.LMT,
            order_type=sj.OrderType.ROD,
            octype=sj.FuturesOCType.Auto,
            account=api.futopt_account,
        )
    except Exception as exc:
        raise _step_error("建立期貨委託", exc) from exc

    time.sleep(1)
    try:
        trade = api.place_order(contract, order)
    except Exception as exc:
        raise _step_error("送出期貨委託", exc) from exc

    return _order_payload(
        contract_code,
        trade,
        contract=contract,
        order_request=order_request,
        available_contracts=available_contracts,
    )


def _order_payload(
    contract_code: str,
    trade: Any,
    *,
    contract: Any,
    order_request: dict[str, str],
    available_contracts: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    return {
        "contract": contract_code,
        "contract_info": _contract_payload(contract),
        "order_request": order_request,
        "available_contracts": available_contracts or [],
        "trade": _safe_text(trade),
        "status": _safe_text(getattr(trade.status, "status", None)),
        "status_code": _safe_text(getattr(trade.status, "status_code", None)),
        "response": _trade_response_payload(trade),
    }


def _select_txf_contract(api: sj.Shioaji) -> tuple[Any, list[dict[str, str]]]:
    txf_contracts = api.Contracts.Futures.TXF
    candidates = _contract_candidates(txf_contracts)

    preferred = getattr(txf_contracts, "TXFR1", None)
    if preferred is not None:
        candidates.append(preferred)

    unique_candidates = _unique_contracts(candidates)
    available_contracts = [_contract_payload(contract) for contract in unique_candidates[:8]]

    if preferred is not None:
        return preferred, available_contracts

    if not unique_candidates:
        raise ShioajiTestError("查無可用的 TXF 期貨合約。")

    return sorted(unique_candidates, key=_contract_sort_key)[0], available_contracts


def _contract_candidates(container: Any) -> list[Any]:
    candidates: list[Any] = []
    seen: set[int] = set()

    def add(value: Any) -> None:
        if value is None or id(value) in seen:
            return
        if not _looks_like_contract(value):
            return
        seen.add(id(value))
        candidates.append(value)

    for method_name in ("values", "items"):
        method = getattr(container, method_name, None)
        if not callable(method):
            continue
        try:
            values = method()
        except Exception:
            continue
        for value in values:
            if method_name == "items" and isinstance(value, tuple) and len(value) == 2:
                add(value[1])
            else:
                add(value)

    try:
        for value in container:
            add(value)
    except Exception:
        pass

    for name in dir(container):
        if name.startswith("_"):
            continue
        try:
            add(getattr(container, name))
        except Exception:
            continue

    return candidates


def _looks_like_contract(value: Any) -> bool:
    security_type = _safe_text(getattr(value, "security_type", ""))
    option_right = _safe_text(getattr(value, "option_right", ""))
    code = _contract_code(value)
    if not code:
        return False
    if security_type and "FUT" not in security_type:
        return False
    if option_right and "Future" not in option_right:
        return False
    return True


def _unique_contracts(contracts: list[Any]) -> list[Any]:
    unique: list[Any] = []
    seen: set[str] = set()
    for contract in contracts:
        code = _contract_code(contract)
        if not code or code in seen:
            continue
        seen.add(code)
        unique.append(contract)
    return unique


def _contract_sort_key(contract: Any) -> tuple[int, str]:
    code = _contract_code(contract)
    is_continuous = 0 if code.endswith("R1") else 1
    return (is_continuous, code)


def _contract_code(contract: Any) -> str:
    return (
        _safe_text(getattr(contract, "code", ""))
        or _safe_text(getattr(contract, "full_code", ""))
        or _safe_text(getattr(contract, "symbol", ""))
    )


def _contract_payload(contract: Any) -> dict[str, str]:
    fields = (
        "code",
        "name",
        "exchange",
        "security_type",
        "delivery_month",
        "delivery_date",
        "full_code",
        "option_right",
    )
    return {
        field: _safe_text(getattr(contract, field, ""))
        for field in fields
        if _safe_text(getattr(contract, field, ""))
    }


def _trade_response_payload(trade: Any) -> dict[str, str]:
    status = getattr(trade, "status", None)
    return {
        "委託狀態": _safe_text(getattr(status, "status", "")),
        "狀態碼": _safe_text(getattr(status, "status_code", "")),
        "委託序號": _safe_text(getattr(status, "id", "")),
        "券商回傳": _safe_text(trade),
    }


def _step(name: str, status: str, message: str, detail: str = "") -> dict[str, str]:
    return {
        "name": name,
        "status": status,
        "message": message,
        "detail": detail or "",
    }


def _summary_lines(steps: list[dict[str, str]]) -> str:
    labels = {
        "passed": "成功",
        "skipped": "未執行",
        "failed": "失敗",
    }
    lines = ["Shioaji API 檢查結果"]
    for step in steps:
        status = labels.get(step["status"], step["status"])
        lines.append(f"{step['name']}：{status}，{step['message']}")
    return "\n".join(lines)


def _safe_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value)


def _step_error(step: str, exc: Exception) -> ShioajiTestError:
    message = str(exc) or exc.__class__.__name__
    if "invalid secret_key" in message:
        message = f"{message}。請確認 Secret Key 是否完整貼上，且沒有多打或少打一段。"
    return ShioajiTestError(f"{step}失敗：{message}")
