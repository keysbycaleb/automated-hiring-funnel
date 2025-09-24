import React, { createContext, useState, useContext } from 'react';

const ReorderingContext = createContext(null);

export const useReordering = () => {
  const context = useContext(ReorderingContext);
  if (!context) {
    throw new Error('useReordering must be used within a ReorderingProvider');
  }
  return context;
};

export const ReorderingProvider = ({ children }) => {
  const [isReordering, setIsReordering] = useState(false);

  return (
    <ReorderingContext.Provider value={{ isReordering, setIsReordering }}>
      {children}
    </ReorderingContext.Provider>
  );
};
