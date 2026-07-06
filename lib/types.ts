export type Role = "user" | "admin";
export type UserStatus = "active" | "blocked";
export type ProductStatus = "active" | "hidden";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  avatar: string | null;
  createdAt: string;
  lastActiveAt: string;
  favorites: string[];
  history: string[];
}

/** User shape safe to send to the client (no password hash). */
export type PublicUser = Omit<User, "favorites" | "history">;

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  description: string;
  image: string;
  stock: number;
  views: number;
  createdAt: string;
}

export interface Activity {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
}

export interface AnalyticsPoint {
  label: string;
  users: number;
  sales: number;
  activity: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
