import React, { createContext, useContext, useMemo, useState } from "react";

export interface TransactionDraftRow {
  transaction_time: string;
  category: string;
  amount: string;
  income_expense_type: string;
  payment_method: string;
  counterparty: string;
  item_name: string;
  remarks: string;
  __isNew?: boolean;
  __editableCells?: Record<string, boolean>;
}

type ImportReviewContextValue = {
  rows: TransactionDraftRow[];
  setRows: React.Dispatch<React.SetStateAction<TransactionDraftRow[]>>;
  enableDeduplication: boolean;
  setEnableDeduplication: (value: boolean) => void;
  sourceFileName: string | null;
  setSourceFileName: (name: string | null) => void;
  reset: () => void;
};

const ImportReviewContext = createContext<ImportReviewContextValue | null>(
  null
);

const emptyRow: TransactionDraftRow = {
  transaction_time: "",
  category: "",
  amount: "",
  income_expense_type: "",
  payment_method: "",
  counterparty: "",
  item_name: "",
  remarks: "",
};

export const ImportReviewProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [rows, setRows] = useState<TransactionDraftRow[]>([]);
  const [enableDeduplication, setEnableDeduplication] = useState(true);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      rows,
      setRows,
      enableDeduplication,
      setEnableDeduplication,
      sourceFileName,
      setSourceFileName,
      reset: () => {
        setRows([]);
        setEnableDeduplication(true);
        setSourceFileName(null);
      },
    }),
    [rows, enableDeduplication, sourceFileName]
  );

  return (
    <ImportReviewContext.Provider value={value}>
      {children}
    </ImportReviewContext.Provider>
  );
};

export const useImportReview = (): ImportReviewContextValue => {
  const context = useContext(ImportReviewContext);
  if (!context) {
    throw new Error("useImportReview 必须在 ImportReviewProvider 内使用");
  }
  return context;
};

export const createEmptyDraftRow = (): TransactionDraftRow => ({
  ...emptyRow,
  __isNew: true,
  __editableCells: {},
});
