import { Injectable, signal, computed, effect } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { LoginDetails, SuccessfullLoginInfo } from '../models/login.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _loginUrl = '/';
  readonly AUTH_DATA_KEY = 'OAuthData';
  readonly LOGIN_DETAILS_LOCAL_STORAGE_KEY = 'otot.pos.loginDetails';
  readonly SYSTEM_ID_COOKIE = 'otot.systemId';
  readonly TOKEN_HEADER_NAME = 'token';

  // Signals for modern reactive state management
  private readonly _authData = signal<SuccessfullLoginInfo | null>(null);
  private readonly _loginDetails = signal<LoginDetails | null>(null);
  
  // Public readonly signals
  readonly authData = this._authData.asReadonly();
  readonly loginDetails = this._loginDetails.asReadonly();
  
  // Computed signals
  readonly isAuthenticated = computed(() => {
    const auth = this._authData();
    return !!(auth?.token);
  });
  
  readonly user = computed(() => this._authData()?.user || null);
  readonly token = computed(() => this._authData()?.token || null);
  
  // Observables for external subscriptions (RxJS streams)
  private readonly _authSubject = new BehaviorSubject<SuccessfullLoginInfo | null>(null);
  private readonly _loginDetailsSubject = new BehaviorSubject<LoginDetails | null>(null);
  
  readonly auth$ = this._authSubject.asObservable();
  readonly loginDetails$ = this._loginDetailsSubject.asObservable();

  constructor() {
    // Effect to sync signals with observables
    effect(() => {
      const auth = this._authData();
      this._authSubject.next(auth);
    });
    
    effect(() => {
      const details = this._loginDetails();
      this._loginDetailsSubject.next(details);
    });
    
    this.init();
  }

  // Legacy getters for backward compatibility
  get auth(): SuccessfullLoginInfo | null {
    return this._authData();
  }

  get loginDetailsValue(): LoginDetails | null {
    return this._loginDetails();
  }

  setAuthData(authData: SuccessfullLoginInfo): void {
    try {
      localStorage.setItem(this.AUTH_DATA_KEY, JSON.stringify(authData));
      this._authData.set(authData);
    } catch (e) {
      console.error('Failed to setAuthData: ', e);
    }
  }

  setLoginDetails(loginDetails: LoginDetails): void {
    try {
      localStorage.setItem(this.LOGIN_DETAILS_LOCAL_STORAGE_KEY, JSON.stringify(loginDetails));
      this._loginDetails.set(loginDetails);
    } catch (e) {
      console.error('Failed to setLoginDetails: ', e);
    }
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
      return this._authData();
    }
  }

  getLoginDetailsFromStorage(): LoginDetails | null {
    try {
      const loginDetails = localStorage.getItem(this.LOGIN_DETAILS_LOCAL_STORAGE_KEY);
      if (loginDetails) {
        return JSON.parse(loginDetails);
      }
      return null;
    } catch (e) {
      console.error('Failed to getLoginDetails: ', e);
      return this._loginDetails();
    }
  }

  init(): void {
    const authData = this.getAuthData();
    const loginDetails = this.getLoginDetailsFromStorage();
    
    if (authData) {
      this._authData.set(authData);
    }
    
    if (loginDetails) {
      this._loginDetails.set(loginDetails);
    }
  }

  deleteAllData(): void {
    this._authData.set(null);
    this._loginDetails.set(null);
    localStorage.removeItem(this.AUTH_DATA_KEY);
    localStorage.removeItem(this.LOGIN_DETAILS_LOCAL_STORAGE_KEY);
  }

  deleteAuthData(): void {
    this._authData.set(null);
    localStorage.removeItem(this.AUTH_DATA_KEY);
  }

  deleteLoginDetails(): void {
    this._loginDetails.set(null);
    localStorage.removeItem(this.LOGIN_DETAILS_LOCAL_STORAGE_KEY);
  }
}