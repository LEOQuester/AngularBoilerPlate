import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, NavigationEnd } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
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
    switchMap((isValid: boolean) => {
      if (!isValid) {
        console.log('AuthGuard: Token verification/refresh failed, redirecting to login');
        router.navigate(['/login']);
        return of(false);
      }

      // Don't check verification status for update-profile route
      if (state.url === '/update-profile') {
        return of(true);
      }

      // For all other protected routes, check if user is verified
      return authService.checkVerificationStatus().pipe(
        map(status => {
          if (!status.is_verified) {
            console.log('AuthGuard: User not verified, redirecting to update-profile');
            router.navigate(['/update-profile']);
            return false;
          }
          return true;
        })
      );
    })
  );
};