import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { ArrowUturnLeftIcon, ComputerDesktopIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

export default function QuestionnairePreview() {
    const { currentUser } = useAuth();
    const { profile } = useProfile();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('desktop');

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                setLoading(false);
                setError("You must be logged in to preview a questionnaire.");
                return;
            }
            try {
                setLoading(true);
                const sectionsQuery = query(collection(db, `users/${currentUser.uid}/sections`), orderBy('order', 'asc'));
                const questionsQuery = query(collection(db, `users/${currentUser.uid}/questionnaire`), orderBy('order', 'asc'));
                
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
    }, [currentUser]);

    const renderQuestion = (q) => {
        const commonProps = {
            id: q.id,
            name: q.id,
            disabled: true,
            className: "mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
        };

        switch (q.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'short-text':
                return <input type="text" {...commonProps} placeholder="Answer goes here..." />;
            case 'long-text':
            case 'long-text-ai':
                return <textarea rows="4" {...commonProps} placeholder="Detailed answer goes here..." />;
            case 'radio':
                return <div className="mt-2 space-y-2">{q.options.map(opt => <div key={opt.value} className="flex items-center"><input type="radio" name={q.id} value={opt.value} disabled className="h-4 w-4" /><label className="ml-3 text-gray-700">{opt.label || opt.value}</label></div>)}</div>;
            case 'checkbox-group':
                return <div className="mt-2 space-y-2">{q.options.map(opt => <div key={opt.value} className="flex items-center"><input type="checkbox" name={q.id} value={opt.value} disabled className="h-4 w-4 rounded" /><label className="ml-3 text-gray-700">{opt.label || opt.value}</label></div>)}</div>;
            default:
                return <p className="text-red-500">Unknown question type</p>;
        }
    };

    return (
        <>
            {/* --- THIS IS THE ONLY CHANGED LINE --- */}
            <div className="sticky top-0 bg-white text-gray-800 shadow-md z-10 border-b">
                <div className="max-w-7xl mx-auto p-4 flex justify-between items-center relative">
                    <div className="w-1/3"></div>
                    <div className="w-1/3 text-center">
                        <h1 className="text-lg font-bold">Preview Mode</h1>
                    </div>
                    <div className="w-1/3 flex justify-end">
                        <Link to="/questionnaire" className="bg-gray-100 text-gray-800 hover:bg-gray-200 font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center">
                            <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                            Back to Builder
                        </Link>
                    </div>
                </div>
            </div>
            <div className="bg-gray-100 min-h-screen py-10">
                
                <div className="max-w-4xl mx-auto mb-6 flex justify-center">
                    <div className="flex items-center space-x-2 p-1 bg-white rounded-lg shadow-sm border">
                        <button
                            onClick={() => setViewMode('desktop')}
                            className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'desktop' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                            aria-label="Desktop view"
                        >
                            <ComputerDesktopIcon className="h-6 w-6" />
                        </button>
                        <button
                            onClick={() => setViewMode('mobile')}
                            className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'mobile' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                            aria-label="Mobile view"
                        >
                            <DevicePhoneMobileIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                
                <div className={`mx-auto transition-all duration-300 ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-4xl'}`}>
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <header className="mb-8 border-b pb-4">
                            <h1 className="text-4xl font-bold text-gray-800">{profile?.companyName || 'Job Application'}</h1>
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
                                                    <label htmlFor={q.id} className="block text-md font-medium text-gray-800">{q.question}{q.required && <span className="text-red-500 ml-1">*</span>}</label>
                                                    {renderQuestion(q)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-10 text-center">
                                    <button type="submit" disabled className="w-full bg-gray-400 text-white font-bold py-3 px-6 rounded-md cursor-not-allowed">
                                        Submission Disabled in Preview
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

