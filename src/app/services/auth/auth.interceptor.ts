import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  
  // Clone the request and always include credentials
  let modifiedReq = req.clone({
    withCredentials: true
  });
  
  // Add authorization header if token exists (except for verify and refresh endpoints)
  if (authService.token && !req.url.includes('token/verify') && !req.url.includes('token/refresh')) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${authService.token}`
      }
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Just handle unauthorized errors by clearing user data
      // Token verification and refresh is handled by the auth guard
      if (error.status === 401) {
        console.log('Unauthorized request:', req.url);
      }
      return throwError(() => error);
    })
  );
};