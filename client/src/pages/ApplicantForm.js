import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // New import
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';

export default function ApplicantForm() {
  const { userId } = useParams(); // Get userId from URL
  const [sections, setSections] = useState([]);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('loading');
  const [formTitle, setFormTitle] = useState("Join Our Team!"); // Placeholder

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!userId) {
        setStatus('error');
        return;
      }
      try {
        const sectionsQuery = query(collection(db, `users/${userId}/sections`), orderBy("order"));
        const questionsQuery = query(collection(db, `users/${userId}/questionnaire`), orderBy("order"));
        
        const [sectionsSnapshot, questionsSnapshot] = await Promise.all([
            getDocs(sectionsQuery), 
            getDocs(questionsSnapshot)
        ]);

        const sectionsData = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), questions: [] }));
        const questionsData = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const sectionsMap = new Map(sectionsData.map(s => [s.id, s]));
        questionsData.forEach(q => {
          if (q.sectionId && sectionsMap.has(q.sectionId)) {
            sectionsMap.get(q.sectionId).questions.push(q);
          }
        });

        const initialAnswers = {};
        questionsData.forEach(question => {
          initialAnswers[question.id] = question.type.includes('group') ? {} : '';
        });

        setAnswers(initialAnswers);
        setSections(Array.from(sectionsMap.values()));
        setStatus('idle');
      } catch (err) {
        console.error("Error fetching questionnaire:", err);
        setStatus('error');
      }
    };
    fetchQuestions();
  }, [userId]);

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


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setStatus('submitting');
    try {
      // Save applicant to the specific user's 'applicants' subcollection
      await addDoc(collection(db, `users/${userId}/applicants`), {
        answers,
        status: 'New',
        score: 0,
        submittedAt: serverTimestamp(),
      });
      setStatus('success');
    } catch (error) {
      console.error("Error adding document: ", error);
      setStatus('error');
    }
  };

  const renderQuestion = (q) => {
    // This function needs to be updated to handle all question types from the builder
    switch (q.type) {
      case 'text':
      case 'email':
      case 'tel':
        return <input type={q.type} required={q.required} onChange={(e) => handleChange(q.id, null, q.type, e)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />;
      case 'long-text':
      case 'long-text-ai':
        return <textarea rows="4" required={q.required} onChange={(e) => handleChange(q.id, null, q.type, e)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />;
      case 'radio':
        return <div className="space-y-2 mt-2">{q.options.map(opt => <label key={opt.value} className="flex items-center"><input type="radio" name={q.id} value={opt.value} required={q.required} onChange={() => handleChange(q.id, opt.value, q.type, null)} className="h-4 w-4" /><span className="ml-2">{opt.label}</span></label>)}</div>;
      case 'checkbox-group':
         return <div className="space-y-2 mt-2">{q.options.map(opt => <label key={opt.value} className="flex items-center"><input type="checkbox" value={opt.value} onChange={(e) => handleChange(q.id, opt.value, q.type, e)} className="h-4 w-4 rounded" /><span className="ml-2">{opt.label}</span></label>)}</div>;
      default:
        return <p>Unsupported question type.</p>;
    }
  };

  if (status === 'loading') return <div className="text-center p-12">Loading Application...</div>;
  if (status === 'error') return <div className="text-center p-12 text-red-600">Could not load application form. Please check the URL and try again.</div>;
  if (status === 'success') return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg p-8 space-y-4 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-green-600">Thank You!</h1>
        <p className="text-gray-700">Your application has been received.</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800">{formTitle}</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {sections.map(section => (
            <div key={section.id}>
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">{section.title}</h2>
              <div className="space-y-6">
                {section.questions.map(q => (
                  <div key={q.id}>
                    <label className="text-md font-medium text-gray-800">{q.question}{q.required && <span className="text-red-500 ml-1">*</span>}</label>
                    {renderQuestion(q)}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button type="submit" disabled={status === 'submitting'} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
            {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
