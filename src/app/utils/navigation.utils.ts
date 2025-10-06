import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { UserAccountTypes } from '../models/login.models';

export class NavigationUtils {
  static navigateToMainApp(location: Location, router: Router, accountType: UserAccountTypes, systemId?: string) {
    let newPath: string;
    
    switch (accountType) {
      case UserAccountTypes.MANAGER:
        newPath = '/admin-layout';
        break;
      case UserAccountTypes.TUTOR:
        newPath = '/tutor-layout';
        break;
      case UserAccountTypes.GENERAL_WORKER:
        newPath = '/popup-app-layout';
        break;
      case UserAccountTypes.SECRATERY:
        newPath = '/secretary-layout';
        break;
      case UserAccountTypes.SUPPLIER:
        newPath = '/supplier-layout';
        break;
      default:
        newPath = '/user-layout';
        break;
    }

    // For now, just navigate to the dashboard as the layouts don't exist yet
    router.navigate(['/dashboard']);
  }

  static navigateToLoginPage(location: Location, router: Router) {
    router.navigate(['/login']);
  }
}
