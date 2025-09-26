import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoIcon } from '@heroicons/react/24/outline';
import companyNameCharacter from '../assets/company-name.png';
import profilePicCharacter from '../assets/profile-pic.png';

const INITIAL_DATA = {
  companyName: '',
  logoFile: null,
  previewUrl: null,
};

const variants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

export default function Onboarding() {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { currentUser } = useAuth();
  const { updateProfile } = useProfile();
  const navigate = useNavigate();

  const steps = [
    <Step1 key="step1" {...data} updateFields={setData} />,
    <Step2 key="step2" {...data} updateFields={setData} />,
  ];

  const next = () => {
    setDirection(1);
    setCurrentStepIndex(i => (i < steps.length - 1 ? i + 1 : i));
  };

  const back = () => {
    setDirection(-1);
    setCurrentStepIndex(i => (i > 0 ? i - 1 : i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStepIndex < steps.length - 1) return next();

    setLoading(true);
    let logoUrl = null;

    try {
      if (data.logoFile) {
        const storage = getStorage();
        const filePath = `users/${currentUser.uid}/logos/${data.logoFile.name}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, data.logoFile);
        logoUrl = await getDownloadURL(snapshot.ref);
      }

      await updateProfile({
        companyName: data.companyName,
        logoUrl: logoUrl,
        onboardingComplete: true,
      });

      navigate('/');
    } catch (error) {
      console.error("Failed to complete onboarding", error);
    } finally {
      setLoading(false);
    }
  };

  const characterImage = currentStepIndex === 0 ? companyNameCharacter : profilePicCharacter;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left Column for Character Image */}
          <div className="relative h-96 w-full flex items-center justify-center overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={currentStepIndex}
                src={characterImage}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="absolute"
                style={{ transform: 'scale(3)' }}
              />
            </AnimatePresence>
          </div>

          {/* Right Column for Form */}
          <div className="relative h-96">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="relative flex-1">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={currentStepIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                    className="w-full absolute"
                  >
                    {steps[currentStepIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="mt-4 flex gap-4 justify-end">
                {currentStepIndex > 0 && (
                  <button type="button" onClick={back} className="py-3 px-6 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-lg">
                    Back
                  </button>
                )}
                <button type="submit" disabled={loading || (currentStepIndex === 0 && !data.companyName)} className="py-3 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                  {loading ? 'Saving...' : (currentStepIndex === steps.length - 1 ? 'Complete Setup' : 'Next')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step1({ companyName, updateFields }) {
  return (
    <div>
      <h1 className="text-5xl font-bold text-gray-800">Company Information</h1>
      <p className="text-xl text-gray-600 mt-4 mb-8">What is the name of your company?</p>
      <label htmlFor="companyName" className="block text-lg font-medium text-gray-700 text-left mb-2">
        Company Name
      </label>
      <input
        id="companyName"
        name="companyName"
        type="text"
        required
        value={companyName}
        onChange={(e) => updateFields(prev => ({...prev, companyName: e.target.value}))}
        placeholder="e.g., McDonald's, Starbucks, etc."
        className="mt-1 block w-full px-5 py-4 text-lg border border-gray-300 rounded-lg shadow-sm"
        autoFocus
      />
    </div>
  );
}

function Step2({ previewUrl, updateFields }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFields(prev => ({...prev, logoFile: file, previewUrl: reader.result}));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h1 className="text-5xl font-bold text-gray-800">Company Logo</h1>
      <p className="text-xl text-gray-600 mt-4 mb-8">Upload a logo for your company (optional).</p>
      <div className="mt-1 flex items-center space-x-6">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-300">
          {previewUrl ? (
            <img src={previewUrl} alt="Logo preview" className="h-full w-full object-cover" />
          ) : (
            <PhotoIcon className="h-12 w-12 text-gray-400" />
          )}
        </div>
        <label htmlFor="logo-upload" className="relative cursor-pointer bg-white rounded-lg font-medium text-blue-600 hover:text-blue-500 border border-gray-300 px-6 py-3 text-lg">
          <span>Upload a file</span>
          <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
        </label>
      </div>
    </div>
  );
}
