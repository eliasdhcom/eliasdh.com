/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})

export class LanguageService {
    private readonly platformId = inject(PLATFORM_ID);

    constructor(private translate: TranslateService) { }

    checkAndSetLanguage(): void {
        const lang = (isPlatformBrowser(this.platformId) ? localStorage.getItem('language') : null) || 'nl';
        this.translate.setDefaultLang(lang);
        this.translate.use(lang);
    }
}