import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

export default function QuestionnairePreview() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const sectionsQuery = query(collection(db, 'sections'), orderBy('order', 'asc'));
        const questionsQuery = query(collection(db, 'questionnaire'), orderBy('order', 'asc'));
        
        const [sectionsSnapshot, questionsSnapshot] = await Promise.all([getDocs(sectionsQuery), getDocs(questionsQuery)]);
        
        const sectionsData = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), questions: [] }));
        const questionsData = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const sectionsMap = new Map(sectionsData.map(s => [s.id, s]));
        questionsData.forEach(q => {
            if (q.sectionId && sectionsMap.has(q.sectionId)) {
                sectionsMap.get(q.sectionId).questions.push(q);
            }
        });

        setSections(Array.from(sectionsMap.values()));
      } catch (err) {
        console.error("Error fetching questionnaire for preview:", err);
        setError("Could not load the questionnaire preview. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderQuestion = (q) => {
    const commonProps = {
      id: q.id,
      name: q.id,
      disabled: true,
      className: "mt-1 block w-full p-3 border border-gray-300 rounded-medium shadow-sm bg-gray-100 cursor-not-allowed"
    };

    switch (q.type) {
      case 'text':
      case 'email':
      case 'tel':
        return <input type={q.type} {...commonProps} />;
      case 'long-text':
      case 'long-text-ai':
        return <textarea rows="4" {...commonProps} />;
      case 'radio':
        return <div className="mt-2 space-y-2">{q.options.map(opt => <div key={opt.value} className="flex items-center"><input type="radio" name={q.id} value={opt.value} disabled className="h-4 w-4 text-blue-600 border-gray-300 cursor-not-allowed" /><label className="ml-3 text-gray-700">{opt.value}</label></div>)}</div>;
      case 'checkbox-group':
        return <div className="mt-2 space-y-2">{q.options.map(opt => <div key={opt.value} className="flex items-center"><input type="checkbox" name={q.id} value={opt.value} disabled className="h-4 w-4 text-blue-600 border-gray-300 rounded-medium cursor-not-allowed" /><label className="ml-3 text-gray-700">{opt.value}</label></div>)}</div>;
      default:
        return <p className="text-red-500">Unknown question type</p>;
    }
  };

  return (
    <>
      <div className="sticky top-0 bg-blue-600 text-white shadow-md z-10">
        <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
            <h1 className="text-lg font-bold">Preview Mode</h1>
            <Link to="/questionnaire" className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-2 px-4 rounded-medium transition-colors duration-200 flex items-center">
                <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                Back to Builder
            </Link>
        </div>
      </div>
      <div className="bg-gray-100 min-h-screen py-10">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-large shadow-lg">
          <header className="mb-8 border-b pb-4">
            <h1 className="text-4xl font-bold text-gray-800">Job Application</h1>
            <p className="text-gray-500 mt-2">Please fill out the form below to the best of your ability.</p>
          </header>

          {loading && <p>Loading Preview...</p>}
          {error && <p className="text-red-600">{error}</p>}
          
          {!loading && !error && (
            <form onSubmit={(e) => e.preventDefault()}>
              {sections.map(section => (
                <div key={section.id} className="mb-10">
                  <h2 className="text-2xl font-bold text-gray-700 border-b-2 border-blue-500 pb-2 mb-6">{section.title}</h2>
                  <div className="space-y-6">
                    {section.questions.map(q => (
                      <div key={q.id}>
                        <label htmlFor={q.id} className="block text-md font-medium text-gray-800">{q.question}</label>
                        {renderQuestion(q)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-10 text-center">
                <button type="submit" disabled className="w-full bg-gray-400 text-white font-bold py-3 px-6 rounded-medium cursor-not-allowed">
                  Submission Disabled in Preview
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
