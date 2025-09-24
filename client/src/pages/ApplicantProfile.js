import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const formatKey = (key) => {
  return key.replace(/_/g, ' ').replace(/q /g, '').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function ApplicantProfile() {
  const { id } = useParams();
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicant = async () => {
      if (id) {
        try {
          const docRef = doc(db, 'applicants', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setApplicant(docSnap.data());
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching document:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchApplicant();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading applicant data...</div>;
  if (!applicant) return <div className="p-8 text-center text-red-500">Could not find applicant data.</div>;

  const { name, email } = applicant.answers?.q_info || {};
  const rejectionEmail = `mailto:${email}?subject=Update on your McDonald's Application&body=Dear ${name},%0D%0A%0D%0AThank you for your interest...`;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Applicant Profile</h1>
      <div className="bg-white p-6 rounded-large shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">{name || 'N/A'}</h2>
        <p><strong>Email:</strong> {email || 'N/A'}</p>
        <p><strong>Final Score:</strong> <span className="font-bold text-blue-600">{applicant.score}</span> (Manual: {applicant.manualScore})</p>
        <p><strong>Status:</strong> {applicant.status}</p>
      </div>

      {applicant.aiAnalysis && Object.keys(applicant.aiAnalysis).length > 0 && (
        <div className="bg-white p-6 rounded-large shadow-md mb-8">
          <h3 className="text-xl font-bold mb-4">AI Analysis</h3>
          {Object.entries(applicant.aiAnalysis).map(([questionId, traits]) => (
            <div key={questionId} className="mb-4">
              <h4 className="font-semibold text-gray-700">Behavioral Question Analysis:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {Object.entries(traits).map(([trait, score]) => (
                  <div key={trait} className="bg-gray-100 p-3 rounded-large">
                    <p className="font-semibold text-sm text-gray-600">{formatKey(trait)}</p>
                    <p className="font-bold text-lg text-gray-800">{score} / 10</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white p-6 rounded-large shadow-md">
        <h3 className="text-xl font-bold mb-4">Full Application Answers</h3>
        {Object.entries(applicant.answers).map(([key, value]) => (
          <div key={key} className="border-t py-4">
            <p className="font-bold text-gray-700">{formatKey(key)}</p>
            {typeof value === 'object' && value !== null ? (
              <ul className="list-disc list-inside mt-2">
                {Object.entries(value).map(([subKey, subValue]) => (
                  subValue && <li key={subKey} className="text-gray-600">{formatKey(subKey)}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-800 mt-1">{value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex space-x-4">
        <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-medium transition-colors duration-200">
          Manually Schedule Interview
        </button>
        <a 
          href={rejectionEmail} 
          className="bg-transparent hover:bg-red-600 text-red-600 hover:text-white font-bold py-3 px-6 border border-red-600 rounded-medium transition-colors duration-200"
        >
          Reject Application
        </a>
      </div>
    </div>
  );
}
