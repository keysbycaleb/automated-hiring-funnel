import React from 'react';

// This component renders a non-interactive preview of the application form.
export default function ApplicantFormPreview({ sections = [], companyName = "Your Company" }) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg border">
      <div className="max-w-4xl w-full bg-white p-8 rounded-lg shadow-md mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">{companyName} Application</h1>
        <form>
          {sections.map(section => (
            <div key={section.id} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-700 border-b-2 pb-2 mb-6">{section.title}</h2>
              {section.questions.map(q => (
                <div key={q.id} className="mb-6">
                  <label className="block text-lg font-medium text-gray-700 mb-2">{q.question}</label>
                  { (q.type === 'radio' || q.type === 'checkbox-group') && q.options.map(opt => (
                    <div key={opt.value} className="flex items-center mb-2">
                      <input
                        type={q.type === 'radio' ? 'radio' : 'checkbox'}
                        id={`preview-${q.id}-${opt.value}`}
                        name={`preview-${q.id}`}
                        value={opt.value}
                        disabled // This is the key difference
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor={`preview-${q.id}-${opt.value}`} className="ml-3 block text-sm text-gray-700">
                        {opt.value}
                      </label>
                    </div>
                  ))}
                  { (q.type === 'long-text-ai') && (
                    <textarea
                      rows="4"
                      disabled
                      placeholder="Applicant will type their long-form answer here..."
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    ></textarea>
                  )}
                  { (q.type === 'short-text') && (
                      <input
                          type="text"
                          disabled
                          placeholder="Applicant will type their short answer here..."
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                      />
                  )}
                </div>
              ))}
            </div>
          ))}
          <button
            type="button" // Change type to button to prevent form submission
            disabled
            className="w-full bg-blue-400 text-white font-bold py-3 px-4 rounded-lg cursor-not-allowed"
          >
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
}
