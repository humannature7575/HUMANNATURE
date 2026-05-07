import "server-only";
import { adminDb } from './firebaseAdmin';

export interface ServerProductResult {
  id: string;
  data: FirebaseFirestore.DocumentData;
}

/**
 * Fetch a product by slug using the Firebase Admin SDK.
 * This is more reliable for Server Components in production.
 */
export async function getServerProductBySlug(slug: string): Promise<ServerProductResult | null> {
  console.log(`[ProductServiceServer] Fetching product by slug: ${slug}`);
  
  try {
    // 1. Try querying by slug field
    const productsRef = adminDb.collection('products');
    const slugQuery = await productsRef.where('slug', '==', slug).limit(1).get();
    
    if (!slugQuery.empty) {
      const doc = slugQuery.docs[0];
      console.log(`[ProductServiceServer] Found product by slug field: ${doc.id}`);
      return { id: doc.id, data: doc.data() };
    }
    
    // 2. Fallback to fetching by document ID
    console.log(`[ProductServiceServer] Slug query empty, trying document ID: ${slug}`);
    const docRef = productsRef.doc(slug);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      console.log(`[ProductServiceServer] Found product by document ID: ${docSnap.id}`);
      const data = docSnap.data();
      if (data) {
          return { id: docSnap.id, data };
      }
    }
    
    console.log(`[ProductServiceServer] Product not found for: ${slug}`);
    return null;
  } catch (error) {
    console.error(`[ProductServiceServer] Error in getServerProductBySlug for ${slug}:`, error);
    throw error;
  }
}

/**
 * Fetch sibling products (same groupId) using Admin SDK.
 */
export async function getServerColorSiblings(groupId: string): Promise<{ slug: string; colorName: string; }[]> {
  if (!groupId) return [];
  
  try {
    const productsRef = adminDb.collection('products');
    const siblingSnap = await productsRef.where('groupId', '==', groupId).get();
    
    return siblingSnap.docs.map(d => {
      const data = d.data();
      return {
        slug: data.slug || d.id,
        colorName: data.colorName || 'Standart',
      };
    });
  } catch (error) {
    console.error(`[ProductServiceServer] Error fetching color siblings for ${groupId}:`, error);
    return [];
  }
}
