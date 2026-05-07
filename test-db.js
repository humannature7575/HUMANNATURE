/* eslint-disable @typescript-eslint/no-require-imports */
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB70yDf4WMVB5opibIAcSErWAhOlVU8EWM",
  authDomain: "humannature-291de.firebaseapp.com",
  projectId: "humannature-291de",
  storageBucket: "humannature-291de.firebasestorage.app",
  messagingSenderId: "282805018834",
  appId: "1:282805018834:web:06dc77e7c1cc9074d1cd0b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  console.log('Testing connection to:', firebaseConfig.projectId);
  try {
    await setDoc(doc(db, 'test_collection', 'test_doc'), {
      message: 'Hello from migration script',
      timestamp: new Date()
    });
    console.log('Success! Connection is working.');
  } catch (e) {
    console.error('Connection failed:', e.message);
    if (e.code) console.error('Error code:', e.code);
  }
}

test();
