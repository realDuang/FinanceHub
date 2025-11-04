import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import CashFlowAnalysis from "./pages/CashFlowAnalysis";
import BalanceSheet from "./pages/BalanceSheet";
import Navigation from "./components/Navigation";
import TransactionImportReview from "./pages/TransactionImportReview";
import { ImportReviewProvider } from "./context/ImportReviewContext";
import InvestmentDashboard from "./pages/InvestmentDashboard";
import LanguageSwitcher from "./components/LanguageSwitcher";

function App() {
  const { t } = useTranslation();

  return (
    <ImportReviewProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Top Navigation Bar */}
          <nav className="bg-white shadow-lg border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                {/* Logo and Title */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {t('app.title')}
                    </h1>
                    <p className="text-sm text-gray-500 -mt-1">
                      {t('app.subtitle')}
                    </p>
                  </div>
                </div>

                {/* Navigation and Language Switcher */}
                <div className="flex items-center space-x-4">
                  <Navigation />
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </nav>

          {/* Page Content */}
          <main>
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/balance-sheet" replace />}
              />
              <Route path="/balance-sheet/*" element={<BalanceSheet />} />
              <Route
                path="/cash-flow-analysis/*"
                element={<CashFlowAnalysis />}
              />
              <Route
                path="/investment-dashboard"
                element={<InvestmentDashboard />}
              />
              <Route
                path="/transaction-import/review"
                element={<TransactionImportReview />}
              />
            </Routes>
          </main>
        </div>
      </Router>
    </ImportReviewProvider>
  );
}

export default App;
