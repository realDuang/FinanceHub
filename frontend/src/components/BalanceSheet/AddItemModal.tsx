import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AssetItem, LiabilityItem } from '../../pages/types';

interface AddItemModalProps {
  type: 'asset' | 'liability';
  onAdd: (item: Omit<AssetItem | LiabilityItem, 'id'>) => void;
  onClose: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ type, onAdd, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    category: 'current' as 'current' | 'non-current'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.value) return;
    
    onAdd({
      name: formData.name,
      value: parseFloat(formData.value),
      category: formData.category
    });
  };

  const assetCurrentOptions = [
    { value: 'current', label: '流动资产', description: '现金、存款、投资等可快速变现的资产' },
    { value: 'non-current', label: '非流动资产', description: '房产、车辆等长期持有的资产' }
  ];

  const liabilityCurrentOptions = [
    { value: 'current', label: '流动负债', description: '信用卡债务、短期借款等' },
    { value: 'non-current', label: '非流动负债', description: '房贷、车贷等长期债务' }
  ];

  const options = type === 'asset' ? assetCurrentOptions : liabilityCurrentOptions;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className={`px-6 py-4 border-b border-slate-200 ${type === 'asset' ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${type === 'asset' ? 'text-green-700' : 'text-red-700'}`}>
              添加{type === 'asset' ? '资产' : '负债'}项目
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {type === 'asset' ? '资产' : '负债'}名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={type === 'asset' ? '如：银行存款、房产等' : '如：信用卡债务、房贷等'}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              金额 (¥)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              分类
            </label>
            <div className="space-y-3">
              {options.map(option => (
                <label key={option.value} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={option.value}
                    checked={formData.category === option.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as 'current' | 'non-current' }))}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-slate-700">{option.label}</div>
                    <div className="text-sm text-slate-500 mt-1">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors ${
                type === 'asset'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;