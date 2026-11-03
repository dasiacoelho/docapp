import { getAuth, onIdTokenChanged, User } from 'firebase/auth';
import { getFirebaseAuth } from '../../services/firebase';

export function setupAuthTokenRefresh() {
  const auth = getFirebaseAuth();
  
  onIdTokenChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const tokenResult = await user.getIdTokenResult(true);
        console.log('Token refreshed, claims:', tokenResult.claims);
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }
  });
}

export async function forceTokenRefresh(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    await auth.currentUser.getIdToken(true);
  }
}

export async function getCustomClaims(user: User): Promise<Record<string, any>> {
  const result = await user.getIdTokenResult();
  return result.claims;
}

export async function waitForCustomClaim(user: User, claimKey: string, expectedValue: any, maxAttempts = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const tokenResult = await user.getIdTokenResult(true);
    if (tokenResult.claims[claimKey] === expectedValue) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}