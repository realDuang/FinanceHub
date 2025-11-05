import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { FinancialAggregationRecord } from "../../services/types";
import { formatCurrency, formatDate } from "../../utils/chart-utils";

interface FinancialDataTableProps {
  data: FinancialAggregationRecord[];
  loading?: boolean;
}

const columnHelper = createColumnHelper<FinancialAggregationRecord>();

const FinancialDataTable: React.FC<FinancialDataTableProps> = ({
  data,
  loading = false,
}) => {
  const { t, i18n } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "month_date", desc: true },
  ]);

  const currencySymbol = t('currency.symbol');
  const currencyLocale = t('currency.locale');

  const formatThresholdNumber = (
    value: number,
    redThreshold: number,
    greenThreshold: number
  ) => {
    return (
      <span
        className={`font-medium ${
          value <= redThreshold
            ? "text-red-600"
            : value >= greenThreshold
            ? "text-green-600"
            : ""
        }`}
      >
        {formatCurrency(value, currencySymbol, currencyLocale)}
      </span>
    );
  };

  // 定义列配置
  const columns = useMemo(
    () => [
      columnHelper.accessor("month_date", {
        header: t('chart.month'),
        cell: (info) => formatDate(info.getValue(), "YYYY-MM"),
        enableSorting: true,
        size: 120,
      }),

      columnHelper.accessor("housing", {
        header: t('categories.housing'),
        cell: (info) => formatCurrency(info.getValue(), currencySymbol, currencyLocale),
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor("dining", {
        header: t('categories.dining'),
        cell: (info) => formatThresholdNumber(info.getValue(), -3000, 3000),
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor("living", {
        header: t('categories.living'),
        cell: (info) => formatThresholdNumber(info.getValue(), -3000, 3000),
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor("entertainment", {
        header: t('categories.entertainment'),
        cell: (info) => formatThresholdNumber(info.getValue(), -3000, 3000),
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor("transportation", {
        header: t('categories.transportation'),
        cell: (info) => formatThresholdNumber(info.getValue(), -3000, 3000),
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor("travel", {
        header: t('categories.travel'),
        cell: (info) => formatThresholdNumber(info.getValue(), -3000, 3000),
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor("gifts", {
        header: t('categories.gifts'),
        cell: (info) => formatThresholdNumber(info.getValue(), -3000, 3000),
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor("social_expenses", {
        header: t('cashFlow.socialExpenses'),
        cell: (info) => formatThresholdNumber(info.getValue(), -3000, 3000),
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor("transactions", {
        header: t('categories.transactions'),
        cell: (info) => formatThresholdNumber(info.getValue(), -3000, 3000),
        enableSorting: true,
        size: 80,
      }),
      columnHelper.accessor("salary", {
        header: t('cashFlow.salary'),
        cell: (info) => formatCurrency(info.getValue(), currencySymbol, currencyLocale),
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor("balance", {
        header: t('cashFlow.balance'),
        cell: (info) => formatCurrency(info.getValue(), currencySymbol, currencyLocale),
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor("avg_consumption", {
        header: t('cashFlow.avgConsumption'),
        cell: (info) => formatThresholdNumber(-info.getValue(), -18000, -13000),
        enableSorting: true,
        size: 150,
      }),
      columnHelper.accessor("recent_avg_consumption", {
        header: t('cashFlow.recentAvgConsumption'),
        cell: (info) => formatThresholdNumber(-info.getValue(), -18000, -13000),
        enableSorting: true,
        size: 150,
      }),
    ],
    [t, currencySymbol, currencyLocale]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{t('cashFlow.financialOverview')}</h2>
        </div>

        {/* Statistics */}
        <div className="text-sm text-gray-600">{t('transaction.totalRecords', { count: data.length })}</div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </span>
                      {header.column.getCanSort() && (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center hover:bg-gray-100 rounded p-1"
                        >
                          {header.column.getIsSorted() === "asc" ? (
                            <ChevronUp className="w-4 h-4 text-blue-600" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ChevronDown className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页控制 */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">每页显示</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {[10, 20, 30, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-700">{t('common.total')}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            {t('common.page')} {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('common.previous')}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.next')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* 无数据提示 */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">暂无数据</div>
        </div>
      )}
    </div>
  );
};

export default FinancialDataTable;
