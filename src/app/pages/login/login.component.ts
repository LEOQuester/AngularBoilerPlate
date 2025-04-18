import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FloatLabel } from 'primeng/floatlabel';
import { TabsModule } from 'primeng/tabs';
import { DropdownModule } from 'primeng/dropdown';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
import {NgxIntlTelInputModule, SearchCountryField, CountryISO, PhoneNumberFormat} from 'ngx-intl-tel-input';
import { AuthService } from '../../services/auth/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Ripple } from 'primeng/ripple';
import { finalize } from 'rxjs/operators';
import { DialogModule } from 'primeng/dialog'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,DropdownModule,
    MessageModule,InputTextModule,
    ButtonModule,NgxIntlTelInputModule,
    CardModule,FloatLabel,PasswordModule,
    DividerModule,CheckboxModule,TabsModule,Ripple,
    FormsModule,ReactiveFormsModule, ToastModule, DialogModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
})
export class LoginComponent implements OnInit, AfterViewInit {
  
  loginForm!: FormGroup;
  rememberMe: boolean = false;
  loginType: 'email' | 'phone' | 'username' = 'email';
  selectedCountryCode: string = '+94';
  loginTypeIndex: number = 0;
  phone_initialized: boolean = false; 
  SearchCountryField = SearchCountryField;
	CountryISO = CountryISO;
  isLoggingIn : boolean = false;
  controlValue : any = "";
  
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [CountryISO.SriLanka];
  selectedCountry: CountryISO = CountryISO.SriLanka;

  phone_errors: string[] = ["Invalid number", "Invalid country code", "Too short", "Too long", "Invalid number"];
  phone_error : string = "";
  iti : any;

  countryCodes = [];

  isForgotPasswordModalVisible: boolean = false;
  forgotPasswordForm!: FormGroup;
  isSubmittingForgotPassword: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initForgotPasswordForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      email: [{ value: '', disabled: true }, [Validators.email]],
      phone: [{ value: '', disabled: true }, [Validators.required]],
      username: [{ value: '', disabled: true }, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  initForgotPasswordForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngAfterViewInit(): void {
    this.selectLoginType(this.loginTypeIndex);
  }

  selectLoginType(index: number): void {
    console.log('Selected login type index:', index);
    this.loginTypeIndex = index;
  
    const email = this.loginForm.get('email');
    const phone = this.loginForm.get('phone');
    const username = this.loginForm.get('username');
  
    // Reset and disable all
    email?.reset();
    phone?.reset();
    username?.reset();
  
    email?.clearValidators();
    phone?.clearValidators();
    username?.clearValidators();
  
    email?.disable();
    phone?.disable();
    username?.disable();

    if (index == 0) {
      this.loginType = 'email';
      email?.setValidators([Validators.required, Validators.email]);
      email?.enable();
    } else if (index == 1) {
      this.loginType = 'phone';
      phone?.setValidators([Validators.required]);
      phone?.enable();
    } else if (index == 2) {
      this.loginType = 'username';
      username?.setValidators([Validators.required]);
      username?.enable();
    }

    console.log('Selected login type:', this.loginType);
  
    email?.updateValueAndValidity();
    phone?.updateValueAndValidity();
    username?.updateValueAndValidity();
  }

  onSubmit(): void {
    this.isLoggingIn = true;
    const control = this.loginForm.get(this.loginType);
    const password = this.loginForm.get('password');
  
    if (!control?.valid || !password?.valid) return;
    
    this.controlValue = control.value;

    if (this.loginType == "phone"){
      this.controlValue = control.value.e164Number; 
    }

    const payload = {
      username_or_email_or_phone: this.controlValue,
      password: password.value
    };
  
    this.authService.login(payload).pipe(
      finalize(() => this.isLoggingIn = false)
    ).subscribe({
      next: (response) => {
        console.log('Login successful, checking cookies:', document.cookie);
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Login successful' 
        });
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 5000); // 5000 milliseconds = 5 seconds
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: error.error?.message || 'Login Failed. Please try again!'
        });
      },
    });
  }

  onPhoneInput(_: Event) {
    // Allow the input to settle first
    setTimeout(() => {
      const control = this.loginForm.get('phone');
      const phoneControlValue = control?.value;
  
      if (!phoneControlValue || !phoneControlValue.number) return;
  
      const inputVal = phoneControlValue.number;
      const countryCode = phoneControlValue.countryCode?.toUpperCase(); // example: 'LK', 'US'
  
      const phoneNumber = parsePhoneNumberFromString(inputVal, countryCode);
  
      if (phoneNumber && isValidPhoneNumber(inputVal, countryCode)) {
        const formattedNumber = phoneNumber.formatNational();
  
        control?.setValue({
          ...phoneControlValue,
          number: formattedNumber
        });
  
        control?.setErrors(null); // ✅ Clear previous errors if valid
        console.log('Formatted:', formattedNumber, 'Valid?', true);
      } else {
        control?.setErrors({ invalidPhone: true });
        console.log('Invalid Phone Number');
      }
    }, 200);
  }

  openForgotPasswordModal(): void {
    this.isForgotPasswordModalVisible = true;
  }

  onForgotPasswordSubmit(): void {
    if (this.forgotPasswordForm.invalid) return;

    this.isSubmittingForgotPassword = true;
    const email = this.forgotPasswordForm.get('email')?.value;

    this.authService.forgotPassword({ email }).pipe(
      finalize(() => (this.isSubmittingForgotPassword = false))
    ).subscribe({
      next: (response: { message: string }) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: "Reset link sent. Please check your email!" });
        this.isForgotPasswordModalVisible = false;
      },
      error: (error: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.message });
      }
    });
  }

}
