import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid'; // Import a new icon

export default function ApplicantProfile() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const [applicant, setApplicant] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplicantData = async () => {
            if (!currentUser || !id) return;
            setLoading(true);
            try {
                const applicantPath = `users/${currentUser.uid}/applicants/${id}`;
                const applicantRef = doc(db, applicantPath);
                const applicantSnap = await getDoc(applicantRef);

                if (applicantSnap.exists()) {
                    setApplicant(applicantSnap.data());
                } else {
                    console.error("No such applicant found!");
                }

                const questionsPath = `users/${currentUser.uid}/questionnaire`;
                const questionsQuery = query(collection(db, questionsPath), orderBy("order"));
                const questionsSnapshot = await getDocs(questionsQuery);
                const questionsData = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setQuestions(questionsData);

            } catch (error) {
                console.error("Error fetching applicant data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplicantData();
    }, [currentUser, id]);

    if (loading) {
        return <div className="p-8 text-center">Loading applicant profile...</div>;
    }

    if (!applicant) {
        return <div className="p-8 text-center">Applicant not found.</div>;
    }

    const questionsMap = new Map(questions.map(q => [q.id, q]));
    const aiAnalysis = applicant.aiAnalysis || {};
    const otherAnswers = { ...applicant.answers };
    Object.keys(aiAnalysis).forEach(qid => delete otherAnswers[qid]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Interview': return 'bg-green-100 text-green-800';
            case 'Review': return 'bg-yellow-100 text-yellow-800';
            case 'New': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">{applicant.name || 'N/A'}</h1>
                        <p className="text-lg text-gray-500">{applicant.email || 'No email provided'}</p>
                        <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(applicant.status)}`}>
                            Status: {applicant.status || 'N/A'}
                        </span>
                        
                        {/* --- ADDED THIS BLOCK FOR THE RESUME BUTTON --- */}
                        {applicant.resumeUrl && (
                            <div className="mt-4">
                                <a
                                    href={applicant.resumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                    Download Resume
                                </a>
                            </div>
                        )}
                        {/* --- END OF ADDED BLOCK --- */}

                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 text-lg">Overall Score</p>
                        <p className="text-5xl font-bold text-blue-600">{applicant.score ?? 'N/A'}</p>
                    </div>
                </div>
            </div>

            {Object.keys(aiAnalysis).length > 0 && (
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">AI Analysis</h2>
                    <div className="space-y-6">
                        {Object.entries(aiAnalysis).map(([questionId, analysis]) => (
                            <div key={questionId} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                                <h3 className="font-bold text-xl text-gray-900 mb-1">{questionsMap.get(questionId)?.question}</h3>
                                <p className="text-gray-600 mb-4 italic p-3 bg-gray-50 rounded-lg">"{applicant.answers[questionId]}"</p>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                                    <div className="space-y-2 text-sm">
                                        <h4 className="font-semibold text-lg text-gray-700 mb-2">Justification</h4>
                                        {analysis.analysis && Object.entries(analysis.analysis).map(([trait, justification]) => (
                                            <div key={trait}>
                                                <strong className="capitalize">{trait.replace(/_/g, ' ')}:</strong>
                                                <p className="text-gray-600">{justification}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 lg:mt-0">
                                        <h4 className="font-semibold text-lg text-gray-700 mb-2">Trait Scores</h4>
                                        <ul className="space-y-2">
                                            {analysis.trait_scores && Object.entries(analysis.trait_scores).map(([trait, score]) => (
                                                <li key={trait} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                                    <span className="capitalize text-gray-800 font-medium">{trait.replace(/_/g, ' ')}</span>
                                                    <span className="font-bold text-lg text-blue-600">{score} / {questionsMap.get(questionId)?.points || 'N/A'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {analysis.confidence_score && (
                                            <div className="mt-4 text-center">
                                                <p className="text-sm text-gray-500">Analysis Confidence</p>
                                                <p className="font-bold text-xl text-gray-800">{analysis.confidence_score} / 10</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {Object.keys(otherAnswers).length > 0 && (
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Additional Answers</h2>
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                        <ul className="space-y-4">
                            {Object.entries(otherAnswers).map(([questionId, answer]) => (
                                <li key={questionId}>
                                    <p className="font-semibold text-gray-800 mb-1">{questionsMap.get(questionId)?.question || "N/A"}</p>
                                    <p className="text-gray-600 pl-2 border-l-2 border-gray-300">
                                        {typeof answer === 'object' ? JSON.stringify(answer) : answer}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
