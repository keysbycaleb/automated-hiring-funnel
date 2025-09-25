import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

const getApplicantInfo = (answers) => {
    let name = 'N/A';
    let email = 'N/A';
    if (answers) {
        const nameKey = Object.keys(answers).find(k => k.toLowerCase().includes('name'));
        const emailKey = Object.keys(answers).find(k => k.toLowerCase().includes('email'));
        if (nameKey) name = answers[nameKey];
        if (emailKey) email = answers[emailKey];
    }
    return { name, email };
};

export default function Dashboard() {
    const { currentUser } = useAuth();
    const { profile, loadingProfile } = useProfile();
    const [stats, setStats] = useState({ total: 0, new: 0 });
    const [recentApplicants, setRecentApplicants] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);

    const fetchDashboardStats = useCallback(async () => {
        if (!currentUser) return;
        setLoadingStats(true);
        try {
            const applicantsPath = `users/${currentUser.uid}/applicants`;
            const applicantsRef = collection(db, applicantsPath);
            const snapshot = await getDocs(applicantsRef);
            
            const totalApplicants = snapshot.docs.length;
            const newApplicants = snapshot.docs.filter(doc => doc.data().status === 'New').length;

            setStats({ total: totalApplicants, new: newApplicants });

            const recentQuery = query(applicantsRef, orderBy('submittedAt', 'desc'), limit(5));
            const recentSnapshot = await getDocs(recentQuery);
            const recentData = recentSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setRecentApplicants(recentData);

        } catch (error) {
            console.error("Error fetching dashboard stats: ", error);
        } finally {
            setLoadingStats(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);
    
    if (loadingProfile || loadingStats) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <header className="mb-10">
                <h1 className="text-4xl font-bold text-gray-800">
                    Welcome back, {profile?.companyName || 'User'}!
                </h1>
                <p className="text-lg text-gray-500">
                    Here's a quick overview of your hiring funnel.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                    <h2 className="text-gray-500 text-lg font-medium">Total Applicants</h2>
                    <p className="text-4xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                    <h2 className="text-gray-500 text-lg font-medium">New Applicants</h2>
                    <p className="text-4xl font-bold text-blue-600">{stats.new}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Recent Applicants</h2>
                        <Link to="/applicants" className="text-blue-600 font-semibold hover:underline flex items-center">
                            View All <ArrowRightIcon className="h-4 w-4 ml-1" />
                        </Link>
                    </div>
                    <div>
                        {recentApplicants.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {recentApplicants.map(app => {
                                    const { name, email } = getApplicantInfo(app.answers);
                                    return (
                                        // UPDATED: Wrap the list item content in a Link
                                        <li key={app.id}>
                                            <Link to={`/applicant/${app.id}`} className="block py-4 hover:bg-gray-50 rounded-lg px-2">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-lg font-medium text-gray-900">{name}</p>
                                                        <p className="text-sm text-gray-500">{email}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500">
                                                           Submitted: {app.submittedAt?.toDate().toLocaleDateString()}
                                                        </p>
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            app.status === 'New' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {app.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500 py-8">No recent applicants to show.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                    <ul className="space-y-3">
                        <li>
                            <Link to="/questionnaire" className="block w-full text-left bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold p-4 rounded-lg transition-colors">
                                Edit Questionnaire
                            </Link>
                        </li>
                        <li>
                            <Link to={`/apply/${currentUser.uid}`} target="_blank" rel="noopener noreferrer" className="block w-full text-left bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold p-4 rounded-lg transition-colors">
                                View Public Application Form
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
