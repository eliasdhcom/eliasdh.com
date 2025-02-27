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
        const storedLang = localStorage.getItem('language');
        const languageToUse = storedLang || 'en';

        this.translate.setDefaultLang(languageToUse);
        this.translate.use(languageToUse);

        this.translate.onLangChange.subscribe((event) => {
            localStorage.setItem('language', event.lang);
        });
    }
}