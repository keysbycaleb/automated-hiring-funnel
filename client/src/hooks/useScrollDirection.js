import { useState, useEffect } from 'react';

/**
 * A custom hook to track the scroll direction.
 * @returns {'up' | 'down'} The current scroll direction.
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState('up');

  useEffect(() => {
    let lastScrollY = window.pageYOffset;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      
      // We only update state if the direction has changed to avoid unnecessary re-renders.
      if (direction !== scrollDirection) {
        setScrollDirection(direction);
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };

    window.addEventListener('scroll', updateScrollDirection);

    // Cleanup function to remove the event listener when the component unmounts.
    return () => {
      window.removeEventListener('scroll', updateScrollDirection);
    };
  }, [scrollDirection]); // Re-run the effect only when the scroll direction changes.

  return scrollDirection;
}
