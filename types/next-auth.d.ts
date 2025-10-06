import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    // Small pointer to access token stored server-side
    atKey?: string;
    user: (DefaultSession["user"] & { id?: string; emiratesId?: string }) | null;
  }

  interface User extends DefaultUser {
    accessToken?: string;
    emiratesId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    // Small pointer to access token stored server-side
    atKey?: string;
    emiratesId?: string;
    name?: string;
    email?: string;
  }
}
