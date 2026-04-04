import { pb } from "./pocketbase";

export const getUserRole = async () => {
  try {
    const user = pb.authStore.model;
    if (!user) return null;
    
    // Assuming your users collection has 'role' and 'class' fields
    return {
      role: user.role || "guru", // "admin" or "guru"
      class: user.class || null, // "10A", "10B", etc.
      name: user.name || user.username,
      id: user.id,
    };
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

export const isAuthenticated = () => {
  return pb.authStore.isValid;
};

export const logout = () => {
  pb.authStore.clear();
  window.location.href = "/login";
};  