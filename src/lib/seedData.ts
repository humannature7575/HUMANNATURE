import { db } from "@/lib/firebase";
import { setDoc, doc } from "firebase/firestore";
import { catalogProducts, catalogCategories, productSubcategories, accessorySubcategories } from "@/lib/catalog";

export async function seedDatabase() {
  console.log("Seeding started...");
  try {
    // Seed Categories
    for (const category of catalogCategories) {
      const categoryRef = doc(db, "categories", category.slug);
      await setDoc(categoryRef, {
        slug: category.slug,
        title: category.title,
        description: category.description,
      });
      console.log(`Category seeded: ${category.title}`);
    }

    // Seed Subcategories (optional, but good if we want to migrate them too)
    const allSubcategories = [...productSubcategories, ...accessorySubcategories];
    for (const subcategory of allSubcategories) {
      const subcategoryRef = doc(db, "subcategories", subcategory.slug);
      await setDoc(subcategoryRef, {
        slug: subcategory.slug,
        title: subcategory.title,
        description: subcategory.description,
        filters: subcategory.filters,
      });
      console.log(`Subcategory seeded: ${subcategory.title}`);
    }

    // Seed Products
    for (const product of catalogProducts) {
      const productRef = doc(db, "products", product.id);
      await setDoc(productRef, {
        ...product, // Spreads all existing fields (title, price, TR/AR names if added, etc.)
      });
      console.log(`Product seeded: ${product.title}`);
    }

    console.log("Seeding completed successfully!");
    return { success: true, message: "Database seeded successfully" };
  } catch (error) {
    console.error("Error seeding database: ", error);
    return { success: false, message: "Error seeding database", error };
  }
}
