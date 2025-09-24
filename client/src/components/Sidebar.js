import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeIcon, UsersIcon, DocumentTextIcon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext'; // New import

// --- Animation Variants ---
const sidebarVariants = {
  expanded: {
    width: '16rem', // 256px
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 100,
      duration: 0.3,
    },
  },
  collapsed: {
    width: '5rem', // 80px
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 100,
      duration: 0.3,
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

export default function Sidebar({ isMobileMenuOpen, onLinkClick, isReordering }) {
  const [isHovered, setIsHovered] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const scrollDirection = useScrollDirection();
  const { currentUser, logout } = useAuth();
  const { profile } = useProfile(); // Get profile data
  const navigate = useNavigate();

  // --- Dynamic Branding ---
  const projectName = profile?.companyName || 'Hiring';
  const logoUrl = profile?.logoUrl;
  const firstLetter = projectName ? projectName.charAt(0).toUpperCase() : 'H';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const isExpanded = (isDesktop && isHovered && !isReordering) || isMobileMenuOpen;
  const isVisible = isDesktop || isMobileMenuOpen;
  
  const navLinkClasses = ({ isActive }) =>
    `flex items-center h-14 px-6 transition-colors duration-200 
     ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`;

  const renderCollapsedIcon = () => {
    if (logoUrl) {
      return (
        <img 
          src={logoUrl} 
          alt={`${projectName} Logo`} 
          className="h-10 w-10 rounded-full object-cover" 
        />
      );
    }
    return (
      <span className="text-3xl font-bold">{firstLetter}</span>
    );
  };

  return (
    <motion.div
      layout
      animate={isExpanded ? 'expanded' : 'collapsed'}
      variants={sidebarVariants}
      initial={false}
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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isExpanded ? 'projectName' : 'firstLetter'}
            variants={textVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
            className="absolute flex items-center justify-center"
          >
            {isExpanded ? <span className="text-2xl font-bold whitespace-nowrap">{projectName}</span> : renderCollapsedIcon()}
          </motion.div>
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

      {/* User Info and Logout Section */}
      <div className="border-t border-gray-700 shrink-0">
        {currentUser && (
           <div 
             className="flex items-center h-14 px-6 text-gray-400"
             title={currentUser.email}
           >
            <img 
              src={`https://ui-avatars.com/api/?name=${currentUser.email.charAt(0)}&background=374151&color=fff&size=24`} 
              alt="User avatar"
              className="h-6 w-6 rounded-full shrink-0" 
            />
             <motion.span 
              animate={{ opacity: isExpanded ? 1 : 0 }} 
              className="ml-5 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {currentUser.email}
            </motion.span>
          </div>
        )}
        <button onClick={handleLogout} className={navLinkClasses({isActive: false}) + ' w-full'}>
          <ArrowRightOnRectangleIcon className="h-6 w-6 shrink-0" />
          <motion.span animate={{ opacity: isExpanded ? 1 : 0 }} className="ml-5 font-medium whitespace-nowrap">
            Log Out
          </motion.span>
        </button>
      </div>

    </motion.div>
  );
}
