# PayPro Login System - API Calls Documentation

## 📍 API Endpoints Location

All API calls are implemented in **`src/app/services/user.service.ts`** with automatic proxy configuration.

## 🔑 Available API Endpoints

### 1. **Standard Login**
```typescript
// Location: src/app/services/user.service.ts - Line 47
POST /api/login

// Usage:
login(loginDetails: LoginDetails): Observable<SuccessfullLoginInfo> {
  this.connectedAnonymously = false;
  return this.http.post<SuccessfullLoginInfo>('/api/login', loginDetails);
}

// Request Body:
{
  systemId: number,
  userName: string,
  password: string,
  versionNumber: string,
  ipAddress: string,
  macAddress: string,
  cpuId: string,
  mainDiskSerialNumber: string
}
```

### 2. **Token-Based Login**
```typescript
// Location: src/app/services/user.service.ts - Line 52
POST /api/loginWithToken

// Usage:
loginWithToken(loginDetails: LoginDetails): Observable<SuccessfullLoginInfo> {
  this.connectedAnonymously = false;
  return this.http.post<SuccessfullLoginInfo>('/api/loginWithToken', loginDetails);
}
```

### 3. **Device ID Authentication**
```typescript
// Location: src/app/services/user.service.ts - Lines 57-61
GET /api/loginWithDeviceId

// Usage:
loginWithDeviceId(loginDetails: LoginDetails): Observable<SuccessfullLoginInfo> {
  this.connectedAnonymously = false;
  return this.http.get<SuccessfullLoginInfo>('/api/loginWithDeviceId', {
    params: new HttpParams()
      .append('systemId', loginDetails.systemId.toString())
      .append('fingerPrint', loginDetails.mainDiskSerialNumber)
  });
}

// Query Parameters:
// - systemId: number
// - fingerPrint: string (device unique ID)
```

### 4. **OTP Verification Login**
```typescript
// Location: src/app/services/user.service.ts - Lines 64-75
POST /api/loginByOTP

// Usage:
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

// Query Parameters:
// - verificationCode: string
// - systemId: number
// - fingerPrint: string
// - phoneNumber: string
// - personalId: string
```

### 5. **Anonymous Login**
```typescript
// Location: src/app/services/user.service.ts - Lines 78-84
GET /api/loginAnonymous

// Usage:
loginAnonymous(systemId: number): Observable<SuccessfullLoginInfo> {
  this.connectedAnonymously = true;
  return this.http.get<SuccessfullLoginInfo>('/api/loginAnonymous', {
    params: new HttpParams()
      .append('systemId', systemId.toString())
      .append('timeZone', (new Date().getTimezoneOffset() * -60000).toString())
  });
}

// Query Parameters:
// - systemId: number
// - timeZone: string (timezone offset in milliseconds)
```

### 6. **Get User Information**
```typescript
// Location: src/app/services/user.service.ts - Line 88
GET /api/getMyUserInfo

// Usage:
getMyUserInfo(): Observable<BasicUser> {
  return this.http.get<BasicUser>('/api/getMyUserInfo');
}

// Response: BasicUser object with personal data
```

## 🔄 API Call Flow

### Login Process:
```
1. User submits login form
   ↓
2. loginComponent.onSubmit() calls userService.login()
   ↓
3. POST /api/login with LoginDetails
   ↓
4. Success → setMyPersonalData() → GET /api/getMyUserInfo
   ↓
5. Navigate to dashboard based on user role
```

### Auto-Login Process:
```
1. AuthGuard checks authentication
   ↓
2. If stored credentials exist → userService.loginWithDeviceId()
   ↓
3. GET /api/loginWithDeviceId with systemId & fingerprint
   ↓
4. Success → Auto-navigate to appropriate layout
```

## 🛡️ Authentication Headers

All API calls automatically include authentication headers via **HTTP Interceptor**:

```typescript
// Location: src/app/interceptors/auth.interceptor.ts
headers: {
  'Authorization': 'Bearer <token>',
  'token': '<token>'
}
```

## 🔧 Proxy Configuration

API calls are proxied through **`proxy.conf.json`**:
- All `/api/*` requests are forwarded to your backend server
- Configured in `angular.json` and `ng serve` command

## 📝 Request/Response Models

### LoginDetails Interface:
```typescript
interface LoginDetails {
  systemId: number;
  userName: string;
  password: string;
  versionNumber: string;
  ipAddress: string;
  macAddress: string;
  cpuId: string;
  mainDiskSerialNumber: string;
}
```

### SuccessfullLoginInfo Interface:
```typescript
interface SuccessfullLoginInfo {
  authorizedUserId: number;
  user: BasicUserUnion;
  authorizationLevel: AuthorizationLevel;
  token: string;
}
```

### BasicUser Interface:
```typescript
interface BasicUser {
  type: string;
  personalData: PersonalDataUnion;
}
```

## 🚀 Usage Examples

### From Login Component:
```typescript
// Standard login
this.userService.login(loginDetails).subscribe({
  next: (response) => this.handleSuccessfulLogin(response, loginDetails),
  error: (error) => this.handleLoginFailure(error)
});
```

### From Auth Guard:
```typescript
// Auto-login with device ID
const successfulLoginInfo = await firstValueFrom(
  this.userService.loginWithDeviceId(loginDetails)
);
```

## 📍 File Locations Summary

- **API Calls**: `src/app/services/user.service.ts`
- **Models**: `src/app/models/login.models.ts`
- **HTTP Interceptor**: `src/app/interceptors/auth.interceptor.ts`
- **Auth Guard**: `src/app/guards/auth.guard.ts`
- **Login Component**: `src/app/login/login.component.ts`
- **Proxy Config**: `proxy.conf.json`
