const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
  apiKey: "AIzaSyB70yDf4WMVB5opibIAcSErWAhOlVU8EWM",
  authDomain: "humannature-291de.firebaseapp.com",
  projectId: "humannature-291de",
  storageBucket: "humannature-291de.firebasestorage.app",
  messagingSenderId: "282805018834",
  appId: "1:282805018834:web:06dc77e7c1cc9074d1cd0b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'humannature');

async function importData() {
  const data = JSON.parse(fs.readFileSync('firestore-export.json', 'utf8'));
  for (const colName in data) {
    console.log(`Importing ${colName}...`);
    const docs = data[colName];
    for (const d of docs) {
      const { id, ...docData } = d;
      try {
        await setDoc(doc(db, colName, id), docData);
        console.log(`  Imported ${colName}/${id}`);
      } catch (e) {
        console.error(`  Error importing ${colName}/${id}: ${e.message}`);
      }
    }
  }
  console.log('Import complete!');
}

importData();
