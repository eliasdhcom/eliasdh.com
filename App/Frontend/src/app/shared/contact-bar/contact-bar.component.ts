/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit, OnDestroy, HostListener, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { safeGetItem, safeSetItem } from '../../services/safe-storage';

@Component({
    selector: 'app-contact-bar',
    templateUrl: './contact-bar.component.html',
    styleUrls: ['./contact-bar.component.css'],
    imports: [TranslatePipe, CommonModule],
    standalone: true
})

export class ContactBarComponent implements OnInit, OnDestroy {
    dropdownOpen: boolean = false;
    currentLanguage: string = 'en';
    visible: boolean = true;

    private idleTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly idleDelay = 2500;
    private lastMouseMoveHandled = 0;
    private readonly mouseMoveThrottle = 150;

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

    constructor(private languageService: LanguageService, private translate: TranslateService, private elementRef: ElementRef) { }

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
        const storedLanguage = isPlatformBrowser(this.platformId) ? safeGetItem('language') : null;
        this.currentLanguage = this.translate.currentLang || storedLanguage || 'nl';
        this.resetIdleTimer();
    }

    ngOnDestroy(): void {
        if (this.idleTimer) clearTimeout(this.idleTimer);
    }

    private resetIdleTimer(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        this.visible = true;
        if (this.idleTimer) clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            if (!this.dropdownOpen) this.visible = false;
        }, this.idleDelay);
    }

    @HostListener('window:scroll')
    @HostListener('window:touchstart')
    @HostListener('window:pointerdown')
    @HostListener('focusin')
    onUserActivity(): void {
        this.resetIdleTimer();
    }

    @HostListener('window:mousemove')
    onMouseMove(): void {
        const now = Date.now();
        if (now - this.lastMouseMoveHandled < this.mouseMoveThrottle) return;
        this.lastMouseMoveHandled = now;
        this.resetIdleTimer();
    }

    changeLanguage(languageCode: string) {
        this.translate.use(languageCode);
        if (isPlatformBrowser(this.platformId)) safeSetItem('language', languageCode);
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