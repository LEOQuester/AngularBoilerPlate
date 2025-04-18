import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DividerModule,
    InputTextModule,
    ToastModule,
    RouterLink,
    FloatLabelModule
  ],
  templateUrl: './reset-password.component.html',
  providers: [MessageService]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) return;

    this.isSubmitting = true;
    const token = this.route.snapshot.queryParamMap.get('token');
    const newPassword = this.resetPasswordForm.get('newPassword')?.value;

    if (!token) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid or missing token' });
      this.isSubmitting = false;
      return;
    }

    const payload = { token, new_password: newPassword };

    this.authService.resetPassword(payload).pipe(
      finalize(() => (this.isSubmitting = false))
    ).subscribe({
      next: (response: { message: string }) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: response.message });
      },
      error: (error: { message: string }) => {
        console.log(error)
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message });
      }
    });
  }
}