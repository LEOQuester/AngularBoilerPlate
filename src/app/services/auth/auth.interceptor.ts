import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TokenService } from './token.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const tokenService = inject(TokenService);
  const messageService = inject(MessageService);
  
  // Clone the request and always include credentials
  let modifiedReq = req.clone({
    withCredentials: true
  });
  
  // Add authorization header if token exists (except for specific auth endpoints)
  const token = tokenService.getToken();
  const skipAuthHeader = [
    'token/verify',
    'token/refresh',
    'login',
    'register',
    'forgot-password',
    'reset-password'
  ].some(endpoint => req.url.includes(endpoint));

  if (token && !skipAuthHeader) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle error responses
      if (error.status === 401) {
        messageService.add({
          severity: 'error',
          summary: 'Session Expired',
          detail: 'Your session has expired. Please log in again.'
        });
      } else if (error.status === 403) {
        messageService.add({
          severity: 'error',
          summary: 'Access Denied',
          detail: error.error?.detail || 'You do not have permission to perform this action'
        });
      } else if (error.status === 400) {
        messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.detail || error.error?.message || 'Invalid request'
        });
      } else if (error.status === 404) {
        messageService.add({
          severity: 'error',
          summary: 'Not Found',
          detail: error.error?.detail || 'The requested resource was not found'
        });
      } else if (error.status === 500) {
        messageService.add({
          severity: 'error',
          summary: 'Server Error',
          detail: 'An unexpected server error occurred. Please try again later.'
        });
      } else {
        messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.detail || error.error?.message || 'An unexpected error occurred'
        });
      }
      return throwError(() => error);
    })
  );
};