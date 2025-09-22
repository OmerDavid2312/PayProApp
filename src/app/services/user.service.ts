import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { LoginDetails, SuccessfullLoginInfo, BasicUser } from '../models/login.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _redirectUrl: string | null = null;
  private _user$: Subject<BasicUser | null> = new Subject();
  private _user: BasicUser | null = null;
  connectedAnonymously: boolean = true;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.setUser(this.authService.auth);
    this.authService.auth$.subscribe((auth) => {
      this.setUser(this.authService.auth);
    });
  }

  get user$(): Observable<BasicUser | null> {
    return this._user$.asObservable();
  }

  get user(): BasicUser | null {
    return this._user;
  }

  set user(user: BasicUser | null) {
    this._user = user;
    this._user$.next(this.user);
  }

  setUser(auth: SuccessfullLoginInfo | null) {
    if (auth && auth.user) {
      this.user = auth.user;
    }
  }

  /**
   * 🔑 PRIMARY LOGIN METHOD - Used by the login form
   * This is the main authentication method that users interact with
   */
  login(loginDetails: LoginDetails): Observable<SuccessfullLoginInfo> {
    this.connectedAnonymously = false;
    return this.http.post<SuccessfullLoginInfo>('/api/login', loginDetails);
  }

  /**
   * 🔄 OPTIONAL: Token-based authentication
   * Used for token refresh scenarios (not currently used in UI)
   */
  loginWithToken(loginDetails: LoginDetails): Observable<SuccessfullLoginInfo> {
    this.connectedAnonymously = false;
    return this.http.post<SuccessfullLoginInfo>('/api/loginWithToken', loginDetails);
  }

  /**
   * 🤖 AUTO-LOGIN METHOD - Used by AuthGuard
   * Automatically logs in users with saved device credentials
   * Only used when "Remember me" was previously checked
   */
  loginWithDeviceId(loginDetails: LoginDetails): Observable<SuccessfullLoginInfo> {
    this.connectedAnonymously = false;
    return this.http.get<SuccessfullLoginInfo>('/api/loginWithDeviceId', {
      params: new HttpParams()
        .append('systemId', loginDetails.systemId.toString())
        .append('fingerPrint', loginDetails.mainDiskSerialNumber)
    });
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
    httpParams = httpParams.append('systemId', loginDetails.systemId.toString());
    httpParams = httpParams.append('fingerPrint', loginDetails.mainDiskSerialNumber);
    httpParams = httpParams.append('phoneNumber', loginDetails.userName);
    httpParams = httpParams.append('personalId', loginDetails.versionNumber);
    
    this.connectedAnonymously = false;
    return this.http.post<SuccessfullLoginInfo>('/api/loginByOTP', {}, { params: httpParams });
  }

  /**
   * 👤 OPTIONAL: Anonymous/Guest access
   * For allowing users to browse without authentication (not currently used in UI)
   * Could be useful for demo mode or public sections
   */
  loginAnonymous(systemId: number): Observable<SuccessfullLoginInfo> {
    this.connectedAnonymously = true;
    return this.http.get<SuccessfullLoginInfo>('/api/loginAnonymous', {
      params: new HttpParams()
        .append('systemId', systemId.toString())
        .append('timeZone', (new Date().getTimezoneOffset() * -60000).toString())
    });
  }

  getMyUserInfo(): Observable<BasicUser> {
    return this.http.get<BasicUser>('/api/getMyUserInfo');
  }

  async setMyPersonalData(successfulLoginInfo: SuccessfullLoginInfo) {
    // Update auth with token first
    this.authService.setAuthData(successfulLoginInfo);
    successfulLoginInfo.user = await firstValueFrom(this.getMyUserInfo());
  }

  logout() {
    this.authService.deleteAllData();
    this.user = null;
    // Navigate to login page
  }
}
