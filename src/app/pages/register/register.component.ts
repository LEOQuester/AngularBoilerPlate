import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { MessageService } from 'primeng/api';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CalendarModule } from 'primeng/calendar';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FileUploadModule } from 'primeng/fileupload';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    CalendarModule,
    InputTextarea,
    DropdownModule,
    DividerModule,
    ToastModule,
    FloatLabelModule,
    NgxIntlTelInputModule,
    FileUploadModule
  ],
  templateUrl: './register.component.html',
  styles: [`
    :host ::ng-deep {
      .p-dropdown {
        .p-dropdown-label {
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
        }
        &.p-dropdown-clearable .p-dropdown-label {
          padding-right: 2.5rem;
        }
      }
      .p-float-label .p-dropdown .p-dropdown-label {
        margin-top: 0;
      }

      .p-fileupload {
        .p-fileupload-buttonbar {
          background: transparent;
          border: none;
          padding: 0;
          .p-button {
            margin-right: 0;
          }
        }
        .p-fileupload-content {
          border-style: dashed;
          background: transparent;
          padding: 2rem;
          border-radius: 1rem;
          &:hover {
            border-color: var(--primary-color);
          }
        }
        .p-progressbar {
          height: 0.5rem;
        }
      }

      .profile-upload {
        .p-fileupload-row > div {
          padding: 0.5rem;
        }
      }
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isSubmitting = false;
  maxDate: Date = new Date();
  selectedProfilePic: File | null = null;
  previewImageUrl: string | null = null;
  
  genderOptions = [
    { label: 'Male', value: 'M' },
    { label: 'Female', value: 'F' },
    { label: 'Other', value: 'O' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {
    // Set max date to 18 years ago
    this.maxDate.setFullYear(this.maxDate.getFullYear() - 18);
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      phone_number: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password2: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      dob: ['', [Validators.required]],
      nic: [''],
      profile_pic: [null]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password');
    const password2 = form.get('password2');
    
    if (!password || !password2) return null;
    
    return password.value === password2.value ? null : { passwordMismatch: true };
  }

  onPhoneInput(event: any): void {
    setTimeout(() => {
      const control = this.registerForm.get('phone_number');
      const phoneControlValue = control?.value;
  
      if (!phoneControlValue || !phoneControlValue.number) return;
  
      const inputVal = phoneControlValue.number;
      const countryCode = phoneControlValue.countryCode?.toUpperCase();
  
      const phoneNumber = parsePhoneNumberFromString(inputVal, countryCode);
  
      if (phoneNumber && isValidPhoneNumber(inputVal, countryCode)) {
        const formattedNumber = phoneNumber.formatNational();
        control?.setValue({
          ...phoneControlValue,
          number: formattedNumber
        });
        control?.setErrors(null);
      } else {
        control?.setErrors({ invalidPhone: true });
      }
    }, 200);
  }

  onProfilePicSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.selectedProfilePic = file;
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
      this.registerForm.patchValue({ profile_pic: file });
    }
  }

  onProfilePicRemove(): void {
    this.selectedProfilePic = null;
    this.previewImageUrl = null;
    this.registerForm.patchValue({ profile_pic: null });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.registerForm.value;
    const phone_number = formValue.phone_number?.e164Number || formValue.phone_number;

    // Construct the registration payload
    const registrationPayload = {
      username: formValue.username,
      password: formValue.password,
      password2: formValue.password2,
      email: formValue.email,
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      phone_number: phone_number,
      gender: formValue.gender,
      address: formValue.address,
      dob: formValue.dob instanceof Date ? formValue.dob.toISOString().split('T')[0] : formValue.dob,
      nic: formValue.nic || undefined,
      profile_pic: this.selectedProfilePic || undefined
    };

    // Log the registration payload
    console.log('Registration Payload:', {
      ...registrationPayload,
      password: '********',
      password2: '********'
    });

    this.authService.register(registrationPayload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Registration successful! Please login.'
        });
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error) => {
        // Handle field-specific error messages
        if (error.error && typeof error.error === 'object') {
          // Loop through each field's errors
          Object.entries(error.error).forEach(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              messages.forEach((message: string) => {
                this.messageService.add({
                  severity: 'error',
                  summary: `Error in ${field.replace('_', ' ')}`,
                  detail: message,
                  life: 5000 // Show for 5 seconds
                });
              });
            }
          });
        } else {
          // Fallback for non-field-specific errors
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Registration failed. Please try again.',
            life: 5000
          });
        }
        this.isSubmitting = false;
      }
    });
  }
}