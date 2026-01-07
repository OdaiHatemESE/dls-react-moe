import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    // Small pointer to access token stored server-side
    atKey?: string;
    user: (DefaultSession["user"] & { id?: string; emiratesId?: string; phoneNumber?: string }) | null;
    // Optional identity profile blob (debug view may display this if present)
    identityProfile?: Record<string, unknown>;
  }

  interface User extends DefaultUser {
    accessToken?: string;
    emiratesId?: string;
    phoneNumber?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    // Small pointer to access token stored server-side
    atKey?: string;
    emiratesId?: string;
    phoneNumber?: string;
    name?: string;
    email?: string;
  }
}
