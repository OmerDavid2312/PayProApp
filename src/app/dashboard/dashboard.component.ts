import { Component, inject, computed, effect, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SuccessfullLoginInfo, BasicUser, UserAccountTypes, AuthorizationLevel } from '../models/login.models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnDestroy {
  // ✅ Using inject() instead of constructor injection
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // ✅ Using signals from services instead of local properties
  readonly authInfo = this.authService.authData;
  readonly user = this.userService.user;

  // ✅ Computed signals for derived data
  readonly userDisplayName = computed(() => {
    const user = this.user();
    return user?.personalData?.firstName && user?.personalData?.lastName
      ? `${user.personalData.firstName} ${user.personalData.lastName}`
      : user?.personalData?.firstName || 'Unknown User';
  });

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout() {
    this.userService.logout().pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.router.navigate(['/login']);
    });
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