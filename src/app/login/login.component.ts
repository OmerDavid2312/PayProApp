import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { SystemService } from '../services/system.service';
import { LoginDetails, SuccessfullLoginInfo } from '../models/login.models';
import { NavigationUtils } from '../utils/navigation.utils';
import { Location } from '@angular/common';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent implements OnInit {
  hidePass = true;
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  showSystemId = true;
  isAutoLoginEnabled = true;
  returnUrl = '';

  ValidatorsUtils = {
    systemId: '^[0-9]*$',
    email: '^[_A-Za-z0-9-\\\\+]+(\\\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$'
  };

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private authService: AuthService,
    private userService: UserService,
    private systemService: SystemService,
    private messageService: MessageService
  ) {
    this.loginForm = this.formBuilder.group({
      systemId: ['', [Validators.required, Validators.pattern(this.ValidatorsUtils.systemId)]],
      username: ['', Validators.required],
      password: ['', Validators.required],
      autoLogin: [true]
    });
  }

  async ngOnInit() {
    const systemIdFromURL = +this.route.snapshot.queryParams['systemId'];
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    if (systemIdFromURL > 0) {
      this.systemService.setSystemId(systemIdFromURL);
      this.loginForm.controls['systemId'].setValue(systemIdFromURL);
    }

    // Load saved login details if available
    const savedLoginDetails = this.systemService.getLoginDetails();
    if (savedLoginDetails) {
      this.loginForm.patchValue({
        systemId: savedLoginDetails.systemId,
        autoLogin: this.systemService.getAutoLoginEnabled()
      });
      this.isAutoLoginEnabled = this.systemService.getAutoLoginEnabled();
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  async onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Form Error',
        detail: 'Please fill in all required fields correctly'
      });
      return;
    }

    const loginDetails: LoginDetails = {
      systemId: this.f['systemId'].value,
      userName: this.f['username'].value,
      password: this.f['password'].value,
      versionNumber: '',
      ipAddress: '',
      macAddress: '',
      cpuId: '',
      mainDiskSerialNumber: await this.systemService.getDeviceUniqueId()
    };

    this.isAutoLoginEnabled = this.f['autoLogin'].value;
    localStorage.setItem('systemId', loginDetails.systemId.toString());
    this.login(loginDetails);
  }

  private login(loginDetails: LoginDetails) {
    this.loading = true;
    this.userService.login(loginDetails).subscribe({
      next: async (successfulLoginInfo) => {
        await this.handleSuccessfulLogin(successfulLoginInfo, loginDetails);
      },
      error: (error) => {
        this.handleLoginFailure(error);
      }
    });
  }

  async handleSuccessfulLogin(successfulLoginInfo: SuccessfullLoginInfo, loginDetails: LoginDetails) {
    try {
      if (loginDetails) {
        // Remove sensitive data before storing
        const safeLoginDetails = { ...loginDetails };
        safeLoginDetails.password = '';
        safeLoginDetails.userName = '';
        this.systemService.setLoginDetails(safeLoginDetails, this.isAutoLoginEnabled);
        this.systemService.setSystemId(loginDetails.systemId);
      }

      // Set user data if not present
      if (!successfulLoginInfo.user) {
        try {
          this.authService.setAuthData(successfulLoginInfo);
          await this.userService.setMyPersonalData(successfulLoginInfo);
        } catch (e) {
          console.error('Failed to load user data:', e);
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Login Error',
            detail: 'Failed to load user information'
          });
          return;
        }
      }

      this.authService.setAuthData(successfulLoginInfo);
      document.cookie = 'otot.systemId=' + loginDetails.systemId + ';';
      
      this.messageService.add({
        severity: 'success',
        summary: 'Login Successful',
        detail: 'Welcome back!'
      });

      // Navigate based on user role
      if (successfulLoginInfo.user && successfulLoginInfo.user.personalData) {
        NavigationUtils.navigateToMainApp(
          this.location, 
          this.router, 
          successfulLoginInfo.user.personalData.accountType, 
          loginDetails.systemId
        );
      } else {
        this.router.navigate([this.returnUrl]);
      }
      
      this.loading = false;
    } catch (e) {
      console.error('Login handling error:', e);
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Login Error',
        detail: 'An unexpected error occurred'
      });
    }
  }

  handleLoginFailure(error: any) {
    console.error('Failed to login:', error);
    this.loading = false;
    
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

  togglePasswordVisibility() {
    this.hidePass = !this.hidePass;
  }
}
