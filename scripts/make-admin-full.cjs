const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('../.kilo/gcp-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'docapp-e64d9'
});

const db = getFirestore();
const auth = getAuth();
const uid = '8u8gh169HQQtx7VKilRH6b3MbjL2';

async function makeAdmin() {
  try {
    // 1. Create admin document in Firestore
    const adminRef = db.collection('admins').doc(uid);
    await adminRef.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log(`✅ Admin document created in Firestore for UID: ${uid}`);

    // 2. Set custom claim for immediate role detection
    await auth.setCustomUserClaims(uid, { role: 'admin' });
    console.log(`✅ Custom claim 'role: admin' set for UID: ${uid}`);

    // 3. Verify
    const userRecord = await auth.getUser(uid);
    console.log(`✅ User verified:`, userRecord.email, '| Claims:', userRecord.customClaims);

    console.log('\n🎉 savio.vincent@gmail.com is now an admin!');
    console.log('Ask them to log out and log back in for claims to refresh.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeAdmin();