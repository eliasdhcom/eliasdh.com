/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

export interface AuthUser {
    firstName:   string;
    lastName:    string;
    email:       string;
    role:        string;
    company:     string;
    phone:       string;
    street:      string;
    houseNumber: string;
    postalCode:  string;
    city:        string;
    country:     string;
    birthDate:   string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly SESSION_KEY = 'eliasdh_portal_auth';
    private readonly platformId = inject(PLATFORM_ID);
    private readonly router = inject(Router);

    private readonly CREDENTIALS = {
        email:       'elias.dehondt@outlook.com',
        password:    'EliasDH@123',
        firstName:   'Elias',
        lastName:    'De Hondt',
        role:        'Administrator',
        company:     'EliasDH',
        phone:       '+32495161542',
        street:      'Pieter van Den Bemdenlaan',
        houseNumber: '45',
        postalCode:  '2650',
        city:        'Edegem',
        country:     'België',
        birthDate:   '10/04/2001'
    } as const;

    login(email: string, password: string): boolean {
        if (email === this.CREDENTIALS.email && password === this.CREDENTIALS.password) {
            if (isPlatformBrowser(this.platformId)) {
                sessionStorage.setItem(this.SESSION_KEY, 'authenticated');
            }
            return true;
        }
        return false;
    }

    logout(): void {
        if (isPlatformBrowser(this.platformId)) {
            sessionStorage.removeItem(this.SESSION_KEY);
        }
        this.router.navigate(['/login']);
    }

    isAuthenticated(): boolean {
        if (!isPlatformBrowser(this.platformId)) return false;
        return !!sessionStorage.getItem(this.SESSION_KEY);
    }

    getUser(): AuthUser | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        if (!sessionStorage.getItem(this.SESSION_KEY)) return null;
        return {
            firstName:   this.CREDENTIALS.firstName,
            lastName:    this.CREDENTIALS.lastName,
            email:       this.CREDENTIALS.email,
            role:        this.CREDENTIALS.role,
            company:     this.CREDENTIALS.company,
            phone:       this.CREDENTIALS.phone,
            street:      this.CREDENTIALS.street,
            houseNumber: this.CREDENTIALS.houseNumber,
            postalCode:  this.CREDENTIALS.postalCode,
            city:        this.CREDENTIALS.city,
            country:     this.CREDENTIALS.country,
            birthDate:   this.CREDENTIALS.birthDate
        };
    }
}
