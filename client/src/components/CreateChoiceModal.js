import React from 'react';
import { XMarkIcon, PencilIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';

export default function CreateChoiceModal({ isOpen, onClose, onChoice, canCreateQuestion }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-large shadow-2xl p-8 w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">What would you like to create?</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="space-y-4">
            <button 
                onClick={() => onChoice('section')}
                className="w-full flex items-center text-left p-4 border border-gray-300 rounded-medium hover:bg-gray-100 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
                <RectangleGroupIcon className="h-8 w-8 text-gray-500 mr-4"/>
                <div>
                    <p className="font-semibold text-gray-800">New Section</p>
                    <p className="text-sm text-gray-500">Add a new container to group your questions.</p>
                </div>
            </button>
            <button 
                onClick={() => onChoice('question')}
                disabled={!canCreateQuestion}
                className="w-full flex items-center text-left p-4 border border-gray-300 rounded-medium hover:bg-gray-100 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-300"
            >
                <PencilIcon className="h-8 w-8 text-gray-500 mr-4"/>
                <div>
                    <p className="font-semibold text-gray-800">New Question</p>
                    <p className="text-sm text-gray-500">Add a new question to an existing section.</p>
                </div>
            </button>
        </div>

      </div>
    </div>
  );
}
