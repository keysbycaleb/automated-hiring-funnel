import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // New import
import moment from 'moment';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function AllApplicants() {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('All Applicants');
    const { currentUser } = useAuth(); // Get current user
    const queryParams = useQuery();
    const filter = queryParams.get('filter');

    useEffect(() => {
        const fetchApplicants = async () => {
            if (!currentUser) return; // Don't fetch if no user
            setLoading(true);
            try {
                const applicantsCollection = collection(db, `users/${currentUser.uid}/applicants`);
                let applicantsQuery;

                if (filter === 'new') {
                    setTitle('New Applicants (Last 7 Days)');
                    const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                    applicantsQuery = query(applicantsCollection, where("submittedAt", ">=", sevenDaysAgo), orderBy('submittedAt', 'desc'));
                } else if (filter === 'interview') {
                    setTitle('Interviews Scheduled');
                    applicantsQuery = query(applicantsCollection, where("status", "==", "Interview Scheduled"), orderBy('submittedAt', 'desc'));
                } else if (filter === 'highscore') {
                    setTitle('High Scores (Top 10%)');
                    const totalSnapshot = await getDocs(applicantsCollection);
                    const totalApplicants = totalSnapshot.size;
                    const limitCount = Math.max(1, Math.ceil(totalApplicants * 0.1));
                    applicantsQuery = query(applicantsCollection, orderBy('score', 'desc'), limit(limitCount));
                } else {
                    setTitle('All Applicants');
                    applicantsQuery = query(applicantsCollection, orderBy('submittedAt', 'desc'));
                }

                const querySnapshot = await getDocs(applicantsQuery);
                const applicantsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    submittedAt: doc.data().submittedAt?.toDate ? doc.data().submittedAt.toDate() : new Date()
                }));
                setApplicants(applicantsData);
            } catch (error) {
                console.error("Error fetching applicants: ", error);
            }
            setLoading(false);
        };

        fetchApplicants();
    }, [filter, currentUser]);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">{title}</h1>
            {loading ? (
                <p>Loading applicants...</p>
            ) : applicants.length === 0 ? (
                <p>No applicants found for this category.</p>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Applied On
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Score
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {applicants.map(applicant => (
                                <tr key={applicant.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <Link to={`/applicant/${applicant.id}`} className="text-blue-600 hover:text-blue-900 font-semibold">
                                            {applicant.answers?.fullName || 'N/A'}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {moment(applicant.submittedAt).format('MMMM Do, YYYY')}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                                            <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                                            <span className="relative">{applicant.score || 'N/A'}</span>
                                        </span>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {applicant.status || 'New'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
