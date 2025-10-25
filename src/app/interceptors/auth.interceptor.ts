import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authData = authService.getAuthData();

  // Add authorization header if token exists
  if (authData?.token) {
    req = req.clone({
      setHeaders: {
        [authService.TOKEN_HEADER_NAME]: JSON.stringify({token: authData.token})
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle authentication errors (401 Unauthorized, 403 Forbidden, 419 Session Expired)
      const authErrorStatuses = [401, 403, 419];
      if (authErrorStatuses.includes(error.status)) {
        // Only redirect if not already on login page to avoid infinite loops
        if (!router.url.includes('/login')) {
          authService.deleteAllData();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
