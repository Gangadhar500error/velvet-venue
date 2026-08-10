export type UserRole = "admin" | "vendor" | "customer";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string | null;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  portal?: string;
  permissions?: string[];
  data_scope?: string;
}

export interface LoginResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    role: UserRole;
    portal: string;
    permissions: string[];
  };
}

export interface SignupPayload {
  role: "customer" | "vendor";
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  confirm_password: string;
}

export interface MeResponse {
  success: boolean;
  id: string;
  email: string;
  role: UserRole;
  portal: string;
  permissions: string[];
  data_scope: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}
