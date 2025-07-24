import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

// Save user email and password
export async function saveUserToFirestore(email, password) {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      email,
      password, // For production, you should hash this!
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.error("Error saving to Firestore:", err);
    throw err;
  }
}

// Fetch all users (for admin)
export async function fetchAllUsersFromFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (err) {
    console.error("Error fetching from Firestore:", err);
    throw err;
  }
}