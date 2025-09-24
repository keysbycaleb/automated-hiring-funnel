import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UsersIcon, ClockIcon, CalendarDaysIcon, StarIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon, to }) => {
  const IconComponent = icon;
  return (
    <Link to={to} className="bg-white p-6 rounded-large shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
          <IconComponent className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </Link>
  );
};

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalApplicants: 0,
        newApplicants: 0,
        interviewsScheduled: 0,
        highScores: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const applicantsCollection = collection(db, 'applicants');

                // Total Applicants
                const totalSnapshot = await getDocs(applicantsCollection);
                const totalApplicants = totalSnapshot.size;

                // High Scores (Top 10%)
                const highScoresCount = Math.ceil(totalApplicants * 0.1);

                // New Applicants (last 7 days)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);
                
                const newApplicantsQuery = query(applicantsCollection, where("submittedAt", ">=", sevenDaysAgoTimestamp));
                const newApplicantsSnapshot = await getDocs(newApplicantsQuery);
                const newApplicants = newApplicantsSnapshot.size;

                // Interviews Scheduled
                const interviewsQuery = query(applicantsCollection, where("status", "==", "Interview Scheduled"));
                const interviewsSnapshot = await getDocs(interviewsQuery);
                const interviewsScheduled = interviewsSnapshot.size;

                setStats({
                    totalApplicants,
                    newApplicants,
                    interviewsScheduled,
                    highScores: highScoresCount,
                });
            } catch (error) {
                console.error("Error fetching dashboard stats: ", error);
            }
            setLoading(false);
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Applicants" 
                    value={stats.totalApplicants}
                    icon={UsersIcon}
                    to="/all-applicants"
                />
                <StatCard 
                    title="New Applicants (7d)" 
                    value={stats.newApplicants}
                    icon={ClockIcon}
                    to="/all-applicants?filter=new"
                />
                <StatCard 
                    title="Interviews Scheduled" 
                    value={stats.interviewsScheduled}
                    icon={CalendarDaysIcon}
                    to="/all-applicants?filter=interview"
                />
                <StatCard 
                    title="High Scores (Top 10%)" 
                    value={stats.highScores}
                    icon={StarIcon}
                    to="/all-applicants?filter=highscore"
                />
            </div>

            {/* You can add more dashboard components here, like charts or recent activity feeds */}
            <div className="mt-10 bg-white p-6 rounded-large shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Coming Soon</h2>
                <p className="text-gray-600">More widgets, charts, and analytics will be available here in the future to help you visualize your hiring funnel.</p>
            </div>
        </div>
    );
}
