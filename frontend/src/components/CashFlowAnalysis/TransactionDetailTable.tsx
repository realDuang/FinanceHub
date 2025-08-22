import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
  Column,
} from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
} from "lucide-react";
import { TransactionDetail } from "../../services/types";
import { formatCurrency, formatDate } from "../../utils/chart-utils";

interface TransactionDetailTableProps {
  data: TransactionDetail[];
  loading?: boolean;
}

const columnHelper = createColumnHelper<TransactionDetail>();

// 获取交易类型的中文映射
const getTransactionTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    住房: "住房",
    餐饮: "餐饮",
    生活: "生活",
    娱乐: "娱乐",
    交通: "交通",
    旅行: "旅行",
    礼物: "礼品",
    交易: "交易",
    人情: "人情",
    工资: "工资",
    其他: "其他",
  };
  return typeMap[type] || type;
};

// 获取收支类型的中文映射
const getIncomeExpenseTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    收入: "收入",
    支出: "支出",
  };
  return typeMap[type] || type;
};

// 获取支付方式的中文映射
const getPaymentMethodText = (method: string) => {
  const methodMap: Record<string, string> = {
    现金: "现金",
    支付宝: "支付宝",
    微信支付: "微信",
    银行卡: "银行卡",
    信用卡: "信用卡",
    其他: "其他",
  };
  return methodMap[method] || method;
};

// 下拉筛选组件
const SelectFilter: React.FC<{
  column: Column<TransactionDetail, unknown>;
  options: string[];
  placeholder: string;
}> = ({ column, options, placeholder }) => {
  const columnFilterValue = column.getFilterValue() as string;

  return (
    <div className="flex items-center space-x-1">
      <select
        value={columnFilterValue ?? ""}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {columnFilterValue && (
        <button
          onClick={() => column.setFilterValue("")}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      )}
    </div>
  );
};

const TransactionDetailTable: React.FC<TransactionDetailTableProps> = ({
  data,
  loading = false,
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "transaction_time", desc: false }, // 修改为增序排列
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // 从数据中聚合出筛选选项
  const filterOptions = useMemo(() => {
    const transactionMonths = Array.from(
      new Set(
      data.map((item) => {
        const date = new Date(item.transaction_time);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
      )
    ).sort();
    const categories = Array.from(
      new Set(data.map((item) => item.category))
    ).sort();
    const incomeExpenseTypes = Array.from(
      new Set(data.map((item) => item.income_expense_type))
    ).sort();
    const paymentMethods = Array.from(
      new Set(
        data
          .map((item) => item.payment_method)
          .filter((method): method is string => Boolean(method))
      )
    ).sort();
    const counterparties = Array.from(
      new Set(
        data
          .map((item) => item.counterparty)
          .filter((party): party is string => Boolean(party))
      )
    )
      .sort()
      .slice(0, 50); // 限制数量

    return {
      transactionMonths,
      categories,
      incomeExpenseTypes,
      paymentMethods,
      counterparties,
    };
  }, [data]);

  // 定义列配置
  const columns = useMemo(
    () => [
      columnHelper.accessor("transaction_time", {
        header: "交易时间",
        cell: (info) => formatDate(info.getValue(), "YYYY-MM-DD HH:mm"),
        enableSorting: true,
        enableColumnFilter: true,
        size: 100,
      }),
      columnHelper.accessor("category", {
        header: "交易类别",
        cell: (info) => (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {getTransactionTypeText(info.getValue())}
          </span>
        ),
        enableSorting: false,
        enableColumnFilter: true,
        size: 80,
      }),
      columnHelper.accessor("income_expense_type", {
        header: "收支类型",
        cell: (info) => (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              info.getValue() === "收入"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {getIncomeExpenseTypeText(info.getValue())}
          </span>
        ),
        enableSorting: false,
        enableColumnFilter: true,
        size: 80,
      }),
      columnHelper.accessor("amount", {
        header: "金额",
        cell: (info) => (
          <span
            className={`font-medium ${
              info.row.original.income_expense_type === "收入"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {info.row.original.income_expense_type === "收入" ? "+" : "-"}
            {formatCurrency(Math.abs(info.getValue()))}
          </span>
        ),
        enableSorting: true,
        enableColumnFilter: false,
        size: 120,
      }),
      columnHelper.accessor("payment_method", {
        header: "支付方式",
        cell: (info) => {
          const value = info.getValue();
          return value ? getPaymentMethodText(value) : "-";
        },
        enableSorting: false,
        enableColumnFilter: true,
        size: 100,
      }),
      columnHelper.accessor("counterparty", {
        header: "交易对方",
        cell: (info) => (
          <span
            className="truncate max-w-32 block"
            title={info.getValue() || ""}
          >
            {info.getValue() || "-"}
          </span>
        ),
        enableSorting: false,
        enableColumnFilter: false,
        size: 120,
      }),
      columnHelper.accessor("item_name", {
        header: "商品名称",
        cell: (info) => (
          <span
            className="truncate max-w-40 block"
            title={info.getValue() || ""}
          >
            {info.getValue() || "-"}
          </span>
        ),
        enableSorting: false,
        enableColumnFilter: false,
        size: 150,
      }),
      columnHelper.accessor("remarks", {
        header: "备注",
        cell: (info) => (
          <span
            className="truncate max-w-32 block"
            title={info.getValue() || ""}
          >
            {info.getValue() || "-"}
          </span>
        ),
        enableSorting: false,
        enableColumnFilter: false,
        size: 120,
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    globalFilterFn: "includesString",
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* 头部 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">交易详情明细</h2>
          <div className="flex items-center space-x-4">
            {/* 全局搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="搜索所有字段..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <span>共 {data.length} 条记录</span>
          <span>筛选后 {table.getFilteredRowModel().rows.length} 条</span>
          {columnFilters.length > 0 && (
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>{columnFilters.length} 个筛选条件</span>
              <button
                onClick={() => setColumnFilters([])}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                清除筛选
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <React.Fragment key={headerGroup.id}>
                {/* 表头行 */}
                <tr>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
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
                {/* 筛选行 */}
                <tr>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2 bg-gray-50 border-b border-gray-200"
                    >
                      {header.column.getCanFilter() ? (
                        <>
                          {header.column.id === "transaction_time" && (
                            <SelectFilter
                              column={header.column}
                              options={filterOptions.transactionMonths}
                              placeholder="选择月份"
                            />
                          )}
                          {header.column.id === "category" && (
                            <SelectFilter
                              column={header.column}
                              options={filterOptions.categories}
                              placeholder="选择类别"
                            />
                          )}
                          {header.column.id === "income_expense_type" && (
                            <SelectFilter
                              column={header.column}
                              options={filterOptions.incomeExpenseTypes}
                              placeholder="选择收支类型"
                            />
                          )}
                          {header.column.id === "payment_method" && (
                            <SelectFilter
                              column={header.column}
                              options={filterOptions.paymentMethods}
                              placeholder="选择支付方式"
                            />
                          )}
                        </>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </React.Fragment>
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
            {[10, 20, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-700">条记录</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            第 {table.getState().pagination.pageIndex + 1} 页，共{" "}
            {table.getPageCount()} 页
          </span>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一页
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* 无数据提示 */}
      {table.getFilteredRowModel().rows.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {data.length === 0 ? "暂无数据" : "筛选条件下无匹配数据"}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetailTable;
