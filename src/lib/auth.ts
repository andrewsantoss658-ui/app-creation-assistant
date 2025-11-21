// Mock authentication using localStorage

export interface User {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export const login = (email: string, password: string): User | null => {
  const users = JSON.parse(localStorage.getItem("gestum_users") || "[]");
  const user = users.find((u: User & { password: string }) => 
    u.email === email && u.password === password
  );
  
  if (user) {
    const { password, ...userWithoutPassword } = user;
    localStorage.setItem("gestum_current_user", JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  }
  
  return null;
};

export const register = (name: string, email: string, cpfCnpj: string, password: string): User => {
  const users = JSON.parse(localStorage.getItem("gestum_users") || "[]");
  
  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    email,
    cpfCnpj,
    password,
  };
  
  users.push(newUser);
  localStorage.setItem("gestum_users", JSON.stringify(users));
  
  const { password: _, ...userWithoutPassword } = newUser;
  localStorage.setItem("gestum_current_user", JSON.stringify(userWithoutPassword));
  
  return userWithoutPassword;
};

export const logout = () => {
  localStorage.removeItem("gestum_current_user");
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem("gestum_current_user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};

export const updateUser = (userId: string, updates: Partial<Omit<User, 'id'>>): boolean => {
  const users = JSON.parse(localStorage.getItem("gestum_users") || "[]");
  const userIndex = users.findIndex((u: User & { password: string }) => u.id === userId);
  
  if (userIndex === -1) return false;
  
  users[userIndex] = { ...users[userIndex], ...updates };
  localStorage.setItem("gestum_users", JSON.stringify(users));
  
  // Update current user
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    const updatedCurrentUser = { ...currentUser, ...updates };
    localStorage.setItem("gestum_current_user", JSON.stringify(updatedCurrentUser));
  }
  
  return true;
};

export const updatePassword = (userId: string, currentPassword: string, newPassword: string): boolean => {
  const users = JSON.parse(localStorage.getItem("gestum_users") || "[]");
  const userIndex = users.findIndex((u: User & { password: string }) => 
    u.id === userId && u.password === currentPassword
  );
  
  if (userIndex === -1) return false;
  
  users[userIndex].password = newPassword;
  localStorage.setItem("gestum_users", JSON.stringify(users));
  
  return true;
};
