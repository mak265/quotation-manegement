import { defineStore } from 'pinia'
import { db } from '../services/firebase' 
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'

export const useProductStore = defineStore('productStore', {
  state: () => ({
    products: [],
    loading: false
  }),

  actions: {
    async fetchProducts() {
      this.loading = true
      try {
        const querySnapshot = await getDocs(collection(db, "products"))
        this.products = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        this.loading = false
      }
    },

    async addProduct(product) {
      try {
        const docRef = await addDoc(collection(db, "products"), product)
        this.products.push({ id: docRef.id, ...product })
      } catch (error) {
        console.error("Error adding product:", error)
      }
    },

    async updateProduct(productId, updatedProduct) {
      try {
        await updateDoc(doc(db, "products", productId), updatedProduct)
        this.products = this.products.map(product => {
          if (product.id === productId) {
            return { ...product, ...updatedProduct }
          }
          return product
        })
      } catch (error) {
        console.error("Error updating product:", error)
      }
    },

    async deleteProduct(productId) {
      try {
        await deleteDoc(doc(db, "products", productId))
        this.products = this.products.filter(product => product.id !== productId)
      } catch (error) {
        console.error("Error deleting product:", error)
      }
    }
  }
})