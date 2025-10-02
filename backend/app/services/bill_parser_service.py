import csv
import io
import re
from dataclasses import dataclass
from hashlib import md5
from typing import Dict, List, Tuple, Optional

import pandas as pd


@dataclass
class BillParseResult:
    dataframe: pd.DataFrame
    details: Dict[str, object]


class BillParserError(Exception):
    """Raised when a bill file cannot be parsed into the expected format."""


class BillParser:
    """Parse Alipay / WeChat raw statements or normalized CSV into a standard schema."""

    CANONICAL_COLUMNS: Tuple[str, ...] = (
        "交易时间",
        "类型",
        "金额",
        "收支",
        "支付方式",
        "交易对方",
        "商品名称",
        "备注",
    )

    _ALIAY_KEYWORDS = ("支付宝", "alipay")
    _WECHAT_KEYWORDS = ("微信支付", "weixin", "wechat")

    @classmethod
    def parse(cls, file_bytes: bytes, filename: str | None = None) -> BillParseResult:
        """Detect input format, parse, normalise columns and return statistics."""
        if not file_bytes:
            raise BillParserError("文件内容为空")

        format_type = cls._detect_format(file_bytes, filename)

        if format_type == "alipay":
            df_raw, encoding = cls._parse_alipay(file_bytes)
        elif format_type == "wechat_xlsx":
            df_raw, encoding = cls._parse_wechat_excel(file_bytes)
        elif format_type == "wechat":
            df_raw, encoding = cls._parse_wechat(file_bytes)
        else:
            df_raw, encoding = cls._parse_standard(file_bytes)

        normalized_df, stats = cls._normalize_dataframe(df_raw, format_type)

        details = {
            "format": format_type,
            "encoding": encoding,
            **stats,
            "file_signature": md5(file_bytes).hexdigest(),
        }

        if normalized_df.empty:
            raise BillParserError("未能从文件中解析到有效的交易数据")

        return BillParseResult(dataframe=normalized_df, details=details)

    @classmethod
    def _detect_format(cls, file_bytes: bytes, filename: str | None) -> str:
        name = (filename or "").lower()
        if name.endswith((".xlsx", ".xls")):
            if any(keyword in name for keyword in cls._ALIAY_KEYWORDS):
                return "alipay"
            return "wechat_xlsx"

        # 包含中文 "微信"
        if file_bytes[:4] == b"PK\x03\x04":
            return "wechat_xlsx"

        if any(keyword in name for keyword in cls._ALIAY_KEYWORDS):
            return "alipay"
        if any(keyword in name for keyword in cls._WECHAT_KEYWORDS):
            return "wechat"

        preview_utf8 = file_bytes.decode("utf-8", errors="ignore")
        preview_gbk = file_bytes.decode("gbk", errors="ignore")

        preview = preview_utf8 or preview_gbk
        if any(keyword in preview for keyword in cls._ALIAY_KEYWORDS):
            return "alipay"
        if any(keyword in preview for keyword in cls._WECHAT_KEYWORDS):
            return "wechat"

        if "金额(元)" in preview or "金额（元）" in preview:
            return "standard"

        return "standard"

    @classmethod
    def _parse_standard(cls, file_bytes: bytes) -> Tuple[pd.DataFrame, str]:
        encodings = ["utf-8-sig", "utf-8", "gbk"]
        for encoding in encodings:
            try:
                buffer = io.BytesIO(file_bytes)
                df = pd.read_csv(buffer, encoding=encoding)
                return df, encoding
            except UnicodeDecodeError:
                continue
            except pd.errors.ParserError:
                continue
        raise BillParserError("CSV 文件格式无法识别，请检查文件是否为有效的表格数据")

    @classmethod
    def _parse_alipay(cls, file_bytes: bytes) -> Tuple[pd.DataFrame, str]:
        text = file_bytes.decode("gbk", errors="ignore")
        lines = text.splitlines()

        csv_lines: List[str] = []
        within_table = False
        for line in lines:
            if not within_table:
                if line.startswith("----------------------"):
                    within_table = True
                continue

            if line.startswith("----------------------------"):
                break

            sanitized = re.sub(r"\s+,", ",", line).strip()
            if sanitized:
                csv_lines.append(sanitized)

        if not csv_lines:
            raise BillParserError("未检测到支付宝账单明细数据区域")

        reader = csv.DictReader(csv_lines)
        df = pd.DataFrame(reader)
        return df, "gbk"

    @classmethod
    def _parse_wechat(cls, file_bytes: bytes) -> Tuple[pd.DataFrame, str]:
        text = file_bytes.decode("utf-8-sig", errors="ignore")
        lines = text.splitlines()

        csv_lines: List[str] = []
        within_table = False
        for line in lines:
            stripped = line.strip()
            if not within_table:
                if stripped.startswith("----------------------"):
                    within_table = True
                continue

            if not stripped:
                continue
            csv_lines.append(stripped)

        if not csv_lines:
            raise BillParserError("未检测到微信支付账单数据")

        reader = csv.DictReader(csv_lines)
        df = pd.DataFrame(reader)
        return df, "utf-8-sig"

    @classmethod
    def _parse_wechat_excel(cls, file_bytes: bytes) -> Tuple[pd.DataFrame, str]:
        buffer = io.BytesIO(file_bytes)
        try:
            raw_df = pd.read_excel(buffer, sheet_name=0, header=None, engine="openpyxl")
        except ImportError as error:
            raise BillParserError("解析微信账单需要安装 openpyxl 库") from error
        except ValueError as error:
            raise BillParserError(f"无法读取微信账单 Excel 文件: {error}") from error

        header_index = None
        for idx, row in raw_df.iterrows():
            row_values = [str(value).strip() for value in row.tolist()]
            if "收/支" in row_values and (
                "金额(元)" in row_values or "金额（元）" in row_values
            ):
                header_index = idx
                break

        if header_index is None:
            raise BillParserError("未在微信账单中找到数据表头")

        header = raw_df.iloc[header_index].astype(str).str.strip().tolist()
        data = raw_df.iloc[header_index + 1 :].copy()
        data.columns = header

        if "合计" in data.columns:
            data = data.drop(columns=["合计"])

        data = data[~data.iloc[:, 0].astype(str).str.contains("合计", na=False)]
        data = data.dropna(how="all")

        return data, "binary"

    @classmethod
    def _normalize_dataframe(
        cls, df: pd.DataFrame, format_type: str
    ) -> Tuple[pd.DataFrame, Dict[str, int]]:
        if format_type == "alipay":
            return cls._normalize_alipay(df)
        if format_type in ("wechat", "wechat_xlsx"):
            return cls._normalize_wechat(df)
        return cls._normalize_generic(df)

    @classmethod
    def _normalize_alipay(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, int]]:
        raw_rows = len(df)
        if raw_rows == 0:
            return cls._empty_result(raw_rows)

        working = df.copy().reset_index(drop=True)

        income_series_initial = cls._stringify_column(working, ["收/支", "收支"])
        keep_mask = income_series_initial != "不计收支"
        working = working.loc[keep_mask].reset_index(drop=True)

        if "交易状态" in working.columns:
            status_series = cls._stringify_column(working, ["交易状态"])
            keep_mask = ~status_series.str.contains("交易关闭", na=False)
            working = working.loc[keep_mask].reset_index(drop=True)

        if working.empty:
            return cls._empty_result(raw_rows)

        transaction_time_series = cls._stringify_column(working, ["交易创建时间", "交易时间"])
        income_series = cls._stringify_column(working, ["收/支", "收支"])
        amount_series = cls._find_first_series(working, ["金额（元）", "金额(元)", "金额"])
        if amount_series is None:
            raise BillParserError("支付宝账单缺少金额列")

        amount_numeric = cls._to_numeric_amount(amount_series)
        payment_series = pd.Series(["支付宝"] * len(working), index=working.index, dtype="object")
        type_series = pd.Series([""] * len(working), index=working.index, dtype="object")
        counterparty_series = cls._stringify_column(working, ["交易对方"])
        product_series = cls._stringify_column(working, ["商品名称"])
        remarks_series = cls._stringify_column(working, ["备注"])

        cleaned = pd.DataFrame(
            {
                "交易时间": transaction_time_series,
                "类型": type_series,
                "金额": amount_numeric,
                "收支": income_series,
                "支付方式": payment_series,
                "交易对方": counterparty_series,
                "商品名称": product_series,
                "备注": remarks_series,
            }
        )

        time_parsed = pd.to_datetime(transaction_time_series, errors="coerce")
        valid_mask = (
            time_parsed.notna()
            & cleaned["金额"].notna()
            & cleaned["收支"].isin({"收入", "支出"})
        )

        cleaned = cleaned.loc[valid_mask].copy()
        cleaned["金额"] = cleaned["金额"].abs()

        cleaned = cls._finalize_cleaned_frame(cleaned)
        stats = cls._build_stats(raw_rows, len(cleaned))
        return cleaned, stats

    @classmethod
    def _normalize_wechat(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, int]]:
        raw_rows = len(df)
        if raw_rows == 0:
            return cls._empty_result(raw_rows)

        working = df.copy().reset_index(drop=True)

        income_series_initial = cls._stringify_column(working, ["收/支", "收支"], remove_slash=True)
        keep_mask = income_series_initial != ""
        working = working.loc[keep_mask].reset_index(drop=True)

        if working.empty:
            return cls._empty_result(raw_rows)

        transaction_time_series = cls._stringify_column(working, ["交易时间"])
        income_series = cls._stringify_column(working, ["收/支", "收支"], remove_slash=True)
        amount_series = cls._find_first_series(working, ["金额(元)", "金额（元）", "金额"])
        if amount_series is None:
            raise BillParserError("微信账单缺少金额列")

        amount_numeric = cls._to_numeric_amount(amount_series)
        payment_series = pd.Series(["微信支付"] * len(working), index=working.index, dtype="object")
        type_series = pd.Series([""] * len(working), index=working.index, dtype="object")
        counterparty_series = cls._stringify_column(working, ["交易对方"])
        product_series = cls._stringify_column(working, ["商品", "商品名称"])
        remarks_series = cls._stringify_column(working, ["备注"], remove_slash=True)
        status_series = cls._stringify_column(working, ["当前状态"])

        if len(remarks_series) > 0:
            remarks_series = remarks_series.combine(status_series, cls._append_refund_flag)

        cleaned = pd.DataFrame(
            {
                "交易时间": transaction_time_series,
                "类型": type_series,
                "金额": amount_numeric,
                "收支": income_series,
                "支付方式": payment_series,
                "交易对方": counterparty_series,
                "商品名称": product_series,
                "备注": remarks_series,
            }
        )

        time_parsed = pd.to_datetime(transaction_time_series, errors="coerce")
        valid_mask = (
            time_parsed.notna()
            & cleaned["金额"].notna()
            & cleaned["收支"].isin({"收入", "支出"})
        )

        cleaned = cleaned.loc[valid_mask].copy()
        cleaned["金额"] = cleaned["金额"].abs()

        cleaned = cls._finalize_cleaned_frame(cleaned)
        stats = cls._build_stats(raw_rows, len(cleaned))
        return cleaned, stats

    @classmethod
    def _normalize_generic(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, int]]:
        raw_rows = len(df)
        if raw_rows == 0:
            return cls._empty_result(raw_rows)

        working = df.copy().reset_index(drop=True)

        rename_map = {
            "金额（元）": "金额",
            "金额(元)": "金额",
            "收/支": "收支",
        }
        working.rename(
            columns={k: v for k, v in rename_map.items() if k in working.columns and v != k},
            inplace=True,
        )

        income_series = cls._stringify_column(working, ["收支"])
        keep_mask = income_series.isin({"收入", "支出"})
        working = working.loc[keep_mask].reset_index(drop=True)

        if working.empty:
            return cls._empty_result(raw_rows)

        transaction_time_series = cls._stringify_column(working, ["交易时间"])
        time_parsed = pd.to_datetime(transaction_time_series, errors="coerce")

        amount_series = cls._find_first_series(working, ["金额"])
        if amount_series is None:
            amount_series = pd.Series([pd.NA] * len(working), index=working.index)

        amount_numeric = cls._to_numeric_amount(amount_series)

        cleaned = pd.DataFrame(
            {
                "交易时间": transaction_time_series,
                "类型": cls._stringify_column(working, ["类型"]),
                "金额": amount_numeric,
                "收支": cls._stringify_column(working, ["收支"]),
                "支付方式": cls._stringify_column(working, ["支付方式"]),
                "交易对方": cls._stringify_column(working, ["交易对方"]),
                "商品名称": cls._stringify_column(working, ["商品名称"]),
                "备注": cls._stringify_column(working, ["备注"]),
            }
        )

        valid_mask = time_parsed.notna() & cleaned["金额"].notna()
        cleaned = cleaned.loc[valid_mask].copy()
        cleaned["金额"] = cleaned["金额"].abs()

        cleaned = cls._finalize_cleaned_frame(cleaned)
        stats = cls._build_stats(raw_rows, len(cleaned))
        return cleaned, stats

    @classmethod
    def _empty_result(cls, raw_rows: int) -> Tuple[pd.DataFrame, Dict[str, int]]:
        empty = pd.DataFrame(columns=cls.CANONICAL_COLUMNS)
        stats = cls._build_stats(raw_rows, 0)
        return empty, stats

    @staticmethod
    def _build_stats(raw_rows: int, normalized_rows: int) -> Dict[str, int]:
        dropped_rows = max(raw_rows - normalized_rows, 0)
        return {
            "raw_rows": int(raw_rows),
            "normalized_rows": int(normalized_rows),
            "dropped_rows": int(dropped_rows),
        }

    @staticmethod
    def _find_first_series(frame: pd.DataFrame, candidates: List[str]) -> Optional[pd.Series]:
        for column in candidates:
            if column in frame.columns:
                return frame[column]
        return None

    @staticmethod
    def _to_numeric_amount(series: pd.Series) -> pd.Series:
        cleaned = series.fillna("").astype(str).str.replace(r"[^\d\-.]", "", regex=True).str.strip()
        cleaned = cleaned.replace({"": pd.NA})
        numeric = pd.to_numeric(cleaned, errors="coerce")
        return numeric.abs()

    @staticmethod
    def _append_refund_flag(remark: object, status: object) -> str:
        remark_text = "" if remark is None else str(remark).strip()
        if remark_text.lower() in {"nan", "none"}:
            remark_text = ""

        status_text = "" if status is None else str(status)
        if status_text and "已退款" in status_text:
            return f"{remark_text} {status_text}" if remark_text else status_text
        return remark_text

    @staticmethod
    def _stringify_column(
        frame: pd.DataFrame,
        candidates: List[str],
        *,
        remove_slash: bool = False,
        default: str = "",
    ) -> pd.Series:
        index = frame.index
        series: Optional[pd.Series] = None
        for column in candidates:
            if column in frame.columns:
                series = frame[column]
                break

        if series is None:
            return pd.Series([default] * len(frame), index=index, dtype="object")

        result = series.fillna(default).astype(str).str.strip()
        result = result.replace({"nan": default, "NaN": default, "None": default})
        if remove_slash:
            result = result.str.replace("/", "", regex=False)
        return result

    @classmethod
    def _finalize_cleaned_frame(cls, frame: pd.DataFrame) -> pd.DataFrame:
        base = frame.copy()

        ordered_columns: Dict[str, pd.Series] = {}
        for column in cls.CANONICAL_COLUMNS:
            if column in base.columns:
                ordered_columns[column] = base[column]
            else:
                default_values = ["" for _ in range(len(base))]
                if column == "金额":
                    ordered_columns[column] = pd.Series([pd.NA] * len(base), index=base.index)
                else:
                    ordered_columns[column] = pd.Series(default_values, index=base.index, dtype="object")

        final = pd.DataFrame(ordered_columns, index=base.index)

        string_columns = [column for column in cls.CANONICAL_COLUMNS if column != "金额"]
        for column in string_columns:
            final[column] = final[column].fillna("").astype(str).str.strip()
            final[column] = final[column].replace({"nan": "", "NaN": "", "None": ""})

        final["交易时间"] = final["交易时间"].replace({"": pd.NA})

        final["金额"] = pd.to_numeric(final["金额"], errors="coerce")
        final = final.loc[final["金额"].notna()].copy()
        final["金额"] = final["金额"].abs()

        final = final[final["收支"].isin({"收入", "支出"})]
        final = final[final["交易时间"].notna()]

        final = final.loc[:, list(cls.CANONICAL_COLUMNS)].reset_index(drop=True)

        return final
