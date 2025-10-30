import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // --- Import updateDoc ---
import { db, generateContractV2 } from '../firebase'; // --- Import generateContract ---
import { calculateQuote } from '../logic/quoteCalculator';
import { Loader2, AlertCircle, CheckCircle, Lock } from 'lucide-react'; // --- Import Lock ---
import companyLogo from '../assets/company-name.png';

// --- SelectInput component (unchanged) ---
const SelectInput = ({ label, value, onChange, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    >
      {children}
    </select>
  </div>
);

export default function QuoteCalculator() {
  const { quoteId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [configData, setConfigData] = useState(null);

  const [selectedTierId, setSelectedTierId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // --- NEW State for contract generation ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch the "locked" quote data
        const quoteRef = doc(db, 'quotes', quoteId);
        const quoteSnap = await getDoc(quoteRef);
        if (!quoteSnap.exists()) {
          throw new Error('This quote link is not valid or has expired.');
        }
        const qData = quoteSnap.data();
        setQuoteData(qData);

        // 2. Fetch the "live" config data
        const configRef = doc(db, 'config', 'main');
        const configSnap = await getDoc(configRef);
        if (!configSnap.exists()) {
          throw new Error('Could not load pricing. Please contact us.');
        }
        const cData = configSnap.data();
        setConfigData(cData);

        // 3. Set default dropdown values
        // --- LOGIC UPDATED: Check if quote is already finalized ---
        if (qData.status === 'Signed' || qData.contractDocs) {
          setIsComplete(true);
          setSelectedTierId(qData.selectedTierId);
          setSelectedPlanId(qData.selectedPaymentId);
        } else {
          setSelectedTierId(qData.selectedTierId || cData.tiers[0]?.id || '');
          setSelectedPlanId(qData.selectedPaymentId || cData.paymentPlans[0]?.id || '');
        }
      } catch (err) {
        console.error("Error loading quote:", err);
        setError(err.message);
      }
      setLoading(false);
    };

    fetchData();
  }, [quoteId]);

  // --- "Brain" (unchanged) ---
  const quoteResult = useMemo(() => {
    if (!quoteData || !configData) return null;
    return calculateQuote(quoteData, configData, selectedTierId, selectedPlanId);
  }, [quoteData, configData, selectedTierId, selectedPlanId]);

  // --- NEW: Handle "Accept Quote" button click ---
  const handleAcceptQuote = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // 1. Save the final selections to the quote document
      const quoteRef = doc(db, 'quotes', quoteId);
      await updateDoc(quoteRef, {
        selectedTierId: selectedTierId,
        selectedPaymentId: selectedPlanId,
        status: 'Generating Contract', // Update status
        // Save the final calculated values
        totalValue: quoteResult.finalSetupFee + quoteResult.finalMonthlyFee, 
        setupFee: quoteResult.finalSetupFee,
        monthlyFee: quoteResult.finalMonthlyFee,
      });

      // 2. Call the cloud function
      await generateContractV2({ quoteId: quoteId });

      // 3. Set success state
      setIsComplete(true);

    } catch (err) {
      console.error("Error generating contract:", err);
      setError("An error occurred while generating your contract. Please contact us.");
    }
    setIsGenerating(false);
  };

  // --- Loading State (unchanged) ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-600">Loading your custom quote...</p>
      </div>
    );
  }

  // --- Error State (unchanged) ---
  if (error && !isComplete) { // Only show error if not complete
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <AlertCircle className="w-12 h-12 text-red-600" />
        <p className="mt-4 text-lg font-medium text-red-600">
          {error}
        </p>
        <p className="mt-2 text-gray-500">Please check the URL or contact support.</p>
      </div>
    );
  }

  // --- Calculator UI ---
  if (quoteResult) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <img
            className="h-12 w-auto mx-auto"
            src={companyLogo}
            alt="Company"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Hello, {quoteData.clientName}!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isComplete ? "Your contracts have been generated." : "Your custom quote is ready. Feel free to explore your options below."}
          </p>

          <div className="mt-8 bg-white p-8 rounded-2xl shadow-lg">
            {/* --- Disable form if complete --- */}
            <fieldset disabled={isGenerating || isComplete}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectInput
                  label="Select a Service Tier"
                  value={selectedTierId}
                  onChange={(e) => setSelectedTierId(e.target.value)}
                >
                  {configData.tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name}
                    </option>
                  ))}
                </SelectInput>
                <SelectInput
                  label="Select a Payment Plan"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  {configData.paymentPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </SelectInput>
              </div>
            </fieldset>

            {/* --- Results (unchanged) --- */}
            <div className="mt-10 border-t border-gray-200 pt-8">
              <h3 className="text-2xl font-bold text-gray-900">
                {quoteResult.tierName}
              </h3>
              <p className="text-gray-600">
                Payment Plan: {quoteResult.planName}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">One-Time Setup Fee</p>
                  <p className="mt-1 text-4xl font-bold text-blue-900">
                    ${quoteResult.finalSetupFee.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Recurring Fee</p>
                  <p className="mt-1 text-4xl font-bold text-green-900">
                    ${quoteResult.finalMonthlyFee.toFixed(2)}
                    <span className="text-base font-medium text-gray-500">/mo</span>
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900">
                  What's Included:
                </h4>
                <ul className="mt-4 space-y-2">
                  {quoteResult.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-600">
                      <CheckCircle className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* --- Final "Accept" Button --- */}
            <div className="mt-10">
              {isComplete ? (
                // --- Success State ---
                <div className="text-center p-4 bg-green-100 text-green-800 rounded-md">
                  <CheckCircle className="w-8 h-8 mx-auto" />
                  <h3 className="mt-2 text-lg font-medium">Success!</h3>
                  <p className="mt-1 text-sm">
                    Your contracts have been generated and sent. We will be in
                    touch shortly to finalize onboarding.
                  </p>
                </div>
              ) : (
                // --- Default Button ---
                <button
                  type="button"
                  onClick={handleAcceptQuote}
                  disabled={isGenerating}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isGenerating ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "Accept Quote & Generate Contract"
                  )}
                </button>
              )}
              {/* Show error message at the bottom */}
              {error && (
                 <p className="mt-4 text-center text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null; // Fallback
}
