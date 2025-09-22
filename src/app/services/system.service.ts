import { Injectable } from '@angular/core';
import { LoginDetails } from '../models/login.models';

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private systemId: number = 0;

  getSystemId(): number {
    return this.systemId;
  }

  setSystemId(systemId: number): void {
    this.systemId = systemId;
    localStorage.setItem('systemId', systemId.toString());
  }

  getLoginDetails(): LoginDetails | null {
    try {
      const loginDetails = localStorage.getItem('otot.pos.loginDetails');
      return loginDetails ? JSON.parse(loginDetails) : null;
    } catch (e) {
      return null;
    }
  }

  setLoginDetails(loginDetails: LoginDetails, autoLogin: boolean): void {
    try {
      localStorage.setItem('otot.pos.loginDetails', JSON.stringify(loginDetails));
      localStorage.setItem('autoLogin', autoLogin.toString());
    } catch (e) {
      console.error('Failed to save login details:', e);
    }
  }

  async getDeviceUniqueId(): Promise<string> {
    // Simple device fingerprinting implementation
    // In a real application, you might want to use a more sophisticated approach
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return 'fallback-device-id';
    }
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString();
  }

  getAutoLoginEnabled(): boolean {
    return localStorage.getItem('autoLogin') === 'true';
  }
}
