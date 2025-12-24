'use client';

import { useState } from 'react';
import { X, AlertTriangle, Clock } from 'lucide-react';

interface BanGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBan: (reason: string, duration: string) => Promise<void>;
  guestName: string;
}

const DURATION_OPTIONS = [
  { id: '1d', label: '1 Day', hours: 24 },
  { id: '1w', label: '1 Week', hours: 168 },
  { id: 'permanent', label: 'Permanent', hours: 0 },
];

export function BanGuestModal({ isOpen, onClose, onBan, guestName }: BanGuestModalProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('1d');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for the ban');
      return;
    }

    setIsSubmitting(true);
    try {
      await onBan(reason, duration);
      setReason('');
      setDuration('1d');
      onClose();
    } catch (error) {
      console.error('Failed to ban guest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl max-w-md w-full m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Ban Guest</h2>
              <p className="text-sm text-gray-500">{guestName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">
              Banning a guest will prevent them from accessing services.
            </p>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Ban <span className="text-red-600">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Violation of house rules, unsafe behavior, aggressive conduct..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            />
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock size={16} />
              Ban Duration
            </label>
            <div className="space-y-2">
              {DURATION_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    duration === option.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="duration"
                    value={option.id}
                    checked={duration === option.id}
                    onChange={(e) => setDuration(e.target.value)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="font-medium text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Banning...' : 'Ban Guest'}
          </button>
        </div>
      </div>
    </div>
  );
}
