import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { SuccessfullLoginInfo, BasicUser, UserAccountTypes, AuthorizationLevel } from '../models/login.models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  user: BasicUser | null = null;
  authInfo: SuccessfullLoginInfo | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authInfo = this.authService.getAuthData();
    this.user = this.userService.user;

    // Subscribe to auth changes
    this.authService.auth$.subscribe(auth => {
      this.authInfo = auth;
    });

    this.userService.user$.subscribe(user => {
      this.user = user;
    });
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  getAccountTypeLabel(accountType: UserAccountTypes): string {
    switch (accountType) {
      case UserAccountTypes.PARENT_ACCOUNT:
        return 'Parent Account';
      case UserAccountTypes.USER_ACCOUNT:
        return 'User Account';
      case UserAccountTypes.MANAGER:
        return 'Manager';
      case UserAccountTypes.TUTOR:
        return 'Tutor';
      case UserAccountTypes.SECRATERY:
        return 'Secretary';
      case UserAccountTypes.LEAD:
        return 'Lead';
      case UserAccountTypes.GENERAL_WORKER:
        return 'General Worker';
      case UserAccountTypes.SUPPLIER:
        return 'Supplier';
      default:
        return 'Unknown';
    }
  }

  getAuthLevelLabel(authLevel: AuthorizationLevel): string {
    switch (authLevel) {
      case AuthorizationLevel.UNAUTHORIZED:
        return 'Unauthorized';
      case AuthorizationLevel.CUSTOMER:
        return 'Customer';
      case AuthorizationLevel.VIEWER:
        return 'Viewer';
      case AuthorizationLevel.TUTOR:
        return 'Tutor';
      case AuthorizationLevel.SECRATERY:
        return 'Secretary';
      case AuthorizationLevel.MANAGER:
        return 'Manager';
      case AuthorizationLevel.ADMIN:
        return 'Administrator';
      default:
        return 'Unknown';
    }
  }
}
