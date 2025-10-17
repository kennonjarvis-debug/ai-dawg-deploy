/**
 * AuthHeader Example Widget
 * Copy-paste ready authentication header component
 *
 * Integration: Add to app/page.tsx header section
 */

'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import styles from './AuthHeader.example.module.css';

export function AuthHeader() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

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
        <button onClick={() => signIn()} className={styles.signInButton}>
          Sign In
        </button>
      </div>
    );
  }

  // Authenticated
  return (
    <div className={styles.authHeader}>
      <div className={styles.userInfo}>
        <span className={styles.userName}>{session.user?.name || session.user?.email}</span>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={styles.avatarButton}
          aria-label="User menu"
        >
          {session.user?.image ? (
            <img src={session.user.image} alt="Avatar" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {(session.user?.name || session.user?.email || '?')[0].toUpperCase()}
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
            <button onClick={() => signOut()} className={styles.dropdownButton}>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
