import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { SystemService } from '../services/system.service';
import { NavigationUtils } from '../utils/navigation.utils';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private systemService: SystemService,
    private router: Router,
    private location: Location
  ) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const url = state.url;
    
    // Allow access to login pages without authentication
    if (url.includes('login')) {
      return true;
    }

    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Try auto-login with stored credentials
    const loginDetails = this.systemService.getLoginDetails();
    if (loginDetails && this.systemService.getAutoLoginEnabled()) {
      try {
        loginDetails.mainDiskSerialNumber = await this.systemService.getDeviceUniqueId();
        const successfulLoginInfo = await firstValueFrom(this.userService.loginWithDeviceId(loginDetails));
        this.authService.setAuthData(successfulLoginInfo);
        await this.userService.setMyPersonalData(successfulLoginInfo);
        NavigationUtils.navigateToMainApp(
          this.location, 
          this.router, 
          successfulLoginInfo.user.personalData.accountType, 
          loginDetails.systemId
        );
        return true;
      } catch (e) {
        console.error('Auto-login failed:', e);
        this.authService.deleteAllData();
      }
    }

    // Redirect to login page
    this.router.navigate(['/login'], { queryParams: { returnUrl: url } });
    return false;
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return this.canActivate(route, state);
  }
}
