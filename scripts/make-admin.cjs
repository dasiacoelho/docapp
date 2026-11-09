const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
  projectId: 'docapp-e64d9'
});

const db = getFirestore();
const uid = '8u8gh169HQQtx7VKilRH6b3MbjL2';

async function makeAdmin() {
  try {
    const adminRef = db.collection('admins').doc(uid);
    await adminRef.set({});
    console.log(`✅ Admin document created for UID: ${uid}`);
    console.log('User savio.vincent@gmail.com is now an admin!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeAdmin();