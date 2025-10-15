import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, tap, switchMap, map } from 'rxjs';
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
  private readonly _redirectUrl = signal<string | null>(null);
  private readonly _isConnectedAnonymously = signal<boolean>(true);

  // Public readonly signals
  readonly user = this._user.asReadonly();
  readonly redirectUrl = this._redirectUrl.asReadonly();
  readonly isConnectedAnonymously = this._isConnectedAnonymously.asReadonly();

  // Computed signals
  readonly isLoggedIn = computed(() => {
    return this.authService.isAuthenticated() && !this._isConnectedAnonymously();
  });

  readonly userDisplayName = computed(() => {
    const user = this._user();
    return user?.personalData?.firstName && user?.personalData?.lastName
      ? `${user.personalData.firstName} ${user.personalData.lastName}`
      : user?.personalData?.firstName || 'Unknown User';
  });

  // Observable streams for external subscriptions
  private readonly _userSubject = new BehaviorSubject<BasicUser | null>(null);
  readonly user$ = this._userSubject.asObservable();

  constructor() {
    // Effect to sync user signal with observable
    effect(() => {
      const user = this._user();
      this._userSubject.next(user);
    });

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

  setRedirectUrl(url: string | null): void {
    this._redirectUrl.set(url);
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
   * 🔄 OPTIONAL: Token-based authentication
   * Used for token refresh scenarios (not currently used in UI)
   */
  loginWithToken(loginDetails: LoginDetails): Observable<SuccessfullLoginInfo> {
    this._isConnectedAnonymously.set(false);
    return this.http.post<SuccessfullLoginInfo>('/api/loginWithToken', loginDetails).pipe(
      tap(response => this.authService.setAuthData(response))
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

  /**
   * 📱 OPTIONAL: OTP/SMS verification login
   * For two-factor authentication (not currently used in UI)
   * Could be implemented later for enhanced security
   */
  loginByOTP(loginDetails: LoginDetails): Observable<SuccessfullLoginInfo> {
    let httpParams = new HttpParams();
    if (loginDetails.password) {
      httpParams = httpParams.append('verificationCode', loginDetails.password);
    }
    httpParams = httpParams.append('systemId', loginDetails.systemId);
    httpParams = httpParams.append('fingerPrint', loginDetails.mainDiskSerialNumber);
    httpParams = httpParams.append('phoneNumber', loginDetails.userName);

    this._isConnectedAnonymously.set(false);
    return this.http.post<SuccessfullLoginInfo>('/api/loginByOTP', {}, { params: httpParams }).pipe(
      tap(response => this.authService.setAuthData(response))
    );
  }

  /**
   * 👤 OPTIONAL: Anonymous/Guest access
   * For allowing users to browse without authentication (not currently used in UI)
   * Could be useful for demo mode or public sections
   */
  loginAnonymous(systemId: number): Observable<SuccessfullLoginInfo> {
    this._isConnectedAnonymously.set(true);
    return this.http.get<SuccessfullLoginInfo>('/api/loginAnonymous', {
      params: new HttpParams()
        .append('systemId', systemId.toString())
        .append('timeZone', (new Date().getTimezoneOffset() * -60000).toString())
    }).pipe(
      tap(response => this.authService.setAuthData(response))
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

  /**
   * Update personal data using RxJS streams
   * Returns an observable for the complete operation
   */
  setMyPersonalData(successfulLoginInfo: SuccessfullLoginInfo): Observable<SuccessfullLoginInfo> {
    // Update auth with token first
    this.authService.setAuthData(successfulLoginInfo);

    return this.getMyUserInfo().pipe(
      tap(userInfo => {
        successfulLoginInfo.user = userInfo;
        this.authService.setAuthData(successfulLoginInfo);
      }),
      map(() => successfulLoginInfo)
    );
  }

  logout(): Observable<void> {
    return new Observable(subscriber => {
      this.authService.deleteAllData();
      this._user.set(null);
      this._isConnectedAnonymously.set(true);
      this._redirectUrl.set(null);
      subscriber.next();
      subscriber.complete();
    });
  }

  // Legacy getters for backward compatibility
  get userValue(): BasicUser | null {
    return this._user();
  }

  get redirectUrlValue(): string | null {
    return this._redirectUrl();
  }

  get connectedAnonymously(): boolean {
    return this._isConnectedAnonymously();
  }

  set connectedAnonymously(value: boolean) {
    this._isConnectedAnonymously.set(value);
  }
}
