import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { LoginDetails, SuccessfullLoginInfo } from '../models/login.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _loginUrl = '/';
  AUTH_DATA_KEY = 'OAuthData';
  LOGIN_DETAILS_LOCAL_STORAGE_KEY = 'otot.pos.loginDetails';
  SYSTEM_ID_COOKIE = 'otot.systemId';
  TOKEN_HEADER_NAME = 'token';

  private _loginDetails: LoginDetails = {} as LoginDetails;
  private _auth: SuccessfullLoginInfo | null = null;
  private _auth$: Subject<SuccessfullLoginInfo> = new Subject();
  private _loginDetails$: Subject<LoginDetails> = new Subject();

  constructor() {
    this.init();
  }

  get auth$(): Observable<SuccessfullLoginInfo> {
    return this._auth$.asObservable();
  }

  get loginDetails$(): Observable<LoginDetails> {
    return this._loginDetails$.asObservable();
  }

  get auth(): SuccessfullLoginInfo | null {
    return this._auth;
  }

  get loginDetails(): LoginDetails {
    return this._loginDetails;
  }

  setAuthData(authData: SuccessfullLoginInfo): SuccessfullLoginInfo {
    try {
      localStorage.setItem(this.AUTH_DATA_KEY, JSON.stringify(authData));
    } catch (e) {
      console.error('Failed to setAuthData: ', e);
    }
    this._auth = authData;
    this._auth$.next(authData);
    return authData;
  }

  getAuthData(): SuccessfullLoginInfo | null {
    try {
      const authData = localStorage.getItem(this.AUTH_DATA_KEY);
      if (authData) {
        return JSON.parse(authData);
      }
      return null;
    } catch (e) {
      console.error('Failed to getAuthData: ', e);
      return this._auth;
    }
  }

  init(): void {
    this._auth = this.getAuthData();
  }

  deleteAllData() {
    this._auth = null;
    localStorage.removeItem(this.AUTH_DATA_KEY);
    localStorage.removeItem(this.LOGIN_DETAILS_LOCAL_STORAGE_KEY);
    return true;
  }

  deleteAuthData(): void {
    localStorage.removeItem(this.LOGIN_DETAILS_LOCAL_STORAGE_KEY);
    this._auth = null;
  }

  isAuthenticated(): boolean {
    const authData = this.getAuthData();
    return !!(authData && authData.token);
  }
}
