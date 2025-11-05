import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en' : 'zh-CN';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
      title="Switch Language"
    >
      <Languages className="w-6 h-5 text-gray-600" />
      <span className="text-xs font-medium text-gray-700 w-6">
        {i18n.language === 'zh-CN' ? 'EN' : '中文'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
