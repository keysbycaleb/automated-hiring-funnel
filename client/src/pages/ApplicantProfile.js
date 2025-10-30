import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // --- Import Link ---
import { db, generateContractV2 } from '../firebase'; // --- Import generateContract ---
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // --- Import updateDoc ---
import { useAuth } from '../context/AuthContext';
import {
  FileDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  User,
  Clock,
  Mail,
  DollarSign,
  ClipboardList,
  FileSignature, // --- Import new icon ---
} from 'lucide-react';
import AlertModal from '../components/AlertModal'; // --- Import AlertModal ---

// --- getStatusColor (unchanged) ---
const getStatusColor = (status) => {
  switch (status) {
    case 'Signed':
      return 'bg-green-100 text-green-800';
    case 'Sent':
      return 'bg-blue-100 text-blue-800';
    case 'Draft':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// --- InfoItem (unchanged) ---
const InfoItem = ({ icon, label, value }) => (
  <li className="py-3 sm:py-4">
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0">
        <span className="flex items-center justify-center w-8 h-8 text-gray-500 bg-gray-100 rounded-full">
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
        <p className="text-sm text-gray-500 truncate">{value}</p>
      </div>
    </div>
  </li>
);

export default function QuoteProfile() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [quote, setQuote] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- NEW State for alerts and button ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', isError: false });

  // --- Data Fetching Logic (unchanged) ---
  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!currentUser || !id) return;
      setLoading(true);
      try {
        const quoteRef = doc(db, 'quotes', id);
        const quoteSnap = await getDoc(quoteRef);
        if (quoteSnap.exists()) {
          setQuote(quoteSnap.data());
        } else {
          console.error('No such quote found!');
        }

        const configRef = doc(db, 'config', 'main');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setConfig(configSnap.data());
        } else {
          console.error('Config document not found!');
        }
      } catch (error) {
        console.error('Error fetching quote data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteData();
  }, [currentUser, id]);

  // --- NEW: Handle "Generate Contract" button click ---
  const handleGenerateContractV2 = async () => {
    setIsGenerating(true);
    setAlert({ show: false, message: '', isError: false });
    
    // First, ensure the quote has selections.
    // This should only be called by the admin AFTER a client selects.
    if (!quote.selectedTierId || !quote.selectedPaymentId) {
      setAlert({ show: true, message: 'Client has not selected a tier or payment plan yet.', isError: true });
      setIsGenerating(false);
      return;
    }

    try {
      // 1. Call the cloud function
      const result = await generateContractV2({ quoteId: id });
      
      // 2. Refresh the quote data from Firestore to get new status
      const quoteRef = doc(db, 'quotes', id);
      const quoteSnap = await getDoc(quoteRef);
      if (quoteSnap.exists()) {
        setQuote(quoteSnap.data());
      }
      
      // 3. Show success alert
      setAlert({ show: true, message: 'Contracts generated successfully! The page will now reflect the new "Signed" status and show contract links.', isError: false });
      
    } catch (err) {
      console.error("Error generating contract:", err);
      setAlert({ show: true, message: `Failed to generate contracts: ${err.message}`, isError: true });
    }
    setIsGenerating(false);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!quote || !config) {
    // ... (Error display unchanged)
    return (
      <div className="p-8 text-center text-red-500">
        <AlertCircle className="w-12 h-12 mx-auto" />
        <h2 className="mt-2 text-xl font-semibold">Error</h2>
        <p>Could not load quote or configuration data.</p>
      </div>
    );
  }

  // --- Data Mapping (unchanged) ---
  const selectedTier = config.tiers.find(
    (t) => t.id === quote.selectedTierId,
  );
  const selectedPlan = config.paymentPlans.find(
    (p) => p.id === quote.selectedPaymentId,
  );
  
  // --- Check if contract is ready to be generated ---
  const canGenerate = quote.selectedTierId && quote.selectedPaymentId && quote.status !== 'Signed';
  const isSigned = quote.status === 'Signed';

  return (
    <> {/* --- Wrap in Fragment --- */}
      <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
        {/* --- Header Section (unchanged) --- */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-4xl font-bold text-gray-800">
                {quote.clientName || 'Unnamed Quote'}
              </h1>
              <p className="text-lg text-gray-500">
                {quote.email || 'No email provided'}
              </p>
              <span
                className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                  quote.status,
                )}`}
              >
                Status: {quote.status || 'N/A'}
              </span>

              {quote.pdfUrl && (
                <div className="mt-4">
                  <a
                    href={quote.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileDown className="h-5 w-5 mr-2" />
                    Download PDF Quote
                  </a>
                </div>
              )}
            </div>
            <div className="text-left md:text-right">
              <p className="text-gray-500 text-lg">Total Quote Value</p>
              <p className="text-5xl font-bold text-blue-600">
                {quote.totalValue ? `$${quote.totalValue.toFixed(2)}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* --- Selected Package Section (unchanged) --- */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Selected Package
            </h2>
            {selectedTier ? (
              // ... (package details UI unchanged)
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                <h3 className="font-bold text-xl text-gray-900 mb-1">
                  {selectedTier.name}
                </h3>
                <p className="text-gray-600 mb-4 italic p-3 bg-gray-50 rounded-lg">
                  Payment Plan: {selectedPlan ? selectedPlan.name : 'N/A'}
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                  <div className="space-y-2 text-sm">
                    <h4 className="font-semibold text-lg text-gray-700 mb-2">
                      Included Features
                    </h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {selectedTier.features
                        .split('\n')
                        .map((feature, i) => (
                          <li key={i} className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div className="mt-6 lg:mt-0">
                    <h4 className="font-semibold text-lg text-gray-700 mb-2">
                      Price Breakdown
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <span className="text-gray-800 font-medium">
                          Setup Fee
                        </span>
                        <span className="font-bold text-lg text-gray-900">
                          ${quote.setupFee ? quote.setupFee.toFixed(2) : '0.00'}
                        </span>
                      </li>
                      <li className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <span className="text-gray-800 font-medium">
                          Monthly Fee
                        </span>
                        <span className="font-bold text-lg text-gray-900">
                          ${quote.monthlyFee ? quote.monthlyFee.toFixed(2) : '0.00'}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                <p className="text-center text-gray-500">
                  No package has been selected for this quote yet.
                </p>
              </div>
            )}
          </div>

          {/* --- Client Info & Actions Column --- */}
          <div className="lg:col-span-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Actions
            </h2>
            {/* --- NEW Action Button --- */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 mb-8">
              <button
                type="button"
                onClick={handleGenerateContractV2}
                disabled={!canGenerate || isGenerating}
                className="w-full flex justify-center items-center px-4 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <FileSignature className="w-5 h-5 mr-2" />
                )}
                {isGenerating ? 'Generating...' : 'Generate Contract'}
              </button>
              {!canGenerate && !isSigned && (
                <p className="mt-2 text-xs text-center text-gray-500">
                  Client must select a tier and plan on their link before you can generate a contract.
                </p>
              )}
              {isSigned && (
                 <p className="mt-2 text-xs text-center text-green-600">
                  Contracts have already been generated for this quote.
                </p>
              )}
            </div>

            {/* --- NEW: Generated Contracts List --- */}
            {isSigned && quote.contractDocs && (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Generated Contracts
                </h3>
                <ul className="space-y-3">
                  {quote.contractDocs.map((doc) => (
                    <li key={doc.name}>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                      >
                        <span className="font-medium text-blue-600">{doc.name}</span>
                        <FileDown className="w-5 h-5 text-gray-400" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* --- Client Info (unchanged) --- */}
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Client & Project Info
            </h2>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <ul className="divide-y divide-gray-200">
                {/* ... (InfoItem list unchanged) ... */}
                <InfoItem
                  icon={<User className="w-5 h-5" />}
                  label="Client Name"
                  value={quote.clientName}
                />
                <InfoItem
                  icon={<Mail className="w-5 h-5" />}
                  label="Client Email"
                  value={quote.email || 'N/A'}
                />
                <InfoItem
                  icon={<Clock className="w-5 h-5" />}
                  label="Project Hours"
                  value={quote.hours || 'N/A'}
                />
                <InfoItem
                  icon={<DollarSign className="w-5 h-5" />}
                  label="Discount"
                  value={quote.discountPct ? `${quote.discountPct}%` : '0%'}
                />
                <InfoItem
                  icon={<ClipboardList className="w-5 h-5" />}
                  label="Quote ID"
                  value={id}
                />
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* --- Alert Modal for feedback --- */}
      <AlertModal
        isOpen={alert.show}
        onClose={() => setAlert({ ...alert, show: false })}
        title={alert.isError ? 'Error Occurred' : 'Success'}
        message={alert.message}
        icon={
          alert.isError ? (
            <AlertCircle className="w-12 h-12 text-red-500" />
          ) : (
            <CheckCircle className="w-12 h-12 text-green-500" />
          )
        }
      />
    </>
  );
}
