import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { LoginDetails } from '../models/login.models';
import FingerprintJS from "@fingerprintjs/fingerprintjs";

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private systemId: number = 0;

  // maybe change these values to something better
  readonly LOGIN_DETAILS_LOCAL_STORAGE_KEY = 'otot.loginDetails';
  readonly DEVICE_STORED_UNIQUE_ID = 'otot.deviceStoredUniqueId';

  getSystemId(): number {
    return this.systemId;
  }

  setSystemId(systemId: number): void {
    this.systemId = systemId;
    localStorage.setItem('systemId', systemId.toString());
  }

  getLoginDetails(): LoginDetails | null {
    try {
      const loginDetails = localStorage.getItem(this.LOGIN_DETAILS_LOCAL_STORAGE_KEY);
      return loginDetails ? JSON.parse(loginDetails) : null;
    } catch (e) {
      return null;
    }
  }

  setLoginDetails(loginDetails: LoginDetails, autoLogin: boolean): void {
    try {
      localStorage.setItem(this.LOGIN_DETAILS_LOCAL_STORAGE_KEY, JSON.stringify(loginDetails));
      localStorage.setItem('autoLogin', autoLogin.toString());
    } catch (e) {
      console.error('Failed to save login details:', e);
    }
  }

  async getDeviceUniqueId(): Promise<string> {
    const cached = localStorage.getItem(this.DEVICE_STORED_UNIQUE_ID);
    console.log("Unique id exists on memory:", cached);
    if (cached?.startsWith('OKEY')) {
      return cached;
    }
    try {
      const fpAgent = await FingerprintJS.load();
      const result = await fpAgent.get();
      const uniqueId = `OKEY${result.visitorId}${Date.now()}`;
      localStorage.setItem(this.DEVICE_STORED_UNIQUE_ID, uniqueId);
      console.info("New Generated Unique ID: ", uniqueId);
      return uniqueId;
    } catch (err: any) {
      console.error('Failed to generate fingerprint as device unique id.', err);
      return err.message;
    }
  }


  getAutoLoginEnabled(): boolean {
    return localStorage.getItem('autoLogin') === 'true';
  }

  /**
   * Observable version of getDeviceUniqueId for RxJS streams
   */
  getDeviceUniqueId$(): Observable<string> {
    return from(this.getDeviceUniqueId());
  }
}
