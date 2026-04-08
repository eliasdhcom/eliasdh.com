/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { CommonModule } from '@angular/common';
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
            { code: 'de', name: 'Deutsch' }
        ]
    };

    constructor(private languageService: LanguageService, private translate: TranslateService, private router: Router) { }

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
        this.currentLanguage = this.translate.currentLang || localStorage.getItem('language') || 'nl';
    }

    get isLoginPage(): boolean {
        return this.router.url === '/login';
    }

    changeLanguage(languageCode: string) {
        this.translate.use(languageCode);
        localStorage.setItem('language', languageCode);
        this.currentLanguage = languageCode;
        this.dropdownOpen = false;
    }

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }
}