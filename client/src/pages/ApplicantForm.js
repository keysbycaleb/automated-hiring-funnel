import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy, doc, getDoc } from 'firebase/firestore';

export default function ApplicantForm() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [questionnaireSettings, setQuestionnaireSettings] = useState({ pointsThreshold: 0 });
  const [allQuestions, setAllQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('loading');
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleChange = (questionId, value, questionType, event) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      if (questionType === 'checkbox-group' || questionType === 'matrix') {
        const currentOptions = newAnswers[questionId] || {};
        newAnswers[questionId] = { ...currentOptions, [value]: event.target.checked };
      } else if (questionType === 'radio') {
        newAnswers[questionId] = value;
      } else if (questionType === 'ranking') {
        const currentRanks = newAnswers[questionId] || {};
        Object.keys(currentRanks).forEach(item => {
            if (currentRanks[item] === event.target.value) currentRanks[item] = null;
        });
        newAnswers[questionId] = { ...currentRanks, [value]: event.target.value };
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
            const settingsDoc = doc(db, `users/${userId}/questionnaireSettings`, 'main');

            const [sectionsSnapshot, questionsSnapshot, settingsSnapshot] = await Promise.all([ 
                getDocs(sectionsQuery), 
                getDocs(questionsQuery),
                getDoc(settingsDoc)
            ]);

            if (settingsSnapshot.exists()) {
                setQuestionnaireSettings(settingsSnapshot.data());
            }

            const sectionsData = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), questions: [] }));
            const questionsData = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setAllQuestions(questionsData);

            const questionsMap = new Map();
            questionsData.forEach(q => {
                if (!questionsMap.has(q.sectionId)) questionsMap.set(q.sectionId, []);
                questionsMap.get(q.sectionId).push(q);
            });

            sectionsData.forEach(section => {
                section.questions = questionsMap.get(section.id) || [];
            });

            setSections(sectionsData);
            if (sectionsData.length > 0) setStatus('loaded');
            else setStatus('no-questions');
        } catch (error) {
            console.error("Error fetching questionnaire: ", error);
            setStatus('error');
        }
    };
    fetchQuestionnaire();
  }, [userId]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasSignatureBlock = sections.flatMap(s => s.questions).some(q => q.type === 'signature-block' && q.required);
    if (hasSignatureBlock && (!signature || !agreed)) {
        alert("Please sign and agree to the terms before submitting.");
        return;
    }
    setStatus('submitting');
    try {
        let score = 0;
        for (const questionId in answers) {
            const question = allQuestions.find(q => q.id === questionId);
            if (!question || !question.options) continue;

            const answerValue = answers[questionId];
            if (question.type === 'radio') {
                const choice = question.options.find(opt => opt.value === answerValue);
                if (choice && choice.points) score += Number(choice.points);
            } else if (question.type === 'checkbox-group') {
                for (const optionKey in answerValue) {
                    if (answerValue[optionKey]) {
                        const choice = question.options.find(opt => opt.value === optionKey);
                        if (choice && choice.points) score += Number(choice.points);
                    }
                }
            }
        }

      let resumeUrl = '';
      if (file) {
        const storageRef = ref(storage, `resumes/${userId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        resumeUrl = await getDownloadURL(snapshot.ref);
      }
      
      // --- THIS IS THE CHANGED SECTION ---
      // Extract name and email using the hardcoded IDs from the contact section
      const applicantName = answers['contact-name'] || 'N/A';
      const applicantEmail = answers['contact-email'] || 'N/A';

      await addDoc(collection(db, `users/${userId}/applicants`), {
        name: applicantName,
        email: applicantEmail,
        answers,
        resumeUrl,
        signature,
        score, // Changed from totalScore to score
        submittedAt: serverTimestamp(),
        status: 'New'
      });
      
      if (score >= (questionnaireSettings.pointsThreshold || 0)) {
        navigate('/schedule-interview', { state: { questionnaireOwnerId: userId } });
      } else {
        navigate('/application-submitted');
      }

    } catch (error) {
      console.error("Error submitting application: ", error);
      setStatus('error');
    }
  };
  
  if (status === 'loading') return <div className="p-8 text-center">Loading form...</div>;
  if (status === 'error') return <div className="p-8 text-center text-red-500">Could not load application form. Please check the URL and try again.</div>;
  if (status === 'no-questions') return <div className="p-8 text-center text-gray-500">This application form has no questions yet.</div>;
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white p-8 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          {sections.map(section => (
            <div key={section.id} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-700 border-b-2 pb-2 mb-6">{section.title}</h2>
              {section.questions.map(q => (
                <div key={q.id} className="mb-6">
                  { !['description', 'signature-block'].includes(q.type) && <label className="block text-lg font-medium text-gray-700 mb-2">{q.question}{q.required && <span className="text-red-500 ml-1">*</span>}</label> }
                  
                  { q.type === 'description' && <p className="text-gray-600 mb-4">{q.description}</p> }
                  { q.type === 'signature-block' && (
                    <div>
                        <p className="text-sm text-gray-600 mb-4">{q.agreementText}</p>
                        <div className="mb-4">
                            <label className="block text-lg font-medium text-gray-700 mb-2">Electronic Signature {q.required && <span className="text-red-500 ml-1">*</span>}</label>
                            <input type="text" required={q.required} value={signature} onChange={e => setSignature(e.target.value)} placeholder="Type your full name to sign" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-serif"/>
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" id={`agree-${q.id}`} required={q.required} checked={agreed} onChange={e => setAgreed(e.target.checked)} className="h-4 w-4"/>
                            <label htmlFor={`agree-${q.id}`} className="ml-2 text-gray-700">{q.checkboxLabel}</label>
                        </div>
                    </div>
                  )}

                  { q.type === 'file-upload' && <input type="file" id={q.id} onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/> }
                  { (q.type === 'radio' || q.type === 'checkbox-group') && q.options.map(opt => (
                    <div key={opt.value} className="flex items-center mb-2">
                      <input type={q.type === 'radio' ? 'radio' : 'checkbox'} id={`${q.id}-${opt.value}`} name={q.id} value={opt.value} onChange={e => handleChange(q.id, opt.value, q.type, e)} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                      <label htmlFor={`${q.id}-${opt.value}`} className="ml-3 block text-sm text-gray-700">{opt.value}</label>
                    </div>
                  ))}
                  { (q.type === 'long-text-ai' || q.type === 'long-text') && <textarea id={q.id} rows="4" onChange={e => handleChange(q.id, null, q.type, e)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea> }
                  { q.type === 'short-text' && <input type="text" id={q.id} onChange={e => handleChange(q.id, null, q.type, e)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/> }
                  { q.type === 'matrix' && (
                    <table className="w-full mt-2 border-collapse">
                        <thead><tr><th className="border p-2 bg-gray-50"></th>{q.columns.map(c => <th key={c.label} className="border p-2 text-sm bg-gray-50">{c.label}</th>)}</tr></thead>
                        <tbody>{q.rows.map(row => (<tr key={row}><td className="border p-2 font-semibold">{row}</td>{q.columns.map(col => (<td key={col.label} className="border p-2 text-center"><input type="checkbox" onChange={e => handleChange(q.id, `${row} - ${col.label}`, q.type, e)} className="h-5 w-5"/></td>))}</tr>))}</tbody>
                    </table>
                  )}
                  { q.type === 'ranking' && (
                    <div className="space-y-3 mt-2">
                        {q.options.map(opt => (
                            <div key={opt} className="flex items-center space-x-4">
                                <label className="w-1/2">{opt}</label>
                                <select onChange={e => handleChange(q.id, opt, q.type, e)} value={(answers[q.id] && answers[q.id][opt]) || ''} className="block w-1/2 p-2 border border-gray-300 rounded-md shadow-sm">
                                    <option value="">Select rank...</option>
                                    {q.options.map((_, index) => ( <option key={index + 1} value={index + 1}>{index + 1}</option> ))}
                                </select>
                            </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          <button type="submit" disabled={status === 'submitting'} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-blue-300">
            {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
