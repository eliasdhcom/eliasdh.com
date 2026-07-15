/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit, HostListener, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
    selector: 'app-contact-bar',
    templateUrl: './contact-bar.component.html',
    styleUrls: ['./contact-bar.component.css'],
    imports: [TranslatePipe, CommonModule, RouterLink],
    standalone: true
})

export class ContactBarComponent implements OnInit {
    dropdownOpen: boolean = false;
    currentLanguage: string = 'en';

    settingsConfig = {
        languages: [
            { code: 'en', name: 'English' },
            { code: 'nl', name: 'Nederlands' },
            { code: 'fr', name: 'Français' },
            { code: 'de', name: 'Deutsch' },
            { code: 'es', name: 'Español' }
        ]
    };

    private readonly platformId = inject(PLATFORM_ID);

    constructor(private languageService: LanguageService, private translate: TranslateService, private router: Router, private elementRef: ElementRef) { }

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
        const storedLanguage = isPlatformBrowser(this.platformId) ? localStorage.getItem('language') : null;
        this.currentLanguage = this.translate.currentLang || storedLanguage || 'nl';
    }

    get isLoginPage(): boolean {
        return this.router.url === '/login';
    }

    changeLanguage(languageCode: string) {
        this.translate.use(languageCode);
        if (isPlatformBrowser(this.platformId)) localStorage.setItem('language', languageCode);
        this.currentLanguage = languageCode;
        this.dropdownOpen = false;
    }

    toggleDropdown(event: Event) {
        event.stopPropagation();
        this.dropdownOpen = !this.dropdownOpen;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        const clickTarget = event.target as HTMLElement;
        const isClickInsideDropdown = this.elementRef.nativeElement.contains(clickTarget);
        
        if (!isClickInsideDropdown && this.dropdownOpen) {
            this.dropdownOpen = false;
        }
    }
}