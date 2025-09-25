import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';

export default function ApplicantForm() {
  const { userId } = useParams();
  const [sections, setSections] = useState([]);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('loading');
  const [formTitle, setFormTitle] = useState("Join Our Team!");

  const handleChange = (questionId, value, questionType, event) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      if (questionType === 'checkbox-group') {
        const currentOptions = newAnswers[questionId] || {};
        newAnswers[questionId] = { ...currentOptions, [value]: event.target.checked };
      } else if (questionType === 'radio') {
        newAnswers[questionId] = value;
      } else {
        newAnswers[questionId] = event.target.value;
      }
      return newAnswers;
    });
  };

  useEffect(() => {
    const fetchQuestionnaire = async () => {
        if (!userId) {
            setStatus('error');
            return;
        }
        try {
            const sectionsQuery = query(collection(db, `users/${userId}/sections`), orderBy("order"));
            const questionsQuery = query(collection(db, `users/${userId}/questionnaire`), orderBy("order"));

            const [sectionsSnapshot, questionsSnapshot] = await Promise.all([
                getDocs(sectionsQuery),
                getDocs(questionsQuery),
            ]);

            const sectionsData = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), questions: [] }));
            const questionsData = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const questionsMap = new Map();
            questionsData.forEach(q => {
                if (!questionsMap.has(q.sectionId)) {
                    questionsMap.set(q.sectionId, []);
                }
                questionsMap.get(q.sectionId).push(q);
            });

            sectionsData.forEach(section => {
                section.questions = questionsMap.get(section.id) || [];
            });

            setSections(sectionsData);
            if (sectionsData.length > 0) {
                setStatus('loaded');
            } else {
                setStatus('no-questions');
            }
        } catch (error) {
            console.error("Error fetching questionnaire: ", error);
            setStatus('error');
        }
    };

    fetchQuestionnaire();
}, [userId]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await addDoc(collection(db, `users/${userId}/applicants`), {
        answers,
        submittedAt: serverTimestamp(),
        status: 'New'
      });
      setStatus('submitted');
    } catch (error) {
      console.error("Error submitting application: ", error);
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return <div className="p-8 text-center">Loading form...</div>;
  }

  if (status === 'error') {
    return <div className="p-8 text-center text-red-500">Could not load application form. Please check the URL and try again.</div>;
  }

  if (status === 'no-questions') {
    return <div className="p-8 text-center text-gray-500">This application form has no questions yet.</div>;
  }
  
  if (status === 'submitted') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h1>
          <p className="text-gray-600">Your application has been submitted successfully.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">{formTitle}</h1>
        <form onSubmit={handleSubmit}>
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
                        id={`${q.id}-${opt.value}`}
                        name={q.id}
                        value={opt.value}
                        onChange={e => handleChange(q.id, opt.value, q.type, e)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor={`${q.id}-${opt.value}`} className="ml-3 block text-sm text-gray-700">
                        {opt.value}
                      </label>
                    </div>
                  ))}
                  { q.type === 'long-text-ai' && (
                    <textarea
                      id={q.id}
                      rows="4"
                      onChange={e => handleChange(q.id, null, q.type, e)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    ></textarea>
                  )}
                  { q.type === 'short-text' && (
                      <input
                          type="text"
                          id={q.id}
                          onChange={e => handleChange(q.id, null, q.type, e)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                  )}
                </div>
              ))}
            </div>
          ))}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-blue-300"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
