import { Component, inject, signal, ChangeDetectionStrategy, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil, switchMap, tap, catchError, of, finalize } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageService } from 'primeng/api';

// Services and Models
import { UserService } from '../services/user.service';
import { SystemService } from '../services/system.service';
import { LoginDetails, SuccessfullLoginInfo } from '../models/login.models';
import { NavigationUtils } from '../utils/navigation.utils';

// Components
import { TermsComponent } from './terms/terms.component';
import { LanguageSelectorComponent } from '../components/language-selector/language-selector.component';

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
    ToastModule,
    DialogModule,
    RadioButtonModule,
    TermsComponent,
    LanguageSelectorComponent
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
  private readonly userService = inject(UserService);
  private readonly systemService = inject(SystemService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);

  @ViewChild('recaptcha', { static: true }) recaptchaElement!: ElementRef;

  // ✅ Using signals for reactive state
  readonly captchaVerified = signal(false);
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly showSystemId = signal(true);
  readonly returnUrl = signal('/dashboard');
  readonly showForgotPasswordDialog = signal(false);
  readonly forgotPasswordLoading = signal(false);
  readonly showTermsDialog = signal(false);

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

  // ✅ Forgot password form with email/mobile selection
  readonly forgotPasswordForm = this.fb.group({
    systemId: this.fb.control('', [
      Validators.required,
      Validators.pattern('^[0-9]*$')
    ]),
    resetMethod: this.fb.control<'email' | 'mobile' | ''>('email', [Validators.required]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    mobile: this.fb.control('')
  });

  ngOnInit() {
    // Get system ID from URL parameters
    const systemIdFromURL = +this.route.snapshot.queryParams['systemId'];
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.returnUrl.set(returnUrl);

    if (systemIdFromURL > 0) {
      this.systemService.setSystemId(systemIdFromURL);
      this.loginForm.controls.systemId.setValue(systemIdFromURL.toString());
    }

    this.addRecaptchaScript();

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

    // Subscribe to reset method changes to update validators
    this.forgotPasswordForm.get('resetMethod')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(method => {
      const emailControl = this.forgotPasswordForm.get('email');
      const mobileControl = this.forgotPasswordForm.get('mobile');

      if (method === 'email') {
        emailControl?.setValidators([Validators.required, Validators.email]);
        mobileControl?.clearValidators();
        mobileControl?.setValue('');
      } else if (method === 'mobile') {
        mobileControl?.setValidators([Validators.required]);
        emailControl?.clearValidators();
        emailControl?.setValue('');
      } else {
        emailControl?.clearValidators();
        mobileControl?.clearValidators();
      }

      emailControl?.updateValueAndValidity();
      mobileControl?.updateValueAndValidity();
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

  // ✅ Helper method for forgot password field validation
  isForgotPasswordFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  onSubmit() {
    this.submitted.set(true);

    // ✅ Validate CAPTCHA first
    if (!this.captchaVerified()) {
      return this.messageService.add({
        severity: 'error',
        summary: 'CAPTCHA Required',
        detail: 'Please complete the CAPTCHA verification'
      });
    }

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

    let errorMessageKey = 'LOGIN.errors.login_failed_check_credentials';
    if (error.status === 401) {
      errorMessageKey = 'LOGIN.errors.invalid_username_password';
    } else if (error.status === 403) {
      errorMessageKey = 'LOGIN.errors.access_denied';
    } else if (error.status >= 500) {
      errorMessageKey = 'LOGIN.errors.server_error';
      if (error.error.errorCode == 1010) {
        errorMessageKey = 'LOGIN.errors.wrong_username_password';
      }
    }

    this.messageService.add({
      severity: 'error',
      summary: this.translate.instant('LOGIN.errors.login_failed'),
      detail: this.translate.instant(errorMessageKey)
    });
  }

  // ✅ Handle forgot password click
  onForgotPassword(): void {
    // Pre-fill system ID from login form if available
    const currentSystemId = this.loginForm.get('systemId')?.value;
    if (currentSystemId) {
      this.forgotPasswordForm.patchValue({
        systemId: currentSystemId
      });
    }
    this.showForgotPasswordDialog.set(true);
  }

  // ✅ Handle forgot password form submission
  onSubmitForgotPassword(): void {
    // Mark all fields as touched to show validation errors
    this.forgotPasswordForm.markAllAsTouched();
    
    if (this.forgotPasswordForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('LOGIN.form_error'),
        detail: this.translate.instant('LOGIN.fill_required_fields')
      });
      return;
    }

    this.forgotPasswordLoading.set(true);
    const formValue = this.forgotPasswordForm.value;
    const resetMethod = formValue.resetMethod;

    const messagingMethodType = formValue.resetMethod === 'email' ? 1 : 0;
    const destination = (formValue.email || formValue.mobile) ?? '';
    const systemId = formValue.systemId ?? '';

    this.userService.sendForgotPasswordLink(systemId, messagingMethodType, destination).pipe(
      takeUntil(this.destroy$),
      tap(() => {
        const destinationType = resetMethod === 'email'
          ? 'your email address'
          : 'your mobile number';

        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('LOGIN.request_sent'),
          detail: `${this.translate.instant('LOGIN.password_reset_sent')} ${destinationType}.`
        });
        this.showForgotPasswordDialog.set(false);
        this.forgotPasswordForm.reset({
          resetMethod: 'email'
        });
      }),
      catchError(error => {
        console.error('Failed to send password reset:', error);
        let errorMessage = this.translate.instant('LOGIN.password_reset_failed');
        
        if (error.status === 404) {
          errorMessage = this.translate.instant('LOGIN.system_id_not_found');
        } else if (error.status === 400) {
          errorMessage = this.translate.instant('LOGIN.invalid_email_mobile');
        } else if (error.status >= 500) {
          errorMessage = this.translate.instant('LOGIN.server_error_try_later');
        }
        
        // Handle specific error codes from the server
        if (error.error?.errorCode === 9910) {
          errorMessage = this.translate.instant('LOGIN.user_not_found');
        } else if (error.error?.errorCode) {
          // Handle other specific error codes
          console.warn('Server error code:', error.error.errorCode, 'Message:', error.error.error);
          errorMessage = this.translate.instant('LOGIN.password_reset_failed');
        }
        
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('LOGIN.request_failed'),
          detail: errorMessage
        });
        return of(null);
      }),
      finalize(() => this.forgotPasswordLoading.set(false))
    ).subscribe();
  }

  // ✅ Handle dialog cancellation
  onCancelForgotPassword(): void {
    this.showForgotPasswordDialog.set(false);
    this.forgotPasswordForm.reset({
      resetMethod: 'email'
    });
  }

  // ✅ Handle terms modal
  onShowTerms(): void {
    this.showTermsDialog.set(true);
  }

  addRecaptchaScript() {
    // Set up the callback first
    (window as any).grecaptchaCallback = () => {
      this.renderReCaptcha();
    }

    // Check if grecaptcha is already loaded
    if (typeof (window as any).grecaptcha !== 'undefined') {
      // Script already loaded, render immediately
      setTimeout(() => {
        if (this.recaptchaElement && this.recaptchaElement.nativeElement) {
          this.renderReCaptcha();
        }
      }, 100);
      return;
    }

    // Check if script element already exists
    if (document.getElementById('recaptcha-jssdk')) {
      // Script is loading, wait for it
      const checkRecaptcha = setInterval(() => {
        if (typeof (window as any).grecaptcha !== 'undefined') {
          clearInterval(checkRecaptcha);
          if (this.recaptchaElement && this.recaptchaElement.nativeElement) {
            this.renderReCaptcha();
          }
        }
      }, 100);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.id = 'recaptcha-jssdk';
    script.src = 'https://www.google.com/recaptcha/api.js?onload=grecaptchaCallback&render=explicit';
    script.async = true;
    script.defer = true;
    
    // Add error handler
    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'CAPTCHA failed to load. Please refresh the page.'
      });
    };
    
    document.head.appendChild(script);
  }

  renderReCaptcha() {
    try {
      // Check if element is ready and not already rendered
      if (!this.recaptchaElement || !this.recaptchaElement.nativeElement) {
        console.error('reCAPTCHA element not ready');
        return;
      }

      // Check if already has children (already rendered)
      if (this.recaptchaElement.nativeElement.children.length > 0) {
        console.log('reCAPTCHA already rendered');
        return;
      }

      // Check if grecaptcha is available
      if (typeof (window as any).grecaptcha === 'undefined') {
        console.error('grecaptcha not loaded');
        return;
      }

      (window as any).grecaptcha.render(this.recaptchaElement.nativeElement, {
        'sitekey': '6LcwJIsfAAAAAD4a5e0NC6eiaFuEWOywyYziLsQz',
        'callback': () => {
          console.log('CAPTCHA verified successfully');
          this.captchaVerified.set(true);
        },
        'expired-callback': () => {
          console.log('CAPTCHA expired');
          this.captchaVerified.set(false);
        },
        'error-callback': () => {
          console.log('CAPTCHA error');
          this.captchaVerified.set(false);
        }
      });
    } catch (error) {
      console.error('Error rendering reCAPTCHA:', error);
    }
  }
}
