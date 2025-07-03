import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError, of, switchMap, BehaviorSubject } from 'rxjs';
import { BaseService } from '../base.service';
import { HttpClient } from '@angular/common/http';
import { LoginPayload, AuthResponse, User, RegistrationPayload, VerificationStatus } from '../../models/auth/auth.interface';
import { API_ENDPOINTS } from '../api-endpoints';
import { TokenService } from './token.service';

interface RefreshResponse {
  access_token: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  gender: "M" | "F" | "O" | null;
  address: string;
  dob: string;
  profile_pic: string | null;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  nic?: string;  // Optional National ID Card number
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {
  private readonly USER_KEY = 'user';
  private userSubject = new BehaviorSubject<User | null>(null);
  private verificationStatusSubject = new BehaviorSubject<VerificationStatus | null>(null);
  
  user$ = this.userSubject.asObservable();
  verificationStatus$ = this.verificationStatusSubject.asObservable();

  constructor(
    protected override http: HttpClient, 
    private router: Router,
    private tokenService: TokenService
  ) {
    super(http);
    this.loadStoredUser();
  }

  get user(): User | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return this.tokenService.getToken();
  }

  getUserStorageKey(): string {
    return this.USER_KEY;
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      this.userSubject.next(JSON.parse(storedUser));
      // First refresh token, then check verification status only if we have a valid token
      this.verifyOrRefreshToken().subscribe(isValid => {
        if (isValid) {
          this.checkVerificationStatus().subscribe();
        }
      });
    }
  }

  login(data: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data,
      {
        withCredentials: true,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    ).pipe(
      tap(response => {
        this.tokenService.setToken(response.access_token);
        this.userSubject.next(response.user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        
        // Check verification status after successful login
        this.checkVerificationStatus().subscribe();
      })
    );
  }

  checkVerificationStatus(): Observable<VerificationStatus> {
    const token = this.tokenService.getToken();    return this.http.get<VerificationStatus>(
      API_ENDPOINTS.AUTH.VERIFICATION_STATUS,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    ).pipe(
      tap(status => {
        this.verificationStatusSubject.next(status);
        
        // Update user if verification status has changed
        if (this.user && (
          this.user.is_email_verified !== status.is_email_verified ||
          this.user.is_phone_verified !== status.is_phone_verified
        )) {
          const updatedUser = {
            ...this.user,
            is_email_verified: status.is_email_verified,
            is_phone_verified: status.is_phone_verified
          };
          this.userSubject.next(updatedUser);
          localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
        }

        // If not verified, redirect to update-profile
        if (!status.is_verified) {
          this.router.navigate(['/update-profile']);
        }
      })
    );
  }

  register(data: RegistrationPayload): Observable<{ message: string }> {
    // Convert to FormData if there's a profile picture
    let requestData: RegistrationPayload | FormData = data;
    let headers: { [key: string]: string } = {
      'Accept': 'application/json'
    };

    if (data.profile_pic instanceof File) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        const value = data[key as keyof RegistrationPayload];
        if (value !== undefined && value !== null) {
          if (key === 'dob' && value instanceof Date) {
            formData.append(key, value.toISOString().split('T')[0]);
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });
      requestData = formData;
    } else {
      headers['Content-Type'] = 'application/json';
    }

    return this.http.post<{ message: string }>(
      API_ENDPOINTS.AUTH.REGISTER,
      requestData,
      { headers }
    );
  }

  verifyToken(): Observable<boolean> {
    if (!this.tokenService.getToken()) {
      return of(false);
    }

    return this.http.post<any>(
      API_ENDPOINTS.AUTH.VERIFY_TOKEN,
      { token: this.tokenService.getToken() }
    ).pipe(
      map(() => true),
      catchError((error) => {
        console.log('Token verification failed:', error);
        return of(false);
      })
    );
  }

  verifyOrRefreshToken(): Observable<boolean> {
    // If no access token exists (e.g. after page reload), skip verify and try refresh directly
    if (!this.tokenService.getToken()) {
      console.log('No access token found, attempting refresh directly');
      return this.refreshToken().pipe(
        map(response => {
          this.tokenService.setToken(response.access_token);
          console.log("Refresh token fetching successful!");
          return true;
        }),
        catchError(error => {
          console.log('Token refresh failed:', error);
          return of(false);
        })
      );
    }

    // If we have an access token, try verify first
    return this.verifyToken().pipe(
      switchMap(isValid => {
        if (isValid) {
          return of(true);
        }
        // Token is invalid, try to refresh
        console.log('Token invalid, attempting refresh');
        return this.refreshToken().pipe(
          map(response => {
            this.tokenService.setToken(response.access_token);
            return true;
          }),
          catchError(error => {
            console.log('Token refresh failed:', error);
            return of(false);
          })
        );
      })
    );
  }

  refreshToken(): Observable<RefreshResponse> {
    console.log('AuthService: Attempting to refresh token');
    
    return this.http.post<RefreshResponse>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      {}, 
      {
        withCredentials: true,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
  }

  private clearAllCookies(): void {
    // Get all cookies and clear them
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  }

  private clearUserData(): void {
    console.log('AuthService: Clearing all user data');
    this.tokenService.clearToken();
    this.userSubject.next(null);
    localStorage.removeItem(this.USER_KEY);
    this.clearAllCookies();
  }

  logout(): Observable<any> {
    console.log('AuthService: Logging out user');
    return this.http.post(API_ENDPOINTS.AUTH.LOGOUT, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        console.log('AuthService: Clearing user data after logout');
        this.clearUserData();
      }),
      catchError((error) => {
        // Even if the server logout fails, clear local data
        console.log('AuthService: Logout failed but clearing local data anyway');
        this.clearUserData();
        return throwError(() => error);
      })
    );
  }

  hasRole(roles: string[]): boolean {
    if (!this.user || !Array.isArray(this.user.role)) {
      return false;
    }
    return this.user.role.some(role => roles.includes(role));
  }

  forgotPassword(data: { email: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  }

  resetPassword(data: { token: string; new_password: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
  }

  verifyEmail(code: string): Observable<any> {
    const token = this.tokenService.getToken();
    console.log('AuthService: Verifying email with code:', code);
    return this.http.post(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      { otp: code, verification_type: 'EMAIL' },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    ).pipe(
      tap(response => {
      console.log('Verification response:', response);
      this.checkVerificationStatus().subscribe(status => {
        console.log('Verification status:', status);
      });
    })
    );
  }

  verifyPhone(code: string): Observable<any> {
    const token = this.tokenService.getToken();
    return this.http.post(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      { otp: code, verification_type: 'PHONE' },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    ).pipe(
      tap(() => this.checkVerificationStatus().subscribe())
    );
  }
  resendEmailVerification(): Observable<any> {
    const token = this.tokenService.getToken();
    return this.http.post(
      API_ENDPOINTS.AUTH.SEND_EMAIL_OTP,
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );
  }

  resendPhoneVerification(): Observable<any> {
    const token = this.tokenService.getToken();
    return this.http.post(
      API_ENDPOINTS.AUTH.SEND_PHONE_OTP,
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );
  }

  refreshUser(): void {
    const userString = localStorage.getItem(this.USER_KEY);
    if (userString) {
      const user = JSON.parse(userString);
      this.userSubject.next(user);
    }
  }

  /**
   * Get the current user's profile
   */
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(API_ENDPOINTS.PROFILE.SELF);
  }

  /**
   * Update the current user's profile with only the changed fields
   */  updateProfile(data: Partial<RegistrationPayload> | FormData): Observable<UserProfile> {
    const headers: any = {
      'Accept': 'application/json'
    };

    // Don't set Content-Type for FormData, let the browser set it with the boundary
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return this.http.patch<UserProfile>(
      API_ENDPOINTS.PROFILE.SELF, 
      data,
      { headers }
    );
  }
  
  /**
   * Delete the current user's account
   */
  deleteAccount(): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.PROFILE.SELF);
  }

  /**
   * Upload a new profile picture
   */
  uploadProfilePicture(file: File): Observable<{ profile_picture: string }> {
    const formData = new FormData();
    formData.append('profile_picture', file);
    return this.http.patch<{ profile_picture: string }>(
      `${API_ENDPOINTS.PROFILE.SELF}picture/`,
      formData
    );
  }
  /**
   * Send email verification code
   */
  sendEmailVerificationCode(): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS.AUTH.SEND_EMAIL_OTP, {});
  }

  /**
   * Verify email with OTP
   */
  verifyEmailOtp(otp: string): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS.AUTH.VERIFY_OTP, { otp: otp, verification_type: 'EMAIL' });
  }

  /**
   * Send phone verification code
   */
  sendPhoneVerificationCode(): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS.AUTH.SEND_PHONE_OTP, {});
  }

  /**
   * Verify phone with OTP
   */
  verifyPhoneOtp(otp: string): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS.AUTH.VERIFY_OTP, { otp: otp, verification_type: 'PHONE' });
  }

}
