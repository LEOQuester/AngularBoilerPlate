import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export const debugInterceptor: HttpInterceptorFn = (req, next) => {
  // Only log in development environment
  if (!environment.production) {
    console.log(`📨 Request:`, req.url);
    
    return next(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            console.log('📥 Response:', event.body);
          }
        },
        error: (error: HttpErrorResponse) => {
          console.log('📥 Response:', error.error);
        }
      })
    );
  }
  return next(req);
};