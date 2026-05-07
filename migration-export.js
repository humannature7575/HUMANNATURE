const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
  apiKey: "AIzaSyBsK4GEVWCkRjUcbtUxEH6cOdjcASM_qqM",
  authDomain: "hn-moda-ecommerce-db.firebaseapp.com",
  projectId: "hn-moda-ecommerce-db",
  storageBucket: "hn-moda-ecommerce-db.firebasestorage.app",
  messagingSenderId: "596145735928",
  appId: "1:596145735928:web:ece724ba41db170e18130d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collections = ['products', 'categories', 'subcategories', 'settings', 'users', 'orders'];

async function exportData() {
  const allData = {};
  for (const colName of collections) {
    console.log(`Exporting ${colName}...`);
    try {
      const querySnapshot = await getDocs(collection(db, colName));
      allData[colName] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn(`Could not export ${colName}: ${e.message}`);
    }
  }
  fs.writeFileSync('firestore-export.json', JSON.stringify(allData, null, 2));
  console.log('Export complete! Saved to firestore-export.json');
}

exportData();
