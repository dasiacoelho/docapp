import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD6Z46q79R7GVmU7D7dQ9YyX5ZtqQ1vQYg",
  authDomain: "docapp-e64d9.firebaseapp.com",
  projectId: "docapp-e64d9",
  storageBucket: "docapp-e64d9.firebasestorage.app",
  messagingSenderId: "663709327506",
  appId: "1:663709327506:web:58068b6d605a413c23864b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = [
  'clinics',
  'doctors',
  'patients',
  'appointments',
  'slots',
  'notifications',
  'admins'
];

async function deleteCollection(db, collectionName) {
  const collRef = collection(db, collectionName);
  const snapshot = await getDocs(query(collRef));
  
  if (snapshot.empty) {
    console.log(`${collectionName}: already empty`);
    return;
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach((document) => {
    batch.delete(doc(db, collectionName, document.id));
  });
  
  await batch.commit();
  console.log(`✓ Deleted ${snapshot.size} documents from ${collectionName}`);
}

async function resetFirestore() {
  try {
    console.log('Starting Firestore reset...\n');
    
    for (const coll of COLLECTIONS) {
      await deleteCollection(db, coll);
    }
    
    console.log('\n✅ Firestore reset complete - all collections are now empty');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting Firestore:', error);
    process.exit(1);
  }
}

resetFirestore();