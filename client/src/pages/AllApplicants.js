import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // Import the Link component

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
        return <div className="p-4">Loading applicants...</div>;
    }

    const getApplicantInfo = (answers) => {
        let name = 'N/A';
        let email = 'N/A';
        for (const questionId in answers) {
            if (questionId.toLowerCase().includes('name')) {
                name = answers[questionId];
            }
            if (questionId.toLowerCase().includes('email')) {
                email = answers[questionId];
            }
        }
        return { name, email };
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">All Applicants</h1>
            {applicants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {applicants.map(applicant => {
                        const { name, email } = getApplicantInfo(applicant.answers);
                        return (
                            // UPDATED: Wrap the card in a Link component
                            <Link to={`/applicant/${applicant.id}`} key={applicant.id} className="block border p-4 rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
                                <h2 className="text-xl font-semibold">{name}</h2>
                                <p className="text-gray-600">{email}</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Submitted: {applicant.submittedAt?.toDate().toLocaleDateString()}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <p>No applicants found.</p>
            )}
        </div>
    );
};

export default AllApplicants;
