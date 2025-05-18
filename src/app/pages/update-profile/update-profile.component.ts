import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, AfterContentInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth/auth.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { InputOtpModule } from 'primeng/inputotp';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { RegistrationPayload } from '../../models/auth/auth.interface';
//import { ToastrService } from 'ngx-toastr';

interface PhoneValue {
  number: string;
  countryCode: string;
  dialCode: string;
}

// Types for form handling
interface IntlPhoneNumber {
  number: string;
  countryCode: string;
  dialCode: string;
  e164Number?: string;
}

type FormFields = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: IntlPhoneNumber | null;
  gender: 'M' | 'F' | 'O' | undefined;
  address: string | null;
  dob: Date | null;
  nic: string | null;
};

type ProfileKey = keyof UserProfile;
type FormDateValue = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: PhoneValue | string;
  gender: 'M' | 'F' | 'O' | null;
  address: string;
  dob: Date | null;
  nic: string;
};

@Component({
  selector: 'app-update-profile',
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [MessageService, ConfirmationService],imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    InputTextModule,
    InputTextarea,
    CalendarModule,
    FileUploadModule,
    ProgressSpinnerModule,
    ToastModule,
    InputOtpModule,
    ConfirmDialogModule,
    NgxIntlTelInputModule
  ]
})
export class UpdateProfileComponent implements OnInit, AfterContentInit {
  profileForm: FormGroup;
  loading = false;
  uploadLoading = false;
  profile: UserProfile | null = null;
  currentUser: UserProfile | null = null;
  initialFormValues: Partial<FormDateValue> = {};
  selectedProfilePicture: File | null = null;
  localProfilePicPreview: string | null = null;

