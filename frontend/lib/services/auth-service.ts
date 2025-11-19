// lib/services/auth-service.ts
import { User, UserType } from "../rbac/models";

interface LoginResponse {
  user: User;
  access_token: string;
}

export const authService = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    try {
      console.log("🔐 Login Request:", {
        identifier,
        password: "[HIDDEN]",
      });

      // Use FormData to match OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', identifier); 
      formData.append('password', password);

      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        body: formData, // No Content-Type - let browser set multipart/form-data
      });

      const data = await response.json();

      console.group(" Response from the backend");
      console.log("Status:", response.status);
      console.log("Data:", data);
      console.groupEnd();

      if (response.status === 401) {
        throw new Error("Invalid credentials Try again!");
      }

      // Handle backend validation & error messages nicely
      if (!response.ok) {
        const message = Array.isArray(data.detail)
          ? data.detail.map((e: any) => e.msg).join(", ")
          : data.detail || "Login failed!";

        throw new Error(message);//throw a new error message
      }

      // Gracefully handle different backend structures
      const rawUser = data.user || data.data?.user || null;

      if (!rawUser) {
        console.error(" Unexpected Response emerged:", data);
        throw new Error("Unexpected response format: user missing");
      }

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
        last_login: rawUser.last_login ? new Date(rawUser.last_login) : null,
      };

      console.log("Processed User:", user);

      return {
        user,
        access_token: data.access_token,
      };
    } catch (err) {
      console.error("Login Error!:", err);
      throw err;
    }
  },
};
