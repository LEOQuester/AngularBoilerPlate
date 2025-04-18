import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, NavigationEnd } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const guardType = route.data['authGuard'] as string;

  // For login page
  if (guardType === 'canActivateLogin') {
    // For login page, only check if we have a valid session via refresh
    return authService.verifyOrRefreshToken().pipe(
      map(isValid => {
        if (isValid) {
          router.navigate(['/dashboard']);
          return false;
        }
        return true;
      })
    );
  }

  // For protected routes like dashboard
  // Try to refresh token if access token is missing or invalid
  return authService.verifyOrRefreshToken().pipe(
    map(isValid => {
      if (!isValid) {
        console.log('AuthGuard: Token verification/refresh failed, redirecting to login');
        //authService.clearUserData();
        console.log("user and token cleared");
        router.navigate(['/login']);
        return false;
      }
      return true;
    })
  );
};