  // Verification properties
  isEmailButtonDisabled = false;
  isPhoneButtonDisabled = false;
  emailTimeRemaining = 0;
  phoneTimeRemaining = 0;
  isSendingEmailCode = false;
  isSendingPhoneCode = false;
  showEmailOtpInput = false;
  showPhoneOtpInput = false;
  emailOtp = '';
  phoneOtp = '';
  isVerifyingEmail = false;
  isVerifyingPhone = false;
  formFields = [
    'username',
    'email',
    'first_name',
    'last_name',
    'phone_number',
    'gender',
    'address',
    'dob',
    'nic'
  ] as const;
    genderOptions = [
    { label: 'Male', value: 'M' },
    { label: 'Female', value: 'F' },
    { label: 'Other', value: 'O' },
    { label: 'Not Specified', value: null }
  ];
    maxDate: Date = new Date();  // Phone input configuration
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [CountryISO.SriLanka];  private readonly EMAIL_COOLDOWN_KEY = 'emailVerificationCooldown';
  private readonly PHONE_COOLDOWN_KEY = 'phoneVerificationCooldown';
  private readonly EMAIL_INPUT_KEY = 'emailOtpInputVisible';
  private readonly PHONE_INPUT_KEY = 'phoneOtpInputVisible';
  private emailCooldownTimer?: any;
  private phoneCooldownTimer?: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    
  ) {    
    const today = new Date();
    this.maxDate = new Date();
    this.maxDate.setFullYear(today.getFullYear() - 18);
      this.profileForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      phone_number: [null, [Validators.required]], // NgxIntlTelInput handles validation
      gender: [null],
      address: [''],
      dob: [null],
      nic: ['']  // Optional field
    });
  }

  ngOnInit() {
    // Initialize maxDate to 18 years ago
    const today = new Date();
    this.maxDate = new Date();
    this.maxDate.setFullYear(today.getFullYear() - 18);
    
    // Load profile data
    this.loadProfile();
    
    // Check for existing cooldowns
    this.checkExistingCooldowns();
  }  
  
  loadProfile() {
    this.loading = true;
    console.log("going to load the user profile from backend");
    this.authService.getProfile().subscribe({
      next: (profile) => {
        console.log('Profile received:', profile);  // Debug log
        this.profile = profile;
        this.currentUser = profile;
        
        // Convert ISO date string to Date object
        let dateOfBirth = null;
        console.log('Raw date of birth:', profile.dob);
        if (profile.dob) {
          try {
            dateOfBirth = new Date(profile.dob);

            
            console.log('Parsed date of birth:', dateOfBirth);
            console.log("____________________________________")
            if (isNaN(dateOfBirth.getTime())) {
              dateOfBirth = null;
            }
          } catch (e) {
            console.error('Error parsing date:', e);
            dateOfBirth = null;
          }
        }
        console.log('Parsed date of birth:', dateOfBirth);

        // Prepare phone number in the format expected by ngx-intl-tel-input
        let phoneInput = null;
        if (profile.phone_number) {
          try {
            phoneInput = {
              number: profile.phone_number.replace(/[^0-9+]/g, ''), // Clean the number
              countryCode: CountryISO.SriLanka,
              dialCode: '+94'
            };
          } catch (e) {
            console.error('Error parsing phone number:', e);
          }
        }
        console.log('Parsed phone input:', phoneInput);

        // Set form values one by one to ensure proper binding
        this.profileForm.patchValue({
          username: profile.username || '',
          email: profile.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone_number: phoneInput,
          gender: profile.gender || null,
          address: profile.address || '',
          dob: dateOfBirth,
          nic: profile.nic || ''
        }, { emitEvent: false });

        console.log('Form values after patch:', this.profileForm.getRawValue());  // Debug log
        
        // Store initial values
        this.initialFormValues = this.profileForm.getRawValue();
        
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load profile'
        });
        this.loading = false;
      }
    });
  }

  ngAfterContentInit() {
    // Force detect changes after content is initialized
    if (this.profile) {
      const formData = {
        username: this.profile.username || '',
        email: this.profile.email || '',
        first_name: this.profile.first_name || '',
        last_name: this.profile.last_name || '',
        phone_number: this.profile.phone_number ? {
          number: this.profile.phone_number,
          countryCode: CountryISO.SriLanka,
          dialCode: '+94'
        } : null,
        gender: this.profile.gender,
        address: this.profile.address || '',
        dob: this.profile.dob ? new Date(this.profile.dob) : null,
        nic: this.profile.nic || ''
      };
      
      this.profileForm.patchValue(formData, { emitEvent: false });
      console.log('Form data after patch:', formData);
    }
  }
  private checkExistingCooldowns() {
    // Check email cooldown
    const emailCooldownEnd = localStorage.getItem(this.EMAIL_COOLDOWN_KEY);
    if (emailCooldownEnd) {
      const remainingTime = Math.floor((parseInt(emailCooldownEnd) - Date.now()) / 1000);
      if (remainingTime > 0) {
        this.startEmailCooldown(remainingTime);
        // Restore email OTP input visibility
        this.showEmailOtpInput = localStorage.getItem(this.EMAIL_INPUT_KEY) === 'true';
      } else {
        localStorage.removeItem(this.EMAIL_COOLDOWN_KEY);
        localStorage.removeItem(this.EMAIL_INPUT_KEY);
      }
    }

    // Check phone cooldown
    const phoneCooldownEnd = localStorage.getItem(this.PHONE_COOLDOWN_KEY);
    if (phoneCooldownEnd) {
      const remainingTime = Math.floor((parseInt(phoneCooldownEnd) - Date.now()) / 1000);
      if (remainingTime > 0) {
        this.startPhoneCooldown(remainingTime);
        // Restore phone OTP input visibility
        this.showPhoneOtpInput = localStorage.getItem(this.PHONE_INPUT_KEY) === 'true';
      } else {
        localStorage.removeItem(this.PHONE_COOLDOWN_KEY);
        localStorage.removeItem(this.PHONE_INPUT_KEY);
      }
    }
  }

  private startEmailCooldown(duration: number) {
    this.isEmailButtonDisabled = true;
    this.emailTimeRemaining = duration;
    
    // Store cooldown end time
    const endTime = Date.now() + (duration * 1000);
    localStorage.setItem(this.EMAIL_COOLDOWN_KEY, endTime.toString());

    this.emailCooldownTimer = setInterval(() => {
      this.emailTimeRemaining--;
      if (this.emailTimeRemaining === 0) {
        this.isEmailButtonDisabled = false;
        localStorage.removeItem(this.EMAIL_COOLDOWN_KEY);
        if (this.emailCooldownTimer) {
          clearInterval(this.emailCooldownTimer);
        }
      }
    }, 1000);
  }

  private startPhoneCooldown(duration: number) {
    this.isPhoneButtonDisabled = true;
    this.phoneTimeRemaining = duration;
    
    // Store cooldown end time
    const endTime = Date.now() + (duration * 1000);
    localStorage.setItem(this.PHONE_COOLDOWN_KEY, endTime.toString());

    this.phoneCooldownTimer = setInterval(() => {
      this.phoneTimeRemaining--;
      if (this.phoneTimeRemaining === 0) {
        this.isPhoneButtonDisabled = false;
        localStorage.removeItem(this.PHONE_COOLDOWN_KEY);
        if (this.phoneCooldownTimer) {
          clearInterval(this.phoneCooldownTimer);
        }
      }
    }, 1000);
  }

  onSubmit() {
    if (this.profileForm.valid) {
      const formData = this.profileForm.getRawValue() as FormFields;
      const updatedFields: Partial<RegistrationPayload> = {};

      // Check each field for changes and format appropriately
      if (formData.username !== this.profile?.username) {
        updatedFields.username = formData.username;
      }
      if (formData.email !== this.profile?.email) {
        updatedFields.email = formData.email;
      }
      if (formData.first_name !== this.profile?.first_name) {
        updatedFields.first_name = formData.first_name;
      }
      if (formData.last_name !== this.profile?.last_name) {
        updatedFields.last_name = formData.last_name;
      }
      if (formData.gender !== this.profile?.gender) {
        updatedFields.gender = formData.gender;
      }
      
      // Handle optional string fields
      if (formData.address !== this.profile?.address) {
        updatedFields.address = formData.address || undefined;
      }
      if (formData.nic !== this.profile?.nic) {
        updatedFields.nic = formData.nic || undefined;
      }

      // Handle date formatting
      if (formData.dob) {
        const formDate = formData.dob.getFullYear() + '-' +
                        String(formData.dob.getMonth() + 1).padStart(2, '0') + '-' +
                        String(formData.dob.getDate()).padStart(2, '0');
        if (formDate !== this.profile?.dob) {
          updatedFields.dob = formDate;
        }
      }

      // Handle phone number formatting
      if (formData.phone_number && 'e164Number' in formData.phone_number) {
        const phoneNumber = formData.phone_number.e164Number;
        if (phoneNumber !== this.profile?.phone_number) {
          updatedFields.phone_number = phoneNumber;
        }
      }

      if (Object.keys(updatedFields).length === 0 && !this.selectedProfilePicture) {
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: 'No changes to save'
        });
        return;
      }

      console.log('Sending update to API:', updatedFields);
      this.loading = true;

      // Convert to FormData if there's a profile picture
      let requestBody: FormData | Partial<RegistrationPayload>;
      if (this.selectedProfilePicture) {
        const formDataObj = new FormData();
        
        // Add all updated fields to FormData
        for (const [key, value] of Object.entries(updatedFields)) {
          if (value !== undefined) {
            formDataObj.append(key, String(value));
          }
        }
        formDataObj.append('profile_pic', this.selectedProfilePicture);
        requestBody = formDataObj;
        
        if (requestBody){
          console.log("profile picture updated query sending")
        }
        for (const pair of formDataObj.entries()) {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
      } else {
        requestBody = updatedFields;
      }

      this.authService.updateProfile(requestBody).subscribe({
        next: (profile) => {
          console.log('Profile update response:', profile);
          this.profile = profile;
          this.currentUser = profile;
          
          // Reset profile picture state
          this.selectedProfilePicture = null;
          this.localProfilePicPreview = null;

          // Update initial values after successful save
          this.profileForm.patchValue({
            username: profile.username || '',
            email: profile.email || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            phone_number: profile.phone_number ? {
              number: profile.phone_number,
              countryCode: CountryISO.SriLanka,
              dialCode: '+94'
            } : null,
            gender: profile.gender || null,
            address: profile.address || '',
            dob: profile.dob ? new Date(profile.dob) : null,
            nic: profile.nic || ''
          }, { emitEvent: false });
          this.initialFormValues = this.profileForm.getRawValue();
          

          // Update local storage user object with the new profile picture URL
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user && profile.profile_pic) {
            user.profile_pic = profile.profile_pic;
            localStorage.setItem('user', JSON.stringify(user));
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile updated successfully'
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Profile update error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to update profile'
          });
          this.loading = false;
        }
      });
    }
  }


  // Verification methods
  sendEmailCode() {
    this.isSendingEmailCode = true;    this.authService.sendEmailVerificationCode().subscribe({
      next: () => {
        this.showEmailOtpInput = true;
        localStorage.setItem(this.EMAIL_INPUT_KEY, 'true');
        this.startEmailCooldown(60 * 10); // 10 minutes
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Verification code sent to your email'
        });
        this.isSendingEmailCode = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send verification code'
        });
        this.isSendingEmailCode = false;
      }
    });
  }

  verifyEmailOtp() {
    if (this.emailOtp.length === 6) {
      this.isVerifyingEmail = true;
      this.authService.verifyEmailOtp(this.emailOtp).subscribe({
        next: () => {
          if (this.currentUser) {
            this.currentUser.is_email_verified = true;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Email verified successfully'
          });          this.isVerifyingEmail = false;
          this.showEmailOtpInput = false;
          localStorage.removeItem(this.EMAIL_INPUT_KEY);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Invalid verification code'
          });
          this.isVerifyingEmail = false;
        }
      });
    }
  }

  sendPhoneCode() {
    this.isSendingPhoneCode = true;    this.authService.sendPhoneVerificationCode().subscribe({
      next: () => {
        this.showPhoneOtpInput = true;
        localStorage.setItem(this.PHONE_INPUT_KEY, 'true');
        this.startPhoneCooldown(60 * 10); // 10 minutes
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Verification code sent to your phone'
        });
        this.isSendingPhoneCode = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send verification code'
        });
        this.isSendingPhoneCode = false;
      }
    });
  }

  verifyPhoneOtp() {
    if (this.phoneOtp.length === 6) {
      this.isVerifyingPhone = true;
      this.authService.verifyPhoneOtp(this.phoneOtp).subscribe({
        next: () => {
          if (this.currentUser) {
            this.currentUser.is_phone_verified = true;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Phone verified successfully'
          });          this.isVerifyingPhone = false;
          this.showPhoneOtpInput = false;
          localStorage.removeItem(this.PHONE_INPUT_KEY);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Invalid verification code'
          });
          this.isVerifyingPhone = false;
        }
      });
    }
  }

  onProfilePictureChange(event: any): void {
    if (event.files && event.files.length > 0) {
      const file = event.files[0];
      if (this.isValidImageFile(file)) {
        this.selectedProfilePicture = file;
        // Create local preview URL
        const reader = new FileReader();
        reader.onload = () => {
          this.localProfilePicPreview = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        // Show error message for invalid file
        alert("Please upload a valid image file (jpg, jpeg, png) under 5MB");
      }
    }
  }

  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  deleteAccount() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete your account? This action cannot be undone.',
      header: 'Delete Account',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.authService.deleteAccount().subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Account deleted successfully'
            });
            this.router.navigate(['/login']);
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete account'
            });
            this.loading = false;
          }
        });
      }
    });
  }
  onPhoneInput(event: any): void {
    setTimeout(() => {
      const control = this.profileForm.get('phone_number');
      const phoneControlValue = control?.value;
  
      if (!phoneControlValue || !phoneControlValue.number) return;
  
      const inputVal = phoneControlValue.number;
      const countryCode = phoneControlValue.countryCode?.toUpperCase();
  
      const phoneNumber = parsePhoneNumberFromString(inputVal, countryCode);
  
      if (phoneNumber && isValidPhoneNumber(inputVal, countryCode)) {
        const e164Number = phoneNumber.format('E.164');
        const formattedNumber = phoneNumber.formatNational();
        control?.setValue({
          ...phoneControlValue,
          number: formattedNumber,
          e164Number: e164Number
        });
        control?.setErrors(null);
      } else {
        control?.setErrors({ invalidPhone: true });
      }
    }, 200);
  }
  getProfilePicUrl(): string {
    return this.localProfilePicPreview || this.profile?.profile_pic || 'assets/images/default-avatar.png';
  }

  private updateProfilePicture(response: { profile_picture: string }) {
    const pic = response.profile_picture;
    if (this.profile) {
      this.profile.profile_pic = pic;
    }
    if (this.currentUser) {
      this.currentUser.profile_pic = pic;
    }
  }

  ngOnDestroy() {
    // Clear any existing timers
    if (this.emailCooldownTimer) {
      clearInterval(this.emailCooldownTimer);
    }
    if (this.phoneCooldownTimer) {
      clearInterval(this.phoneCooldownTimer);
    }
  }
}