/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) return router.createUrlTree(['/login']);

    const user = authService.getUser();
    if (authService.isStaff(user) && !(await authService.hasStaffPermissionsGranted())) {
        return router.createUrlTree(['/login']);
    }

    return true;
};

export const loggedInGuard: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) return true;

    const user = authService.getUser();
    if (authService.isStaff(user) && !(await authService.hasStaffPermissionsGranted())) {
        return true;
    }

    return router.createUrlTree(['/dashboard']);
};