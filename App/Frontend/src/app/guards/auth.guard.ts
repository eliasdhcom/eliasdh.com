/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) return true;

    return router.createUrlTree(['/403']);
};

export const loggedInGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) return router.createUrlTree(['/dashboard']);

    return true;
};