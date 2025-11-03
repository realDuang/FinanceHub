import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  FileSpreadsheet,
  Plus,
  Trash2,
} from "lucide-react";
import api from "../services/api";
import type {
  TransactionImportPayload,
  TransactionImportResult,
} from "../services/types";
import {
  createEmptyDraftRow,
  TransactionDraftRow,
  useImportReview,
} from "../context/ImportReviewContext";

type ColumnKey = Exclude<
  keyof TransactionDraftRow,
  "__isNew" | "__editableCells"
>;
const STORAGE_TO_INPUT_DATETIME = (value: string): string => {
  if (!value) {
    return "";
  }
  if (value.includes("T")) {
    return value;
  }
  return value.replace(" ", "T");
};

const INPUT_TO_STORAGE_DATETIME = (value: string): string => {
  if (!value) {
    return "";
  }
  return value.replace("T", " ");
};

const CATEGORY_OPTIONS = [
  "餐饮",
  "住房",
  "交通",
  "生活",
  "娱乐",
  "人情",
  "交易",
  "礼物",
  "旅行",
  "工资",
];

const PAYMENT_METHOD_OPTIONS = ["微信支付", "支付宝", "银行"];

type ColumnDefinition = {
  key: ColumnKey;
  label: string;
  editable: boolean;
  variant?: "category" | "incomeType" | "textarea" | "paymentMethod";
  placeholder?: string;
};

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  {
    key: "transaction_time",
    label: "交易时间",
    editable: false,
  },
  {
    key: "category",
    label: "类型",
    editable: true,
    variant: "category",
  },
  {
    key: "amount",
    label: "金额",
    editable: false,
  },
  {
    key: "income_expense_type",
    label: "收支",
    editable:  false,
    variant: "incomeType",
  },
  {
    key: "payment_method",
    label: "支付方式",
    editable: false,
    variant: "paymentMethod",
  },
  {
    key: "counterparty",
    label: "交易对方",
    editable: false,
  },
  {
    key: "item_name",
    label: "商品名称",
    editable: false,
  },
  {
    key: "remarks",
    label: "备注",
    editable: true,
    variant: "textarea",
    placeholder: "备注信息",
  },
];

