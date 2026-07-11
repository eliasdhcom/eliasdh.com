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
import { PushService } from '../../services/push.service';
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

    notifPermission: string = 'default';
    locationPermission: string = 'prompt';
    awaitingStaffPermissions = false;
    isAndroid = false;
    pwaPrompt: any = null;
    private readonly onPwaPrompt = (e: Event) => { e.preventDefault(); this.pwaPrompt = e; };

    passwordMinLength = 8;
    passwordHasUppercase = false;
    passwordHasLowercase = false;
    passwordHasNumbers = false;
    passwordHasSpecial = false;

    constructor(
        private fb: FormBuilder,
        private translateService: TranslateService,
        private authService: AuthService,
        private pushService: PushService,
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
        this.notifPermission = this.authService.getLiveNotificationPermission();
        if (navigator.permissions?.query) {
            navigator.permissions.query({ name: 'geolocation' as PermissionName })
                .then(status => {
                    this.locationPermission = status.state;
                    status.onchange = () => {
                        this.locationPermission = status.state;
                        this.tryProceedAfterGate();
                    };
                    this.checkAlreadyAuthenticated();
                })
                .catch(() => {
                    this.locationPermission = 'prompt';
                    this.checkAlreadyAuthenticated();
                });
        } else {
            this.locationPermission = navigator.geolocation ? 'prompt' : 'denied';
            this.checkAlreadyAuthenticated();
        }
        this.isAndroid = /Android/i.test(navigator.userAgent);
        window.addEventListener('beforeinstallprompt', this.onPwaPrompt);
    }

    private checkAlreadyAuthenticated(): void {
        if (!this.authService.isAuthenticated()) return;
        const user = this.authService.getUser();
        if (this.authService.isStaff(user) && (this.notifPermission !== 'granted' || this.locationPermission !== 'granted')) {
            this.awaitingStaffPermissions = true;
            return;
        }
        this.router.navigate(['/dashboard']);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        window.removeEventListener('beforeinstallprompt', this.onPwaPrompt);
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

    get codeControl():            AbstractControl { return this.codeForm.get('code')!; }
    get newPasswordControl():     AbstractControl { return this.newPasswordForm.get('password')!; }
    get confirmPasswordControl(): AbstractControl { return this.newPasswordForm.get('confirmPassword')!; }

    validatePassword(password: string): void {
        this.passwordHasUppercase = /[A-Z]/.test(password);
        this.passwordHasLowercase = /[a-z]/.test(password);
        this.passwordHasNumbers = /[0-9]/.test(password);
        this.passwordHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    }

    get passwordControl(): AbstractControl {
        return this.loginForm.get('password')!;
    }

    get emailControl(): AbstractControl {
        return this.loginForm.get('email')!;
    }

    get forgotEmailControl(): AbstractControl {
        return this.forgotPasswordForm.get('email')!;
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

    async requestNotifPermission(): Promise<void> {
        const perm = await Notification.requestPermission();
        this.notifPermission = perm;
        this.tryProceedAfterGate();
    }

    requestLocationPermission(): void {
        if (!navigator.geolocation) {
            this.locationPermission = 'denied';
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.locationPermission = 'granted';
                this.sendLoginLocation(position.coords.latitude, position.coords.longitude);
                this.tryProceedAfterGate();
            },
            (error) => {
                this.locationPermission = error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable';
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
    }

    private sendLoginLocation(latitude: number, longitude: number): void {
        this.authService.recordLoginLocation(latitude, longitude).catch(() => { });
    }

    private captureAndSendCurrentLocation(): void {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => this.sendLoginLocation(position.coords.latitude, position.coords.longitude),
            () => { },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
    }

    private tryProceedAfterGate(): void {
        if (this.awaitingStaffPermissions && this.notifPermission === 'granted' && this.locationPermission === 'granted') {
            this.awaitingStaffPermissions = false;
            this.router.navigate(['/dashboard']);
        }
    }

    async installPwa(): Promise<void> {
        if (!this.pwaPrompt) return;
        (this.pwaPrompt as any).prompt();
        const { outcome } = await (this.pwaPrompt as any).userChoice;
        if (outcome === 'accepted') this.pwaPrompt = null;
    }

    async onLogin(): Promise<void> {
        if (this.loginForm.invalid) return;

        this.submitting = true;
        this.loginError = '';

        const { email, password } = this.loginForm.value;
        const success = await this.authService.login(email, password);

        if (success) {
            const user = this.authService.getUser();
            try {
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && user) {
                    new Notification('EliasDH Portal', {
                        body: `Welcome back, ${user.firstName} ${user.lastName}! You have successfully logged in.`,
                        icon: '/assets/media/images/logo.png'
                    });
                }
            } catch { }

            if (this.authService.isStaff(user)) {
                this.notifPermission = this.authService.getLiveNotificationPermission();
                this.locationPermission = await this.authService.getLiveLocationPermission();
                if (this.notifPermission !== 'granted' || this.locationPermission !== 'granted') {
                    this.submitting = false;
                    this.awaitingStaffPermissions = true;
                    return;
                }
                this.captureAndSendCurrentLocation();
            }
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
