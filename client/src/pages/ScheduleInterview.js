import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { InlineWidget } from 'react-calendly';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { SparklesIcon } from '@heroicons/react/24/solid';

export default function ScheduleInterview() {
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { questionnaireOwnerId } = location.state || {};

  useEffect(() => {
    const fetchCalendlyUrl = async () => {
      if (!questionnaireOwnerId) {
        console.error("Owner ID not provided");
        setLoading(false);
        return;
      };
      
      try {
        const userProfileDoc = await getDoc(doc(db, 'users', questionnaireOwnerId));
        if (userProfileDoc.exists()) {
          const userData = userProfileDoc.data();
          setCalendlyUrl(userData.calendlyUrl);
        } else {
          console.error("No profile found for owner");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendlyUrl();
  }, [questionnaireOwnerId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center text-center p-4">
      <SparklesIcon className="h-24 w-24 text-yellow-500" />
      <h1 className="mt-6 text-4xl font-bold text-gray-800">Congratulations!</h1>
      <p className="mt-4 text-lg text-gray-600 max-w-2xl">
        You're a great fit! Based on your answers, we'd like to invite you to schedule an interview. Please choose a time that works best for you below.
      </p>

      {calendlyUrl ? (
        <div className="mt-8 w-full max-w-4xl h-[700px]">
          <InlineWidget url={calendlyUrl} />
        </div>
      ) : (
        <p className="mt-8 text-red-500">The scheduling link is not available at the moment. Please check back later.</p>
      )}
    </div>
  );
}
