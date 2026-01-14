import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete
    // even if your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Standalone output for optimized deployments
  env: {
    // OIDC/Auth Configuration
    NEXT_PUBLIC_OIDC_LOGOUT_URL: process.env.OIDC_LOGOUT_URL,
    NEXT_PUBLIC_OIDC_LOGOUT_RETURN_TO: process.env.OIDC_LOGOUT_RETURN_TO,
    NEXT_PUBLIC_OIDC_ISSUER: process.env.OIDC_ISSUER || process.env.AUTH0_ISSUER,
    NEXT_PUBLIC_AUTH0_ISSUER: process.env.AUTH0_ISSUER,
    
    // Public URLs
    NEXT_PUBLIC_URL: process.env.PUBLIC_URL || process.env.NEXTAUTH_URL,
    
    // File Server Configuration
    NEXT_PUBLIC_FILE_SERVER_URL: process.env.FILE_SERVER_URL,
    
    // PP API Base URL (if needed on client)
    NEXT_PUBLIC_PP_BASE_URL: process.env.PP_BASE_URL,
  },
};

export default nextConfig;
