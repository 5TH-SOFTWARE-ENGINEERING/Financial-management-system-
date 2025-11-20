// lib/services/auth-service.ts
import { User, UserType } from "../rbac/models";

interface LoginResponse {
  user: User;
  access_token: string;
}

export const authService = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    try {
      const formData = new FormData();
      formData.append('username', identifier);
      formData.append('password', password);

      const loginResponse = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        body: formData,
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
         const message = Array.isArray(loginData.detail)
          ? loginData.detail.map((e: any) => e.msg).join(", ")
          : loginData.detail || "Login failed!";
        throw new Error(message);
      }
      const accessToken = loginData.access_token;
      const userResponse = await fetch("http://localhost:8000/api/v1/users/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user profile after login");
      }

      const rawUser = await userResponse.json();
      const user: User = {
        id: rawUser.id,
        username: rawUser.username,
        email: rawUser.email ?? identifier,
        full_name: rawUser.full_name ?? "",
        phone: rawUser.phone ?? null,
        role: rawUser.role as UserType,
        is_active: rawUser.is_active ?? true,
        created_at: rawUser.created_at ? new Date(rawUser.created_at) : new Date(),
        updated_at: rawUser.updated_at ? new Date(rawUser.updated_at) : new Date(),
        last_login: new Date(), 
      };

      return {
        user,
        access_token: accessToken,
      };

    } catch (err) {
      console.error("Login Error:", err);
      throw err;
    }
  },
};