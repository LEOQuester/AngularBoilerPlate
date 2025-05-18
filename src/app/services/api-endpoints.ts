/**
 * Centralized API endpoint configuration
 * All API endpoints used in the application should be defined here
 */

const BASE_PATH = '/api/api/auth/';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    /** POST: Login with username/email/phone and password */
    LOGIN: `${BASE_PATH}login/`,
    /** POST: Logout current user */
    LOGOUT: `${BASE_PATH}logout/`,
    /** POST: Verify current JWT token */
    VERIFY_TOKEN: `${BASE_PATH}token/verify/`,
    /** POST: Refresh JWT token using refresh token cookie */
    REFRESH_TOKEN: `${BASE_PATH}token/refresh/`,
    /** POST: Request password reset email */
    FORGOT_PASSWORD: `${BASE_PATH}forgot-password/`,
    /** POST: Reset password using token */
    RESET_PASSWORD: `${BASE_PATH}reset-password/`,
    /** POST: Register new user */
    REGISTER: `${BASE_PATH}register/`,
    /** POST: Verify OTP code with type EMAIL or PHONE */
    VERIFY_OTP: `${BASE_PATH}verify-otp/`,
    /** POST: Send email verification code */
    SEND_EMAIL_OTP: `${BASE_PATH}send-email-otp/`,
    /** POST: Send phone verification code */
    SEND_PHONE_OTP: `${BASE_PATH}send-phone-otp/`,
    /** GET: Get user verification status */
    VERIFICATION_STATUS: `${BASE_PATH}verification-status/`,
  },
  
  // Profile endpoints
  PROFILE: {
    /** GET/PATCH/DELETE: Manage user profile */
    SELF: `${BASE_PATH}profile/`,
  }
} as const;

// Type for strongly-typed endpoint access
export type ApiEndpoints = typeof API_ENDPOINTS;