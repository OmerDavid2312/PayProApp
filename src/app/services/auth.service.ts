import { Injectable, signal, computed, effect } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SuccessfullLoginInfo } from '../models/login.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly AUTH_DATA_KEY = 'OAuthData';
  readonly TOKEN_HEADER_NAME = 'token';

  // Signals for modern reactive state management
  private readonly _authData = signal<SuccessfullLoginInfo | null>(null);
  
  // Public readonly signals
  readonly authData = this._authData.asReadonly();
  
  // Computed signals
  readonly isAuthenticated = computed(() => {
    const auth = this._authData();
    return !!(auth?.token);
  });
  
  // Observables for external subscriptions (RxJS streams)
  private readonly _authSubject = new BehaviorSubject<SuccessfullLoginInfo | null>(null);
  
  readonly auth$ = this._authSubject.asObservable();

  constructor() {
    // Effect to sync signals with observables
    effect(() => {
      const auth = this._authData();
      this._authSubject.next(auth);
    });
    
    this.init();
  }

  setAuthData(authData: SuccessfullLoginInfo): void {
    try {
      localStorage.setItem(this.AUTH_DATA_KEY, JSON.stringify(authData));
      this._authData.set(authData);
    } catch (e) {
      console.error('Failed to setAuthData: ', e);
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

  init(): void {
    const authData = this.getAuthData();
    
    if (authData) {
      this._authData.set(authData);
    }
  }

  deleteAllData(): void {
    this._authData.set(null);
    localStorage.removeItem(this.AUTH_DATA_KEY);
  }
}