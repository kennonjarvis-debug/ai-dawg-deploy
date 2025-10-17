/**
 * AuthHeader Widget
 * Displays user authentication status and controls
 * Shows sign in button when not authenticated, user dropdown when authenticated
 */

'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import styles from './AuthHeader.module.css';

export function AuthHeader() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className={styles.authHeader}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <div className={styles.authHeader}>
        <button
          onClick={() => signIn()}
          className={styles.signInButton}
          aria-label="Sign in"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Authenticated
  return (
    <div className={styles.authHeader} ref={dropdownRef}>
      <div className={styles.userInfo}>
        <span className={styles.userName}>
          {session.user?.name || session.user?.email}
        </span>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={styles.avatarButton}
          aria-label="User menu"
          aria-expanded={showDropdown}
        >
          {session.user?.image ? (
            <img src={session.user.image} alt="Avatar" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {((session.user?.name || session.user?.email || '?')[0] || '?').toUpperCase()}
            </div>
          )}
        </button>

        {showDropdown && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownItem}>
              <strong>{session.user?.name}</strong>
              <span className={styles.email}>{session.user?.email}</span>
            </div>
            <div className={styles.divider} />
            <button
              onClick={() => signOut()}
              className={styles.dropdownButton}
              aria-label="Sign out"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
