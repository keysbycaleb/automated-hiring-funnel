import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';

export default function ApplicantForm() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(collection(db, "questionnaire"), orderBy("order"));
        const querySnapshot = await getDocs(q);
        const questionData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const initialAnswers = {};
        questionData.forEach(question => {
          initialAnswers[question.id] = question.type.includes('group') ? {} : '';
        });

        setAnswers(initialAnswers);
        setQuestions(questionData);
        setStatus('idle');
      } catch (err) {
        console.error("Error fetching questionnaire:", err);
        setStatus('error');
      }
    };
    fetchQuestions();
  }, []);

  const handleChange = (questionId, optionValue, questionType, event) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      if (questionType === 'checkbox-group') {
        const currentOptions = newAnswers[questionId] || {};
        newAnswers[questionId] = { ...currentOptions, [optionValue]: !currentOptions[optionValue] };
      } else if (questionType === 'long-text-ai') {
        newAnswers[questionId] = event.target.value;
      } else {
        newAnswers[questionId] = { ...newAnswers[questionId], [optionValue]: event.target.value };
      }
      return newAnswers;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await addDoc(collection(db, 'applicants'), {
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
    switch (q.type) {
      case 'text-group':
        return q.options.map(opt => (
          <div key={opt.value}>
            <label htmlFor={opt.value} className="block text-sm font-medium text-gray-700">{opt.text}</label>
            <input type="text" id={opt.value} required={opt.required}
              onChange={(e) => handleChange(q.id, opt.value, q.type, e)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        ));
      case 'checkbox-group':
        return q.options.map(opt => (
          <label key={opt.value} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
            <input type="checkbox"
              onChange={() => handleChange(q.id, opt.value, q.type, null)}
              className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span>{opt.text}</span>
          </label>
        ));
      case 'long-text-ai': // New case for our AI question type
        return (
           <textarea
              rows="8"
              onChange={(e) => handleChange(q.id, null, q.type, e)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Please provide a detailed response..."
            />
        );
      default:
        return <p>Unsupported question type.</p>;
    }
  };

  if (status === 'loading') return <div className="text-center p-12">Loading Application...</div>;
  if (status === 'success') return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg p-8 space-y-4 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-green-600">Thank You!</h1>
        <p className="text-gray-700">Your application has been received.</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center py-12">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800">Join the McDonald's Team!</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map(q => (
            <fieldset key={q.id}>
              <legend className="text-xl font-semibold text-gray-900">{q.questionText}</legend>
              <div className="space-y-2 border p-4 rounded-md mt-2">
                {renderQuestion(q)}
              </div>
            </fieldset>
          ))}
          <button type="submit" disabled={status === 'submitting'} className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400">
            {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
          </button>
          {status === 'error' && <p className="text-red-500 text-center">Something went wrong. Please try again.</p>}
        </form>
      </div>
    </div>
  );
}