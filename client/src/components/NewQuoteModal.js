import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { LinkIcon, Loader2, AlertCircle, FileDown } from 'lucide-react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, generateQuotePDF } from '../firebase'; // --- Import our cloud function ---
import { useAuth } from '../context/AuthContext';

// Helper component (unchanged)
const FormInput = ({ label, id, value, onChange, type = 'text', placeholder }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="mt-1">
      <input
        type={type}
        name={id}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  </div>
);

// Helper component (re-used from QuoteCalculator)
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

export default function NewQuoteModal({ isOpen, onClose, onLinkGenerated, onPdfGenerated }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    hours: '20',
    discountPct: '0',
  });
  
  // --- NEW STATE for PDF generation ---
  const [config, setConfig] = useState(null);
  const [selectedTierId, setSelectedTierId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  
  const [loadingLink, setLoadingLink] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState('');

  // --- NEW: Fetch config data when modal opens ---
  useEffect(() => {
    if (isOpen && !config) {
      const fetchConfig = async () => {
        try {
          const configRef = doc(db, 'config', 'main');
          const configSnap = await getDoc(configRef);
          if (configSnap.exists()) {
            const configData = configSnap.data();
            setConfig(configData);
            // Set defaults for the dropdowns
            setSelectedTierId(configData.tiers[0]?.id || '');
            setSelectedPlanId(configData.paymentPlans[0]?.id || '');
          } else {
            setError('Could not load pricing config. Please save in Product Manager.');
          }
        } catch (err) {
          setError('Failed to fetch pricing config.');
        }
      };
      fetchConfig();
    }
  }, [isOpen, config]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Handler 1: Generate Client Link (Unchanged) ---
  const handleGenerateLink = async (e) => {
    e.preventDefault();
    if (!formData.clientName) {
      setError('Client Name is required.');
      return;
    }
    setLoadingLink(true);
    setError('');

    try {
      const newQuoteData = {
        ...formData,
        hours: parseFloat(formData.hours),
        discountPct: parseFloat(formData.discountPct),
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'Draft',
      };
      const docRef = await addDoc(collection(db, 'quotes'), newQuoteData);
      const link = `${window.location.origin}/quote/${docRef.id}`;
      onLinkGenerated(link); // Pass link to Dashboard
      handleClose();
    } catch (err) {
      console.error('Error creating new quote:', err);
      setError('Failed to create quote. Please try again.');
    }
    setLoadingLink(false);
  };

  // --- Handler 2: Generate Static PDF (NEW) ---
  const handleGeneratePDF = async (e) => {
    e.preventDefault();
    if (!formData.clientName || !selectedTierId || !selectedPlanId) {
      setError('Client Name, Tier, and Payment Plan are required.');
      return;
    }
    setLoadingPdf(true);
    setError('');

    try {
      // Find the full objects for the selected IDs
      const selectedTier = config.tiers.find(t => t.id === selectedTierId);
      const selectedPayment = config.paymentPlans.find(p => p.id === selectedPlanId);

      const quoteData = {
        ...formData,
        hours: parseFloat(formData.hours),
        discountPct: parseFloat(formData.discountPct),
        selectedTier,      // Pass the full tier object
        selectedPayment, // Pass the full plan object
      };

      // Call the cloud function
      const result = await generateQuotePDF(quoteData);
      
      // Pass the PDF URL back to the Dashboard
      onPdfGenerated(result.data.pdfUrl);
      handleClose();

    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
    setLoadingPdf(false);
  };


  const handleClose = () => {
    if (loadingLink || loadingPdf) return;
    setFormData({
      clientName: '', email: '', hours: '20', discountPct: '0',
    });
    setError('');
    // We don't reset config
    onClose();
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* ... TransitionChild for overlay (unchanged) ... */}
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4 text-center">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-lg p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex items-start justify-between">
                  <DialogTitle
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Create New Quote
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                {/* --- Form now has two submit buttons --- */}
                <form className="mt-4 space-y-4">
                  <p className="text-sm text-gray-600">
                    Enter the client's "locked" variables.
                  </p>
                  
                  {error && (
                    <div className="flex p-3 text-sm text-red-700 bg-red-100 rounded-md">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* --- Locked Variables Inputs (unchanged) --- */}
                  <FormInput
                    label="Client Name"
                    id="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    placeholder="e.g., Pete's Lighting"
                  />
                  <FormInput
                    label="Client Email (Optional)"
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="pete@lighting.com"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Project Hours"
                      id="hours"
                      type="number"
                      value={formData.hours}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Discount (%)"
                      id="discountPct"
                      type="number"
                      value={formData.discountPct}
                      onChange={handleChange}
                    />
                  </div>
                  
                  {/* --- Button 1: Generate Link --- */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      onClick={handleGenerateLink}
                      disabled={loadingLink || loadingPdf}
                      className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm disabled:bg-gray-400 hover:bg-blue-700 focus:outline-none"
                    >
                      {loadingLink ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <LinkIcon className="w-5 h-5 mr-2" />
                      )}
                      {loadingLink ? 'Generating...' : 'Save & Generate Client Link'}
                    </button>
                  </div>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">OR</span>
                    </div>
                  </div>

                  {/* --- PDF Generation Section --- */}
                  <p className="text-sm text-gray-600">
                    For a decisive client, select their package and generate a static PDF.
                  </p>
                  
                  {/* --- NEW Dropdowns for PDF --- */}
                  <div className="grid grid-cols-2 gap-4">
                    <SelectInput
                      label="Select Tier"
                      value={selectedTierId}
                      onChange={(e) => setSelectedTierId(e.target.value)}
                    >
                      {config ? config.tiers.map(tier => (
                        <option key={tier.id} value={tier.id}>{tier.name}</option>
                      )) : <option disabled>Loading...</option>}
                    </SelectInput>
                    <SelectInput
                      label="Select Payment Plan"
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                    >
                      {config ? config.paymentPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      )) : <option disabled>Loading...</option>}
                    </SelectInput>
                  </div>

                  {/* --- Button 2: Generate PDF --- */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      onClick={handleGeneratePDF}
                      disabled={loadingLink || loadingPdf || !config}
                      className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 border border-transparent rounded-md shadow-sm disabled:bg-gray-400 hover:bg-gray-800 focus:outline-none"
                    >
                      {loadingPdf ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <FileDown className="w-5 h-5 mr-2" />
                      )}
                      {loadingPdf ? 'Generating PDF...' : 'Generate Static PDF'}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
