import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function ApplicationSubmitted() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center text-center p-4">
      <CheckCircleIcon className="h-24 w-24 text-green-500" />
      <h1 className="mt-6 text-4xl font-bold text-gray-800">Application Submitted!</h1>
      <p className="mt-4 text-lg text-gray-600 max-w-xl">
        Thank you for your interest. We have received your application and will review it shortly. If you are selected to move forward, we will contact you soon.
      </p>
      <Link
        to="/"
        className="mt-8 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
      >
        Return to Home
      </Link>
    </div>
  );
}