const TransactionImportReview: React.FC = () => {
  const navigate = useNavigate();
  const {
    rows,
    setRows,
    enableDeduplication,
    setEnableDeduplication,
    sourceFileName,
    reset,
  } = useImportReview();

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<TransactionImportResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    if (rows.length === 0 && !submissionResult) {
      navigate("/cash-flow-analysis", { replace: true });
    }
  }, [rows.length, submissionResult, navigate]);

  const nonEmptyRows = useMemo(
    () =>
      rows.filter((row) =>
        COLUMN_DEFINITIONS.some((column) => {
          const rawValue = row[column.key];
          return typeof rawValue === "string" && rawValue.trim() !== "";
        })
      ),
    [rows]
  );

  const handleCellChange = (
    rowIndex: number,
    key: ColumnKey,
    value: string
  ) => {
    setRows((prev) => {
      const next = [...prev];
      const columnDefinition = COLUMN_DEFINITIONS.find(
        (column) => column.key === key
      );
      const currentRow = { ...next[rowIndex] };
      const previousValue = currentRow[key];
      const rowIsNew = currentRow.__isNew === true;
      const columnAlwaysEditable = columnDefinition?.editable === true;

      if (
        !rowIsNew &&
        !columnAlwaysEditable &&
        typeof previousValue === "string" &&
        previousValue.trim() === ""
      ) {
        currentRow.__editableCells = {
          ...(currentRow.__editableCells ?? {}),
          [String(key)]: true,
        };
      }

      currentRow[key] = value;
      next[rowIndex] = currentRow;
      return next;
    });
  };

  const handleAddRow = () => {
    setRows((prev) => [createEmptyDraftRow(), ...prev]);
  };

  const handleDeleteRow = (index: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmissionError(null);
    setSubmissionResult(null);

    try {
      if (nonEmptyRows.length === 0) {
        setSubmissionError("没有可提交的数据记录");
        return;
      }

      const payload: TransactionImportPayload = {
        enable_deduplication: enableDeduplication,
        records: nonEmptyRows.map((row) => ({
          transaction_time: row.transaction_time,
          category: row.category,
          amount: row.amount,
          income_expense_type: row.income_expense_type,
          payment_method: row.payment_method,
          counterparty: row.counterparty,
          item_name: row.item_name,
          remarks: row.remarks,
        })),
      };

      const result = await api.importTransactionsFromRecords(payload);
      setSubmissionResult(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "提交失败，请稍后重试";
      setSubmissionError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = () => {
    reset();
    setSubmissionError(null);
    setSubmissionResult(null);
    navigate("/cash-flow-analysis", {
      replace: true,
      state: { importSuccess: submissionResult?.success === true },
    });
  };

  const handleCancel = () => {
    reset();
    setSubmissionError(null);
    setSubmissionResult(null);
    navigate("/cash-flow-analysis", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            返回现金流分析
          </button>
          <div className="flex items-center gap-2 text-gray-600">
            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            <span>
              {sourceFileName ? `正在编辑: ${sourceFileName}` : "交易数据预览"}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                交易数据预览与编辑
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                请确认并编辑导入数据，确认后将保存至数据库。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={enableDeduplication}
                  onChange={(event) =>
                    setEnableDeduplication(event.target.checked)
                  }
                />
                启用去重检查
              </label>
              <button
                onClick={handleAddRow}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                添加行
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {COLUMN_DEFINITIONS.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[88px]"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.map((row, rowIndex) => (
                  <tr
                    key={`draft-row-${rowIndex}`}
                    className="hover:bg-gray-50"
                  >
                    {COLUMN_DEFINITIONS.map((column) => {
                      const rawValue = row[column.key];
                      const cellValue =
                        typeof rawValue === "string" ? rawValue : "";
                      const trimmedValue = cellValue.trim();
                      const rowIsNew = row.__isNew === true;
                      const persistentEditable = Boolean(
                        row.__editableCells?.[String(column.key)]
                      );
                      const allowEdit =
                        column.editable ||
                        rowIsNew ||
                        persistentEditable ||
                        trimmedValue === "";

                      return (
                        <td key={column.key} className="px-4 py-3 align-middle">
                          {allowEdit ? (
                            column.key === "transaction_time" ? (
                              <input
                                type="datetime-local"
                                step="1"
                                value={STORAGE_TO_INPUT_DATETIME(cellValue)}
                                onChange={(event) =>
                                  handleCellChange(
                                    rowIndex,
                                    column.key,
                                    INPUT_TO_STORAGE_DATETIME(
                                      event.target.value
                                    )
                                  )
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : column.variant === "category" ? (
                              <select
                                value={cellValue}
                                onChange={(event) =>
                                  handleCellChange(
                                    rowIndex,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">选择类型</option>
                                {CATEGORY_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : column.variant === "incomeType" ? (
                              <select
                                value={cellValue}
                                onChange={(event) =>
                                  handleCellChange(
                                    rowIndex,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">选择收支类型</option>
                                <option value="收入">收入</option>
                                <option value="支出">支出</option>
                              </select>
                            ) : column.variant === "paymentMethod" ? (
                              <select
                                value={cellValue}
                                onChange={(event) =>
                                  handleCellChange(
                                    rowIndex,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">选择支付方式</option>
                                {PAYMENT_METHOD_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : column.variant === "textarea" ? (
                              <textarea
                                rows={3}
                                value={cellValue}
                                onChange={(event) =>
                                  handleCellChange(
                                    rowIndex,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                placeholder={column.placeholder}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                              />
                            ) : (
                              <input
                                type="text"
                                value={cellValue}
                                onChange={(event) =>
                                  handleCellChange(
                                    rowIndex,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                placeholder={column.placeholder}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            )
                          ) : (
                            <div className="text-xs text-gray-700 whitespace-pre-wrap break-words leading-5">
                              {trimmedValue ? cellValue : "—"}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteRow(rowIndex)}
                        className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600 px-3 py-1 min-w-[88px] justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={COLUMN_DEFINITIONS.length + 1}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      暂无数据，请返回重新上传CSV文件。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-gray-600">
              当前共 {nonEmptyRows.length} 条有效记录。
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 disabled:bg-blue-300"
                disabled={submitting}
              >
                {submitting ? "正在提交..." : "确认提交"}
              </button>
            </div>
          </div>
        </div>

        {submissionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">提交失败</div>
              <div className="text-sm mt-1">{submissionError}</div>
            </div>
          </div>
        )}

        {submissionResult && (
          <div
            className={`mt-6 rounded-xl border p-5 flex items-start gap-3 ${
              submissionResult.success
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-yellow-50 border-yellow-200 text-yellow-800"
            }`}
          >
            {submissionResult.success ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-medium">{submissionResult.message}</div>
              <div className="text-sm mt-2 space-y-1">
                <div>成功导入: {submissionResult.imported_count} 条</div>
                <div>跳过重复: {submissionResult.duplicate_count} 条</div>
                <div>跳过错误: {submissionResult.skipped_count} 条</div>
              </div>

              {submissionResult.error_details?.length ? (
                <details className="mt-3">
                  <summary className="text-sm font-medium cursor-pointer">
                    查看错误详情 ({submissionResult.error_details.length})
                  </summary>
                  <div className="mt-2 space-y-2 text-sm">
                    {submissionResult.error_details.map((detail, index) => (
                      <div
                        key={`error-${index}`}
                        className="bg-white border border-red-100 rounded-lg p-3"
                      >
                        <div className="font-medium text-red-600">
                          第 {detail.row} 行: {detail.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}

              {submissionResult.duplicate_details?.length ? (
                <details className="mt-3">
                  <summary className="text-sm font-medium cursor-pointer">
                    查看重复详情 ({submissionResult.duplicate_details.length})
                  </summary>
                  <div className="mt-2 space-y-2 text-sm">
                    {submissionResult.duplicate_details.map((detail, index) => (
                      <div
                        key={`duplicate-${index}`}
                        className="bg-white border border-yellow-100 rounded-lg p-3"
                      >
                        <div className="font-medium text-yellow-700">
                          第 {detail.row} 行: {detail.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}

              {submissionResult.success && (
                <div className="mt-4">
                  <button
                    onClick={handleReturn}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    返回现金流分析
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionImportReview;
