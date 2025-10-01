import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    user: (DefaultSession["user"] & { id?: string; emiratesId?: string }) | null;
  }

  interface User extends DefaultUser {
    accessToken?: string;
    emiratesId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    idToken?: string;
    emiratesId?: string;
    name?: string;
    email?: string;
  }
}
