import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  
  // Add token if available
  if (authService.token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authService.token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('token/refresh')) {
        // Try to refresh token
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Retry the original request with new token from AuthService
            const updatedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${authService.token}`
              }
            });
            return next(updatedReq);
          }),
          catchError((refreshError) => {
            console.error('Token refresh failed:', refreshError);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};