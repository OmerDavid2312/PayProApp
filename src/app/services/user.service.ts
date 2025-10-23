import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, switchMap, map } from 'rxjs';
import { LoginDetails, SuccessfullLoginInfo, BasicUser } from '../models/login.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // ✅ Using inject() instead of constructor injection
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // Signals for reactive state management
  private readonly _user = signal<BasicUser | null>(null);
  private readonly _isConnectedAnonymously = signal<boolean>(true);

  // Public readonly signals
  readonly user = this._user.asReadonly();

  // Computed signals
  readonly userDisplayName = computed(() => {
    const user = this._user();
    return user?.personalData?.firstName && user?.personalData?.lastName
      ? `${user.personalData.firstName} ${user.personalData.lastName}`
      : user?.personalData?.firstName || 'Unknown User';
  });

  constructor() {
    // React to auth changes using RxJS
    this.authService.auth$.subscribe((auth) => {
      this.setUserFromAuth(auth);
    });

    // Initialize user from current auth state
    this.setUserFromAuth(this.authService.authData());
  }

  private setUserFromAuth(auth: SuccessfullLoginInfo | null): void {
    if (auth?.user) {
      this._user.set(auth.user);
    } else {
      this._user.set(null);
    }
  }

  /**
   * 🔑 PRIMARY LOGIN METHOD - Used by the login form
   * This is the main authentication method that users interact with
   */
  login(loginDetails: LoginDetails): Observable<SuccessfullLoginInfo> {
    this._isConnectedAnonymously.set(false);
    return this.http.post<SuccessfullLoginInfo>('/smartClub/rest/authorizedUsersManagement/login', loginDetails).pipe(
      tap(response => {
        // Update auth data using RxJS operators instead of async/await
        this.authService.setAuthData(response);
      })
    );
  }

  /**
   * Complete login process with user data fetching
   * Returns an observable that handles the entire login flow
   */
  completeLogin(loginDetails: LoginDetails): Observable<SuccessfullLoginInfo> {
    return this.login(loginDetails).pipe(
      switchMap(authResponse =>
        this.getMyUserInfo().pipe(
          map(userInfo => {
            // Update the auth response with user info
            const completeAuth = { ...authResponse, user: userInfo };
            this.authService.setAuthData(completeAuth);
            return completeAuth;
          })
        )
      )
    );
  }

  /**
   * 🤖 AUTO-LOGIN METHOD - Used by AuthGuard
   * Automatically logs in users with saved device credentials
   * Only used when "Remember me" was previously checked
   */
  loginWithDeviceId(loginDetails: LoginDetails): Observable<SuccessfullLoginInfo> {
    this._isConnectedAnonymously.set(false);
    return this.http.get<SuccessfullLoginInfo>('/api/loginWithDeviceId', {
      params: new HttpParams()
        .append('systemId', loginDetails.systemId)
        .append('fingerPrint', loginDetails.mainDiskSerialNumber)
    }).pipe(
      switchMap(authResponse =>
        this.getMyUserInfo().pipe(
          map(userInfo => {
            const completeAuth = { ...authResponse, user: userInfo };
            this.authService.setAuthData(completeAuth);
            return completeAuth;
          })
        )
      )
    );
  }

  getMyUserInfo(): Observable<BasicUser> {
    return this.http.post<BasicUser>('/smartClub/rest/authorizedUsersManagement/getMyUserInfo', {});
  }

  /**
   * Send forgot password link
   * @param systemId - System ID
   * @param messagingMethodType - 0 for mobile, 1 for email
   * @param destination - Email address or mobile number
   */
  sendForgotPasswordLink(systemId: string, messagingMethodType: number, destination: string): Observable<any> {
    return this.http.post('/smartClub/rest/authorizedUsersManagement/sendForgotPasswordLinkForApp', {
      systemId,
      messagingMethodType,
      destination
    });
  }

  logout(): Observable<void> {
    return new Observable(subscriber => {
      this.authService.deleteAllData();
      this._user.set(null);
      this._isConnectedAnonymously.set(true);
      subscriber.next();
      subscriber.complete();
    });
  }
}
