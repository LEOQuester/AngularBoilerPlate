import { Injectable } from '@angular/core';
import { Observable, tap, map, catchError, throwError, of, switchMap } from 'rxjs';
import { BaseService } from '../base.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LoginPayload, AuthResponse, User } from '../../models/auth/auth.interface';


interface RefreshResponse {
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {
  private readonly USER_KEY = 'user';
  private _user: User | null = null;
  private _token: string | null = null;

  constructor(protected override http: HttpClient) {
    super(http);
    this.loadStoredUser();
  }

  get user(): User | null {
    return this._user;
  }

  get token(): string | null {
    return this._token;
  }

  getUserStorageKey(): string {
    return this.USER_KEY;
  }

  private loadStoredUser(): void {
    console.log('AuthService: Attempting to load user from storage');
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      console.log('AuthService: Found stored user:', storedUser);
      this._user = JSON.parse(storedUser);
    } else {
      console.log('AuthService: No stored user found');
    }
  }

  login(data: LoginPayload): Observable<AuthResponse> {
    console.log('AuthService: Attempting login with:', { ...data, password: '***' });
    
    return this.http.post<AuthResponse>(
      `${this.apiBase}core/login/`, 
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
        console.log('AuthService: Login successful');
        this._token = response.access_token;
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        this._user = response.user;
      })
    );
  }

  verifyToken(): Observable<boolean> {
    if (!this._token) {
      return of(false);
    }

    return this.http.post<any>(
      `${this.apiBase}core/token/verify/`,
      { token: this._token }
    ).pipe(
      map(() => true), // If we get 200 response, token is valid
      catchError((error) => {
        console.log('Token verification failed:', error);
        return of(false);
      })
    );
  }

  verifyOrRefreshToken(): Observable<boolean> {
    // If no access token exists (e.g. after page reload), skip verify and try refresh directly
    if (!this._token) {
      console.log('No access token found, attempting refresh directly');
      return this.refreshToken().pipe(
        map(response => {
          this._token = response.access_token;
          console.log("Refresh token fetching successfull!");
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
            this._token = response.access_token;
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
      `${this.apiBase}core/token/refresh/`, 
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

  logout(): Observable<any> {
    console.log('AuthService: Logging out user');
    return this.http.post(`${this.apiBase}core/logout/`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        console.log('AuthService: Clearing user data after logout');
        this._token = null;
        localStorage.removeItem(this.USER_KEY);
        this._user = null;
      })
    );
  }

  // clearUserData(): void {
  //   console.log('AuthService: Clearing all user data');
  //   this._token = null;
  //   this._user = null;
  //   localStorage.removeItem(this.USER_KEY);
  // }

  hasRole(roles: string[]): boolean {
    return this.user?.role.some(role => roles.includes(role)) ?? false;
  }

  forgotPassword(data: { email: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiBase}core/auth/forgot-password/`, data);
  }

  resetPassword(data: { token: string; new_password: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiBase}core/auth/reset-password/`, data);
  }
}
