import { Component, OnInit, AfterViewInit } from '@angular/core';
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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    DropdownModule,
    MessageModule,
    InputTextModule,
    ButtonModule,
    NgxIntlTelInputModule,
    CardModule,
    FloatLabel,
    PasswordModule,
    DividerModule,
    CheckboxModule,
    TabsModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'] // ✅ corrected from styleUrl to styleUrls
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
  
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [CountryISO.SriLanka];
  selectedCountry: CountryISO = CountryISO.SriLanka;

  phone_errors: string[] = ["Invalid number", "Invalid country code", "Too short", "Too long", "Invalid number"];
  phone_error : string = "";
  iti : any;

  countryCodes = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngAfterViewInit(): void {
    this.selectLoginType(this.loginTypeIndex);
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      email: [{ value: '', disabled: true }, [Validators.email]],
      phone: [{ value: '', disabled: true }, [Validators.required]],
      username: [{ value: '', disabled: true }, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
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

  getValidatorsForType(type: string) {
    switch (type) {
      case 'email':
        return Validators.email;
      case 'phone':
        return Validators.required;
      case 'username':
        return Validators.required;
      default:
        return Validators.required;
    }
  }

  onSubmit(): void {
    const control = this.loginForm.get(this.loginType);
    const password = this.loginForm.get('password');
  
    if (!control?.valid || !password?.valid) return;
  
    const payload = {
      type: this.loginType,
      value: control.value,
      password: password.value
    };
  
    console.log('Login payload:', payload);
  }

  toggleDarkMode(): void {
    const element = document.querySelector('html');
    element?.classList.toggle('my-app-dark');
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


}
