import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// --- Icons Updated ---
import { Search, FileText, Eye } from 'lucide-react';

// --- Functionality Preserved ---
// This was ApplicantScore, now repurposed for QuoteStatus
const QuoteStatus = ({ status }) => {
  const statusMap = {
    Draft: 'bg-gray-100 text-gray-800',
    Sent: 'bg-blue-100 text-blue-800',
    Signed: 'bg-green-100 text-green-800',
    Expired: 'bg-red-100 text-red-800',
    Default: 'bg-yellow-100 text-yellow-800',
  };
  const style = statusMap[status] || statusMap.Default;
  return (
    <span
      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}
    >
      {status || 'N/A'}
    </span>
  );
};

// --- Functionality Preserved ---
// This was ApplicantCard, now repurposed for QuoteCard
// All layout, hover effects, and motion are identical
const QuoteCard = ({ quote }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    className="relative flex flex-col justify-between p-5 bg-white rounded-lg shadow group"
  >
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 truncate">
          {quote.clientName || 'Unnamed Quote'}
        </p>
        <QuoteStatus status={quote.status || 'Draft'} />
      </div>
      <div className="mt-2">
        <p className="text-xl font-bold text-gray-900">
          {/* We'll add a 'totalValue' field later */}
          {quote.totalValue ? `$${quote.totalValue}` : 'No Value Set'}
        </p>
        <p className="text-sm text-gray-500">
          Created:{' '}
          {quote.createdAt
            ? new Date(quote.createdAt.seconds * 1000).toLocaleDateString()
            : 'N/A'}
        </p>
      </div>
    </div>
    <div className="mt-4">
      <Link
        to={`/quote-profile/${quote.id}`} // --- Route Updated ---
        className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-md shadow-sm opacity-0 group-hover:opacity-100 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Eye className="w-4 h-4 mr-2" />
        View Details
      </Link>
    </div>
  </motion.div>
);

export default function AllQuotes() { // --- Renamed component ---
  const { currentUser } = useAuth();
  const [allQuotes, setAllQuotes] = useState([]); // Was allApplicants
  const [filteredQuotes, setFilteredQuotes] = useState([]); // Was filteredApplicants
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- Cosmetic Text Updated ---
  const [activeStatus, setActiveStatus] = useState('All');
  const statuses = ['All', 'Draft', 'Sent', 'Signed', 'Expired'];

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    // --- Query Updated ---
    // Now queries the root 'quotes' collection, filtered by our userId
    const q = query(
      collection(db, 'quotes'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const quotesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllQuotes(quotesData);
        setFilteredQuotes(quotesData); // Initialize with all data
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching quotes: ', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  // --- Search/Filter Logic Preserved (Functionality identical) ---
  useEffect(() => {
    let result = allQuotes;

    if (activeStatus !== 'All') {
      result = result.filter((quote) => (quote.status || 'Draft') === activeStatus);
    }

    if (searchTerm) {
      result = result.filter((quote) =>
        (quote.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredQuotes(result);
  }, [searchTerm, activeStatus, allQuotes]);

  // --- Functionality Preserved ---
  const handleStatusChange = (status) => {
    setActiveStatus(status);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-10"
    >
      {/* --- Header (Cosmetic Text Updated) --- */}
      <h1 className="text-3xl font-bold text-gray-900">All Quotes</h1>
      <p className="mt-2 text-gray-600">
        Search, filter, and manage all quotes you've created.
      </p>

      {/* --- Filters & Search Bar (Functionality Preserved) --- */}
      <div className="flex flex-col mt-8 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="search"
              name="search"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full py-2 pl-10 pr-3 text-sm placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by client name..."
            />
          </div>
        </div>
        <div className="mt-4 md:mt-0 md:ml-4">
          <div className="block">
            <nav className="flex -space-x-px rounded-md shadow-sm isolate">
              {statuses.map((status, idx) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium focus:z-20 ${
                    activeStatus === status
                      ? 'z-10 bg-blue-600 text-white focus:outline-none'
                      : 'bg-white text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
                  } ${idx === 0 ? 'rounded-l-md' : ''} ${
                    idx === statuses.length - 1 ? 'rounded-r-md' : ''
                  } border border-gray-300`}
                >
                  {status}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* --- Grid (Functionality Preserved) --- */}
      <div className="mt-8">
        {loading ? (
          <p className="text-center text-gray-500">Loading quotes...</p>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No quotes found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeStatus === 'All' && !searchTerm
                ? "You haven't created any quotes yet."
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredQuotes.map((quote) => (
                <QuoteCard key={quote.id} quote={quote} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
