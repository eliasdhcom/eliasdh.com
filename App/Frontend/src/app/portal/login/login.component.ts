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
    codeForm!: FormGroup;
    newPasswordForm!: FormGroup;
    showForgotPassword = false;
    forgotStep: 1 | 2 | 3 = 1;
    resetEmail   = '';
    resetCode    = '';
    submitting   = false;
    loginError   = '';
    resetError   = '';
    resetSuccess = false;
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

        this.codeForm = this.fb.group({
            code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
        });

        this.newPasswordForm = this.fb.group({
            password:        ['', [Validators.required, this.passwordValidator]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordsMatchValidator });
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
        this.forgotStep   = 1;
        this.resetEmail   = '';
        this.resetCode    = '';
        this.resetError   = '';
        this.resetSuccess = false;
        this.loginForm.reset();
        this.forgotPasswordForm.reset();
        this.codeForm.reset();
        this.newPasswordForm.reset();
        this.loginError = '';
    }

    private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
        const pw  = group.get('password')?.value;
        const cpw = group.get('confirmPassword')?.value;
        return pw && cpw && pw !== cpw ? { passwordsMismatch: true } : null;
    }

    get codeControl()            { return this.codeForm.get('code'); }
    get newPasswordControl()     { return this.newPasswordForm.get('password'); }
    get confirmPasswordControl() { return this.newPasswordForm.get('confirmPassword'); }

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

    async onLogin(): Promise<void> {
        if (this.loginForm.invalid) return;

        this.submitting = true;
        this.loginError = '';

        const { email, password } = this.loginForm.value;
        const success = await this.authService.login(email, password);

        if (success) {
            this.router.navigate(['/dashboard']);
        } else {
            this.submitting = false;
            this.loginError = 'Ongeldig e-mailadres of wachtwoord.';
        }
    }

    async onForgotPassword(): Promise<void> {
        if (this.forgotPasswordForm.invalid) return;
        this.submitting = true;
        this.resetError = '';
        this.resetEmail = this.forgotPasswordForm.value.email;
        const ok = await this.authService.forgotPassword(this.resetEmail);
        this.submitting = false;
        if (ok) {
            this.forgotStep = 2;
        } else {
            this.resetError = 'Er is een fout opgetreden. Probeer opnieuw.';
        }
    }

    async onVerifyCode(): Promise<void> {
        if (this.codeForm.invalid) return;
        this.submitting = true;
        this.resetError = '';
        this.resetCode  = this.codeForm.value.code;
        const ok = await this.authService.verifyResetCode(this.resetEmail, this.resetCode);
        this.submitting = false;
        if (ok) {
            this.forgotStep = 3;
        } else {
            this.resetError = 'Ongeldige of verlopen code. Probeer opnieuw.';
        }
    }

    async onResetPassword(): Promise<void> {
        if (this.newPasswordForm.invalid) return;
        this.submitting = true;
        this.resetError = '';
        const ok = await this.authService.resetPassword(
            this.resetEmail,
            this.resetCode,
            this.newPasswordForm.value.password
        );
        this.submitting = false;
        if (ok) {
            this.resetSuccess = true;
            setTimeout(() => this.toggleForgotPassword(), 2500);
        } else {
            this.resetError = 'Code verlopen. Start opnieuw.';
        }
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
