import { Component, inject, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil, switchMap, tap, catchError, of, finalize } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
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
    acceptTerms: this.fb.control(false, [Validators.requiredTrue]),
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
      return this.messageService.add({
        severity: 'error',
        summary: 'Form Error',
        detail: 'Please fill in all required fields correctly'
      });
    }

    const formValue = this.loginForm.value;

    // Use RxJS to get device ID and perform login
    this.systemService.getDeviceUniqueId$().pipe(
      tap(() => this.loading.set(true)),
      switchMap(deviceId => {
        const loginDetails: LoginDetails = {
          systemId: formValue.systemId || '',
          userName: formValue.username || '',
          password: formValue.password || '',
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
        this.systemService.setSystemId(Number(loginDetails.systemId));
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

  // ✅ Handle forgot password click
  onForgotPassword(): void {
    console.log('Forgot password clicked');
    // TODO: Implement forgot password functionality
  }
}
