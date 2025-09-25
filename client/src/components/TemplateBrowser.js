import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function TemplateBrowser({ isOpen, onClose, onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchTemplates = async () => {
        setLoading(true);
        try {
          const querySnapshot = await getDocs(collection(db, 'questionTemplates'));
          const templatesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTemplates(templatesData);
        } catch (error) {
          console.error("Error fetching templates: ", error);
        } finally {
          setLoading(false);
        }
      };
      fetchTemplates();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-3xl shadow-lg rounded-2xl bg-white">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <div className="mt-3 text-center">
          <h3 className="text-2xl font-bold text-gray-900">Choose a Template</h3>
          <p className="text-md text-gray-500 mt-2">Get started quickly with a pre-built set of questions for common roles.</p>
          <div className="mt-6">
            {loading ? (
              <p>Loading templates...</p>
            ) : (
              <div className="space-y-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg text-left hover:bg-gray-50 hover:shadow-md cursor-pointer transition-all"
                    onClick={() => onSelectTemplate(template.id)}
                  >
                    <h4 className="font-bold text-lg text-blue-600">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
