import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const AllApplicants = () => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchApplicants = async () => {
            if (currentUser) {
                try {
                    setLoading(true);
                    const applicantsPath = `users/${currentUser.uid}/applicants`;
                    const applicantsRef = collection(db, applicantsPath);
                    const q = query(applicantsRef, orderBy("submittedAt", "desc"));
                    
                    const querySnapshot = await getDocs(q);
                    const applicantsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setApplicants(applicantsData);
                } catch (error) {
                    console.error("Error fetching applicants: ", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchApplicants();
    }, [currentUser]);

    if (loading) {
        return <div className="p-8 text-center">Loading applicants...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">All Applicants</h1>
            {applicants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applicants.map(applicant => (
                        <Link to={`/applicant/${applicant.id}`} key={applicant.id} className="group block bg-white border p-6 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-500 transition-all duration-300">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{applicant.name || 'No Name'}</h2>
                                    <p className="text-gray-600">{applicant.email || 'No Email'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Score</p>
                                    <p className="text-2xl font-bold text-blue-600">{applicant.score ?? 'N/A'}</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">
                                Submitted: {applicant.submittedAt?.toDate().toLocaleDateString()}
                            </p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-gray-500">No applicants found yet.</p>
                </div>
            )}
        </div>
    );
};

export default AllApplicants;
