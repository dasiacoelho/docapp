import { initializeApp } from 'firebase/app';
import { getAuth, getUserByEmail } from 'firebase-admin/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD6Z46q79R7GVmU7D7dQ9YyX5ZtqQ1vQYg",
  authDomain: "docapp-e64d9.firebaseapp.com",
  projectId: "docapp-e64d9",
  storageBucket: "docapp-e64d9.firebasestorage.app",
  messagingSenderId: "663709327506",
  appId: "1:663709327506:web:58068b6d605a413c23864b"
};

// Initialize client app for Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_EMAIL = 'savio.vincent@gmail.com';

async function makeAdmin() {
  try {
    console.log(`Checking if ${ADMIN_EMAIL} is registered...`);
    
    // We can't use Admin SDK here easily, so let's check via Firestore if a patient/doctor profile exists
    // First, try to find the user by checking if there's a patient or doctor document
    
    console.log('Note: This script can only add the user to the admins collection if we know their UID.');
    console.log('You need to either:');
    console.log('1. Get the UID from Firebase Console > Authentication > Users');
    console.log('2. Or have the user log in first, then we can get their UID');
    console.log('');
    console.log('Once you have the UID, run this to make them admin:');
    console.log(`firebase firestore:set docapp-e64d9 admins/<UID> '{}' --project docapp-e64d9`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

makeAdmin();