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
        [authService.TOKEN_HEADER_NAME]: JSON.stringify({token:authData.token})
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Handle unauthorized access
        authService.deleteAllData();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
