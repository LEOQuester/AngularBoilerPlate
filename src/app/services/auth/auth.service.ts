import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BaseService } from '../base.service';
import { HttpClient } from '@angular/common/http';
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

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      this._user = JSON.parse(storedUser);
    }
  }

  login(data: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBase}core/login/`, data, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this._token = response.access_token;
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        this._user = response.user;
      })
    );
  }

  refreshToken(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${this.apiBase}core/token/refresh/`, {}, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this._token = response.access_token;
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiBase}core/logout/`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this._token = null;
        localStorage.removeItem(this.USER_KEY);
        this._user = null;
      })
    );
  }

  hasRole(roles: string[]): boolean {
    return this.user?.role.some(role => roles.includes(role)) ?? false;
  }
}
