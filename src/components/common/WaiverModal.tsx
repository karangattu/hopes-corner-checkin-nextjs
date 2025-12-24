'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface Waiver {
  id: string;
  name: string;
  description: string;
  required: boolean;
  signedAt: string | null;
}

interface WaiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (waivers: string[]) => Promise<void>;
  waivers: Waiver[];
}

export function WaiverModal({ isOpen, onClose, onSign, waivers }: WaiverModalProps) {
  const [signed, setSigned] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const requiredWaivers = waivers.filter((w) => w.required);
  const allRequiredSigned = requiredWaivers.every((w) => signed.has(w.id));

  const handleSign = async () => {
    setIsSubmitting(true);
    try {
      await onSign(Array.from(signed));
      setSigned(new Set());
      onClose();
    } catch (error) {
      console.error('Failed to sign waivers:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Service Waivers</h2>
            <p className="text-sm text-gray-500 mt-1">
              Please review and sign the required waivers before proceeding
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Waivers List */}
        <div className="p-6 space-y-4">
          {waivers.map((waiver) => {
            const isSigned = signed.has(waiver.id);
            const isRequired = waiver.required;
            const alreadySigned = waiver.signedAt;

            return (
              <div
                key={waiver.id}
                className={`border rounded-lg p-4 transition-colors ${
                  isSigned || alreadySigned
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{waiver.name}</h3>
                      {isRequired && (
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded">
                          Required
                        </span>
                      )}
                      {alreadySigned && (
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded flex items-center gap-1">
                          <CheckCircle size={12} />
                          Signed {new Date(alreadySigned).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{waiver.description}</p>
                  </div>

                  {!alreadySigned && (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={isSigned}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSigned((prev) => new Set([...prev, waiver.id]));
                          } else {
                            setSigned((prev) => {
                              const next = new Set(prev);
                              next.delete(waiver.id);
                              return next;
                            });
                          }
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-emerald-600 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700">I agree</span>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Message */}
        {requiredWaivers.length > 0 && !allRequiredSigned && (
          <div className="px-6 py-4 bg-amber-50 border-t border-amber-200 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              You must agree to all required waivers to continue.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={!allRequiredSigned || isSubmitting}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isSubmitting ? 'Signing...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
