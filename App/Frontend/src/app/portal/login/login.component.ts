/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 08/04/2026
**/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, SharedModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
    loginForm!: FormGroup;
    forgotPasswordForm!: FormGroup;
    showForgotPassword = false;
    submitting = false;
    loginError = '';
    private destroy$ = new Subject<void>();

    passwordMinLength = 8;
    passwordHasUppercase = false;
    passwordHasLowercase = false;
    passwordHasNumbers = false;
    passwordHasSpecial = false;

    constructor(
        private fb: FormBuilder,
        private translateService: TranslateService,
        private authService: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, this.emailValidator]],
            password: ['', [Validators.required, this.passwordValidator]]
        });

        this.forgotPasswordForm = this.fb.group({
            email: ['', [Validators.required, this.emailValidator]]
        });
    }

    private emailValidator(control: AbstractControl): ValidationErrors | null {
        const email = control.value;
        if (!email) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) ? null : { invalidEmail: true };
    }

    private passwordValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.value;
        if (!password) return null;
        const errors: ValidationErrors = {};
        if (password.length < 8) errors['minlength'] = true;
        if (!/[0-9]/.test(password)) errors['missingDigit'] = true;
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors['missingSpecial'] = true;
        return Object.keys(errors).length ? errors : null;
    }

    ngOnInit(): void {
        this.translateService.get('LOGIN.TRANSLATE1').pipe(takeUntil(this.destroy$)).subscribe();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    toggleForgotPassword(): void {
        this.showForgotPassword = !this.showForgotPassword;
        this.loginForm.reset();
        this.forgotPasswordForm.reset();
        this.loginError = '';
    }

    validatePassword(password: string): void {
        this.passwordHasUppercase = /[A-Z]/.test(password);
        this.passwordHasLowercase = /[a-z]/.test(password);
        this.passwordHasNumbers = /[0-9]/.test(password);
        this.passwordHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    }

    get passwordControl() {
        return this.loginForm.get('password');
    }

    get emailControl() {
        return this.loginForm.get('email');
    }

    get forgotEmailControl() {
        return this.forgotPasswordForm.get('email');
    }

    isPasswordStrong(): boolean {
        const password = this.passwordControl?.value || '';
        return password.length >= this.passwordMinLength &&
            this.passwordHasUppercase &&
            this.passwordHasLowercase &&
            this.passwordHasNumbers &&
            this.passwordHasSpecial;
    }

    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    onLogin(): void {
        if (this.loginForm.invalid) return;

        this.submitting = true;
        this.loginError = '';

        const { email, password } = this.loginForm.value;
        const success = this.authService.login(email, password);

        if (success) {
            this.router.navigate(['/dashboard']);
        } else {
            this.submitting = false;
            this.loginError = 'Ongeldig e-mailadres of wachtwoord.';
        }
    }

    onForgotPassword(): void {
        if (this.forgotPasswordForm.invalid) return;

        this.submitting = true;
        console.log('Forgot password email:', this.forgotPasswordForm.value);
    }

    onEmailChange(): void {
        const emailControl = this.emailControl;
        if (emailControl) {
            emailControl.markAsTouched();
            emailControl.updateValueAndValidity({ emitEvent: false });
        }
        if (this.loginError) this.loginError = '';
    }

    onPasswordChange(): void {
        const passwordControl = this.passwordControl;
        if (passwordControl) {
            const password = passwordControl.value;
            this.validatePassword(password);
            passwordControl.markAsTouched();
            passwordControl.updateValueAndValidity({ emitEvent: false });
        }
        if (this.loginError) this.loginError = '';
    }

    onForgotEmailChange(): void {
        const emailControl = this.forgotEmailControl;
        if (emailControl) {
            emailControl.markAsTouched();
            emailControl.updateValueAndValidity({ emitEvent: false });
        }
    }
}
