/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})

export class LanguageService {
    constructor(private translate: TranslateService) { }

    checkAndSetLanguage(): void {
        const lang = localStorage.getItem('language') || 'nl';
        this.translate.setDefaultLang(lang);
        this.translate.use(lang);
    }
}