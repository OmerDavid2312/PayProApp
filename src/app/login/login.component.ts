import { Component, inject, signal, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil, switchMap, tap, catchError, of, finalize } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services and Models
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { SystemService } from '../services/system.service';
import { LoginDetails, SuccessfullLoginInfo } from '../models/login.models';
import { NavigationUtils } from '../utils/navigation.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex align-items-center justify-content-center min-h-screen p-4" 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      
      <p-toast></p-toast>
      
      <p-card class="w-full max-w-md shadow-4 border-round-lg">
        <ng-template pTemplate="header">
          <div class="text-center py-4">
            <h1 class="text-3xl font-bold text-900 m-0">PayPro Login</h1>
            <p class="text-600 mt-2 mb-0">Welcome back! Please sign in to your account.</p>
          </div>
        </ng-template>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-column gap-4">
          
          <!-- System ID Field -->
          @if (showSystemId()) {
            <div class="field">
              <label for="systemId" class="block text-900 font-medium mb-2">System ID *</label>
              <input pInputText 
                     id="systemId"
                     type="number"
                     formControlName="systemId"
                     placeholder="Enter system ID"
                     class="w-full"
                     [class.ng-invalid]="isFieldInvalid('systemId')"
                     />
              @if (isFieldInvalid('systemId')) {
                <small class="p-error">System ID is required and must be numeric</small>
              }
            </div>
          }

          <!-- Username Field -->
          <div class="field">
            <label for="username" class="block text-900 font-medium mb-2">Username *</label>
            <input pInputText 
                   id="username"
                   formControlName="username"
                   placeholder="Enter your username"
                   class="w-full"
                   [class.ng-invalid]="isFieldInvalid('username')"
                   />
            @if (isFieldInvalid('username')) {
              <small class="p-error">Username is required</small>
            }
          </div>

          <!-- Password Field -->
          <div class="field">
            <label for="password" class="block text-900 font-medium mb-2">Password *</label>
            <p-password formControlName="password"
                        placeholder="Enter your password"
                        [toggleMask]="true"
                        [feedback]="false"
                        styleClass="w-full"
                        inputStyleClass="w-full"
                       />
            @if (isFieldInvalid('password')) {
              <small class="p-error">Password is required</small>
            }
          </div>

          <!-- Auto Login Checkbox -->
          <div class="field">
            <div class="flex align-items-center gap-2">
              <p-checkbox inputId="autoLogin" 
                          formControlName="autoLogin" 
                          [binary]="true" />
              <label for="autoLogin" class="text-900">Remember me for automatic login</label>
            </div>
          </div>

          <!-- Submit Button -->
          <p-button type="submit" 
                    label="Sign In"
                    icon="pi pi-sign-in"
                    [loading]="loading()"
                    [disabled]="loading()"
                    styleClass="w-full"
                    size="large" />
        </form>
      </p-card>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
      }
      
      .p-card .p-card-header {
        background: transparent;
        border-bottom: 1px solid #e9ecef;
      }
      
      .p-inputtext:focus,
      .p-password-input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.2);
      }
      
      .p-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
      }
      
      .p-button:hover {
        background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      }
    }
  `]
})
export class LoginComponent implements OnDestroy {
  // Subject for managing subscriptions
  private readonly destroy$ = new Subject<void>();
  // ✅ Using inject() instead of constructor injection
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly systemService = inject(SystemService);
  private readonly messageService = inject(MessageService);

  // ✅ Using signals for reactive state
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly showSystemId = signal(true);
  readonly returnUrl = signal('/dashboard');

  // ✅ Typed reactive form with proper validation
  readonly loginForm = this.fb.group({
    systemId: this.fb.control('', [
      Validators.required, 
      Validators.pattern('^[0-9]*$')
    ]),
    username: this.fb.control('', [Validators.required]),
    password: this.fb.control('', [Validators.required]),
    autoLogin: this.fb.control(true)
  });

  // ✅ Computed signals for derived state

  ngOnInit() {
    // Get system ID from URL parameters
    const systemIdFromURL = +this.route.snapshot.queryParams['systemId'];
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.returnUrl.set(returnUrl);
    
    if (systemIdFromURL > 0) {
      this.systemService.setSystemId(systemIdFromURL);
      this.loginForm.controls.systemId.setValue(systemIdFromURL.toString());
    }

    // Load saved login details if available
    const savedLoginDetails = this.systemService.getLoginDetails();
    if (savedLoginDetails) {
      this.loginForm.patchValue({
        systemId: savedLoginDetails.systemId.toString(),
        autoLogin: this.systemService.getAutoLoginEnabled()
      });
    }

    // Subscribe to form changes to trigger validation
    this.loginForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('Form value changed:', this.loginForm.value);
      console.log('Form valid:', this.loginForm.valid);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ Helper method for field validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted()));
  }

  onSubmit() {
    this.submitted.set(true);

    if (this.loginForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Form Error',
        detail: 'Please fill in all required fields correctly'
      });
      return;
    }

    const formValue = this.loginForm.value;
    
    // Use RxJS to get device ID and perform login
    this.systemService.getDeviceUniqueId$().pipe(
      tap(() => this.loading.set(true)),
      switchMap(deviceId => {
        const loginDetails: LoginDetails = {
          systemId: Number(formValue.systemId),
          userName: formValue.username || '',
          password: formValue.password || '',
          versionNumber: '',
          ipAddress: '',
          macAddress: '',
          cpuId: '',
          mainDiskSerialNumber: deviceId
        };
        
        localStorage.setItem('systemId', loginDetails.systemId.toString());
        return this.performLogin(loginDetails);
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  private performLogin(loginDetails: LoginDetails) {
    return this.userService.completeLogin(loginDetails).pipe(
      tap(successfulLoginInfo => {
        this.handleSuccessfulLogin(successfulLoginInfo, loginDetails);
      }),
      catchError(error => {
        this.handleLoginFailure(error);
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  private handleSuccessfulLogin(successfulLoginInfo: SuccessfullLoginInfo, loginDetails: LoginDetails) {
    try {
      // Save login details for auto-login (without sensitive data)
      const autoLogin = this.loginForm.value.autoLogin;
      if (loginDetails && autoLogin) {
        const safeLoginDetails = { ...loginDetails };
        safeLoginDetails.password = '';
        safeLoginDetails.userName = '';
        this.systemService.setLoginDetails(safeLoginDetails, autoLogin);
        this.systemService.setSystemId(loginDetails.systemId);
      }

      // Auth data is already set by completeLogin observable
      document.cookie = 'otot.systemId=' + loginDetails.systemId + ';';
      
      this.messageService.add({
        severity: 'success',
        summary: 'Login Successful',
        detail: 'Welcome back!'
      });

      // Navigate based on user role
      if (successfulLoginInfo.user?.personalData) {
        NavigationUtils.navigateToMainApp(
          this.location, 
          this.router, 
          successfulLoginInfo.user.personalData.accountType, 
          loginDetails.systemId
        );
      } else {
        this.router.navigate([this.returnUrl()]);
      }
    } catch (e) {
      console.error('Login handling error:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Login Error',
        detail: 'An unexpected error occurred'
      });
    }
  }

  private handleLoginFailure(error: any) {
    console.error('Failed to login:', error);
    
    let errorMessage = 'Login failed. Please check your credentials.';
    if (error.status === 401) {
      errorMessage = 'Invalid username or password.';
    } else if (error.status === 403) {
      errorMessage = 'Access denied. Please contact administrator.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Login Failed',
      detail: errorMessage
    });
  }
}