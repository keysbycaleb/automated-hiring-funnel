import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeIcon, UsersIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useScrollDirection } from '../hooks/useScrollDirection';

// --- Animation Variants ---
// Using variants cleans up the component and makes the animation logic declarative and easy to read.

const sidebarVariants = {
  expanded: {
    width: '16rem', // 256px
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 100,
      duration: 0.3, // Restored to the original 300ms duration
    },
  },
  collapsed: {
    width: '5rem', // 80px
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 100,
      duration: 0.3, // Restored to the original 300ms duration
    },
  },
};

const headerVariants = {
  visible: { y: 0 },
  hidden: { y: '-100%' },
};

const navContainerVariants = {
  visible: { y: 0 },
  hidden: { y: '-5rem' }, // 80px, the height of the header
};

const textVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
};

export default function Sidebar({ isMobileMenuOpen, onLinkClick, isReordering, projectName = 'Hiring' }) {
  const [isHovered, setIsHovered] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const scrollDirection = useScrollDirection();

  const isExpanded = (isDesktop && isHovered && !isReordering) || isMobileMenuOpen;
  const isVisible = isDesktop || isMobileMenuOpen;

  const firstLetter = projectName.charAt(0);

  const navLinkClasses = ({ isActive }) =>
    `flex items-center h-14 px-6 transition-colors duration-200 
    ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`;

  return (
    <motion.div
      // Use Framer Motion's layout prop to animate size changes smoothly
      layout
      // Animate between the expanded and collapsed variants
      animate={isExpanded ? 'expanded' : 'collapsed'}
      variants={sidebarVariants}
      initial={false} // Prevent initial animation on page load
      className={`
        bg-gray-800 text-white flex flex-col overflow-hidden
        ${isDesktop ? 'sticky top-0 h-screen' : 'fixed top-0 left-0 h-full z-20'}
        ${isVisible ? 'translate-x-0' : '-translate-x-full'}
      `}
      onMouseEnter={() => isDesktop && setIsHovered(true)}
      onMouseLeave={() => isDesktop && setIsHovered(false)}
    >
      <motion.div
        variants={headerVariants}
        animate={scrollDirection === 'down' && isDesktop ? 'hidden' : 'visible'}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex items-center justify-center h-20 border-b border-gray-700 shrink-0 relative"
      >
        {/* AnimatePresence handles the enter/exit animations cleanly, preventing ghosting */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isExpanded ? 'projectName' : 'firstLetter'} // Key change triggers the animation
            variants={textVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }} // Fast and clean text transition
            className={`absolute ${isExpanded ? 'text-2xl' : 'text-3xl'} font-bold whitespace-nowrap`}
          >
            {isExpanded ? projectName : firstLetter}
          </motion.span>
        </AnimatePresence>

        {!isDesktop && (
          <button onClick={onLinkClick} className="absolute top-6 right-6">
            <XMarkIcon className="h-8 w-8 text-white" />
          </button>
        )}
      </motion.div>

      <motion.nav
        variants={navContainerVariants}
        animate={scrollDirection === 'down' && isDesktop ? 'hidden' : 'visible'}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-1 pt-4"
      >
        <NavLink to="/" className={navLinkClasses} onClick={onLinkClick}>
          <HomeIcon className="h-6 w-6 shrink-0" />
          <motion.span animate={{ opacity: isExpanded ? 1 : 0 }} className="ml-5 font-medium whitespace-nowrap">
            Dashboard
          </motion.span>
        </NavLink>
        <NavLink to="/applicants" className={navLinkClasses} onClick={onLinkClick}>
          <UsersIcon className="h-6 w-6 shrink-0" />
          <motion.span animate={{ opacity: isExpanded ? 1 : 0 }} className="ml-5 font-medium whitespace-nowrap">
            Applicants
          </motion.span>
        </NavLink>
        <NavLink to="/questionnaire" className={navLinkClasses} onClick={onLinkClick}>
          <DocumentTextIcon className="h-6 w-6 shrink-0" />
          <motion.span animate={{ opacity: isExpanded ? 1 : 0 }} className="ml-5 font-medium whitespace-nowrap">
            Questionnaire
          </motion.span>
        </NavLink>
      </motion.nav>
    </motion.div>
  );
}
