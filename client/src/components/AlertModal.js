import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AlertModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full m-4">
        <div className="flex flex-col items-center text-center">
            <div className="bg-yellow-100 p-3 rounded-full mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
            <div className="text-gray-600">
                {children}
            </div>
            <div className="mt-8">
                <button
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors duration-200"
                >
                    OK
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
