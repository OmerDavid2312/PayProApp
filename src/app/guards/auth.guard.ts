import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { SystemService } from '../services/system.service';
import { NavigationUtils } from '../utils/navigation.utils';
import { Location } from '@angular/common';

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
  const authService = inject(AuthService);
  const userService = inject(UserService);
  const systemService = inject(SystemService);
  const router = inject(Router);
  const location = inject(Location);
  const url = state.url;
  
  // Allow access to login pages without authentication
  if (url.includes('login')) {
    return of(true);
  }

  // Check if user is already authenticated using signal
  if (authService.isAuthenticated()) {
    return of(true);
  }

  // Try auto-login with stored credentials using RxJS
  const loginDetails = systemService.getLoginDetails();
  if (loginDetails && systemService.getAutoLoginEnabled()) {
    return systemService.getDeviceUniqueId$().pipe(
      tap(deviceId => {
        loginDetails.mainDiskSerialNumber = deviceId;
      }),
      switchMap(() => userService.loginWithDeviceId(loginDetails)),
      tap(successfulLoginInfo => {
        // Auth data is already set by the userService.loginWithDeviceId
        NavigationUtils.navigateToMainApp(
          location, 
          router, 
          successfulLoginInfo.user.personalData.accountType, 
          loginDetails.systemId
        );
      }),
      map(() => true),
      catchError(error => {
        console.error('Auto-login failed:', error);
        authService.deleteAllData();
        // Redirect to login page on auto-login failure
        router.navigate(['/login'], { queryParams: { returnUrl: url } });
        return of(false);
      })
    );
  }

  // No auto-login available, redirect to login page
  router.navigate(['/login'], { queryParams: { returnUrl: url } });
  return of(false);
};
