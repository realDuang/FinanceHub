import React, { useState } from "react";
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { API_BASE_URL } from "../../services/constants";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
  defaultTab?: "import" | "export";
}

interface ImportResult {
  success: boolean;
  message: string;
  imported_count: number;
  skipped_count: number;
  duplicate_count: number;
  error_details?: Array<{
    row: number;
    data: Record<string, string>;
    reason: string;
  }>;
  duplicate_details?: Array<{
    row: number;
    transaction_time: string;
    amount: number;
    counterparty: string;
    item_name: string;
    reason: string;
  }>;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  defaultTab = "import",
}) => {
  const [activeTab, setActiveTab] = useState<"import" | "export">(defaultTab);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [enableDeduplication, setEnableDeduplication] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);

  // 当模态框打开时，重置为默认选项卡
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setImportResult(null);
      setShowErrorDetails(false);
      setShowDuplicateDetails(false);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await fetch(`${API_BASE_URL}/transactions/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("导出失败");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // 从响应头获取文件名，或使用默认文件名
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "transactions.csv";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("导出失败:", error);
      alert("导出失败，请重试");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/template`);
      
      if (!response.ok) {
        throw new Error("下载模板失败");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transaction_template.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("下载模板失败:", error);
      alert("下载模板失败，请重试");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert("请选择CSV文件");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("enable_deduplication", enableDeduplication.toString());

      const response = await fetch(`${API_BASE_URL}/transactions/import`, {
        method: "POST",
        body: formData,
      });      const result: ImportResult = await response.json();
      setImportResult(result);

      if (result.success && onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      console.error("导入失败:", error);
      setImportResult({
        success: false,
        message: "导入失败，请重试",
        imported_count: 0,
        skipped_count: 0,
        duplicate_count: 0,
        error_details: [],
        duplicate_details: []
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">交易数据导入导出</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 px-4 text-center ${
              activeTab === "import"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("import")}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            数据导入
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center ${
              activeTab === "export"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("export")}
          >
            <Download className="w-4 h-4 inline mr-2" />
            数据导出
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {activeTab === "import" ? (
            <div className="space-y-6">
              {/* 导入说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">导入说明</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 支持CSV格式文件</li>
                  <li>• 系统会根据时间、金额、交易对方、商品名称进行去重判断</li>
                  <li>• 导入完成后会自动更新财务汇总数据</li>
                  <li>• 建议先下载模板查看格式要求</li>
                </ul>
              </div>

              {/* 下载模板 */}
              <div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <FileText className="w-4 h-4" />
                  下载CSV模板
                </button>
              </div>

              {/* 导入选项 */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enableDeduplication}
                    onChange={(e) => setEnableDeduplication(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">启用去重检查</span>
                </label>
              </div>

              {/* 文件上传区域 */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  拖拽CSV文件到此处，或点击选择文件
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
                >
                  选择文件
                </label>
              </div>

              {/* 导入状态 */}
              {isImporting && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>正在导入数据...</span>
                </div>
              )}

              {/* 导入结果 */}
              {importResult && (
                <div
                  className={`p-4 rounded-lg ${
                    importResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span
                      className={`font-medium ${
                        importResult.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {importResult.message}
                    </span>
                  </div>
                  {importResult.success && (
                    <>
                      <div className="text-sm text-green-700 space-y-1 mb-4">
                        <p>✅ 成功导入: {importResult.imported_count} 条记录</p>
                        <p>🔄 跳过重复: {importResult.duplicate_count} 条记录</p>
                        <p>❌ 跳过错误: {importResult.skipped_count} 条记录</p>
                      </div>

                      {/* 重复数据详情 */}
                      {importResult.duplicate_details && importResult.duplicate_details.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={() => setShowDuplicateDetails(!showDuplicateDetails)}
                            className="flex items-center gap-2 text-sm text-orange-700 hover:text-orange-800 font-medium"
                          >
                            {showDuplicateDetails ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            查看重复数据详情 ({importResult.duplicate_details.length} 条)
                          </button>
                          
                          {showDuplicateDetails && (
                            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                              {importResult.duplicate_details.map((detail, index) => (
                                <div key={index} className="bg-orange-50 border border-orange-200 rounded p-3 text-xs">
                                  <div className="font-medium text-orange-800 mb-1">
                                    第 {detail.row} 行
                                  </div>
                                  <div className="text-orange-700 space-y-1">
                                    <p>时间: {detail.transaction_time}</p>
                                    <p>金额: ¥{detail.amount}</p>
                                    <p>交易对方: {detail.counterparty || "无"}</p>
                                    <p>商品名称: {detail.item_name || "无"}</p>
                                    <p className="font-medium">原因: {detail.reason}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 错误数据详情 */}
                      {importResult.error_details && importResult.error_details.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={() => setShowErrorDetails(!showErrorDetails)}
                            className="flex items-center gap-2 text-sm text-red-700 hover:text-red-800 font-medium"
                          >
                            {showErrorDetails ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            查看错误数据详情 ({importResult.error_details.length} 条)
                          </button>
                          
                          {showErrorDetails && (
                            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                              {importResult.error_details.map((detail, index) => (
                                <div key={index} className="bg-red-50 border border-red-200 rounded p-3 text-xs">
                                  <div className="font-medium text-red-800 mb-1">
                                    第 {detail.row} 行
                                  </div>
                                  <div className="text-red-700 space-y-1">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>交易时间: {detail.data.交易时间}</div>
                                      <div>类型: {detail.data.类型}</div>
                                      <div>金额: {detail.data.金额}</div>
                                      <div>收支: {detail.data.收支}</div>
                                      <div>支付方式: {detail.data.支付方式}</div>
                                      <div>交易对方: {detail.data.交易对方}</div>
                                    </div>
                                    <div>商品名称: {detail.data.商品名称}</div>
                                    <div>备注: {detail.data.备注}</div>
                                    <div className="font-medium border-t border-red-200 pt-1 mt-2">
                                      错误原因: {detail.reason}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* 导出说明 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">导出说明</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• 可按时间范围导出交易明细</li>
                  <li>• 导出格式为CSV，可用Excel等软件打开</li>
                  <li>• 不选择日期范围将导出所有数据</li>
                </ul>
              </div>

              {/* 时间范围选择 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 导出按钮 */}
              <div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <Download className="w-4 h-4" />
                  导出CSV文件
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;
