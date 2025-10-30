import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import AlertModal from '../components/AlertModal'; // We'll re-use this

// Helper component for clean input fields
const ConfigInput = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="mt-1">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  </div>
);

// Helper component for larger text areas
const ConfigTextarea = ({ label, value, onChange, placeholder, rows = 3 }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="mt-1">
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full p-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  </div>
);

// Helper for styling collapsible sections
const SectionWrapper = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  </div>
);

export default function ProductManager() {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState(null); // Will hold our config/main data
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', isError: false });

  // --- NEW DATA LOGIC (Replaces old questionnaire logic) ---
  // Fetches the single config doc from 'config/main'
  const fetchConfig = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const configRef = doc(db, 'config', 'main');
      const docSnap = await getDoc(configRef);

      if (docSnap.exists()) {
        setConfig(docSnap.data());
      } else {
        // If no config exists, create a default one
        const defaultConfig = {
          baseHourlyRate: 150,
          tiers: [
            { id: 'foundation', name: 'Foundation', price: 199, setupFee: 1000, features: 'Feature 1\nFeature 2' },
            { id: 'growth', name: 'Growth', price: 299, setupFee: 1500, features: 'Feature 1\nFeature 2\nFeature 3' },
            { id: 'accelerator', name: 'Accelerator', price: 499, setupFee: 2000, features: 'All Features\nPriority Support' },
          ],
          paymentPlans: [
            { id: '12mo', name: '12-Month Prepay', discount: 0.1 },
            { id: '2mo', name: '2-Month Prepay', discount: 0.05 },
            { id: 'monthly', name: 'Monthly', discount: 0.0 },
          ],
        };
        await setDoc(configRef, defaultConfig);
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setAlert({ show: true, message: `Error fetching config: ${error.message}`, isError: true });
    }
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // --- NEW SAVE LOGIC ---
  // Saves the entire config object back to 'config/main'
  const handleSave = async () => {
    setSaving(true);
    try {
      const configRef = doc(db, 'config', 'main');
      await setDoc(configRef, config, { merge: true }); // Use merge to be safe
      setAlert({ show: true, message: 'Configuration saved successfully!', isError: false });
    } catch (error) {
      console.error('Error saving config:', error);
      setAlert({ show: true, message: `Error saving config: ${error.message}`, isError: true });
    }
    setSaving(false);
  };

  // --- Helper functions to update the complex state ---
  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...config.tiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setConfig({ ...config, tiers: updatedTiers });
  };

  const handlePlanChange = (index, field, value) => {
    const updatedPlans = [...config.paymentPlans];
    updatedPlans[index] = { ...updatedPlans[index], [field]: value };
    setConfig({ ...config, paymentPlans: updatedPlans });
  };

  // --- Loading State (Preserves UI feel) ---
  // We now wait if loading is true OR if config is still null
  if (loading || !config) { 
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  // --- NEW STATIC UI (Replaces Drag-and-Drop UI) ---
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="p-6 md:p-10"
      >
        {/* --- Header (Cosmetic Text Updated) --- */}
        <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Product & Pricing Manager
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your live service tiers, pricing, and payment options.
              Changes here are reflected instantly on all client quotes.
            </p> 
            {/* --- THIS WAS THE BUG. It's now a </p> tag --- */}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center w-full px-6 py-3 mt-4 font-medium text-white bg-blue-600 rounded-md shadow-sm disabled:bg-gray-400 hover:bg-blue-700 md:mt-0 md:w-auto"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* --- Main Settings Form --- */}
        <div className="grid grid-cols-1 gap-8 mt-10 lg:grid-cols-3">
          {/* --- Tiers Column --- */}
          <div className="space-y-8 lg:col-span-2">
            {config?.tiers?.map((tier, index) => (
              <SectionWrapper key={tier.id} title={`${tier.name} Tier`}>
                <ConfigInput
                  label="Tier Name"
                  value={tier.name}
                  onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                  placeholder="e.g., Foundation"
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <ConfigInput
                    label="Monthly Price ($)"
                    type="number"
                    value={tier.price}
                    onChange={(e) => handleTierChange(index, 'price', parseFloat(e.target.value))}
                    placeholder="e.g., 299"
                  />
                  <ConfigInput
                    label="Setup Fee ($)"
                    type="number"
                    value={tier.setupFee}
                    onChange={(e) => handleTierChange(index, 'setupFee', parseFloat(e.target.value))}
                    placeholder="e.g., 1500"
                  />
                </div>
                <ConfigTextarea
                  label="Features (one per line)"
                  value={tier.features}
                  onChange={(e) => handleTierChange(index, 'features', e.target.value)}
                  placeholder="Feature 1..."
                  rows={4}
                />
              </SectionWrapper>
            ))}
          </div>

          {/* --- Global Settings Column --- */}
          <div className="space-y-8 lg:col-span-1">
            <SectionWrapper title="Global Variables">
              <ConfigInput
                label="Base Hourly Rate ($)"
                type="number"
                value={config.baseHourlyRate}
                onChange={(e) => setConfig({ ...config, baseHourlyRate: parseFloat(e.target.value) })}
                placeholder="e.g., 150"
              />
            </SectionWrapper>

            <SectionWrapper title="Payment Plans">
              {config?.paymentPlans?.map((plan, index) => (
                <div key={plan.id} className="pb-4 border-b border-gray-200 last:border-b-0">
                  <ConfigInput
                    label="Plan Name"
                    value={plan.name}
                    onChange={(e) => handlePlanChange(index, 'name', e.target.value)}
                    placeholder="e.g., 12-Month Prepay"
                  />
                  <ConfigInput
                    label="Discount (e.g., 0.1 for 10%)"
                    type="number"
                    value={plan.discount}
                    onChange={(e) => handlePlanChange(index, 'discount', parseFloat(e.target.value))}
                    placeholder="e.g., 0.1"
                  />
                </div>
              ))}
            </SectionWrapper>
          </div>
        </div>
      </motion.div>

      {/* --- Re-using the existing AlertModal --- */}
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
