/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { mergeApplicationConfig, ApplicationConfig, TransferState } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { TranslateLoader } from '@ngx-translate/core';
import { TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { i18nStateKey } from '../translate-loader';

import nl from '../assets/i18n/nl.json';
import fr from '../assets/i18n/fr.json';
import en from '../assets/i18n/en.json';
import de from '../assets/i18n/de.json';
import es from '../assets/i18n/es.json';

class ServerTranslateLoader implements TranslateLoader {
    constructor(private transferState: TransferState) { }

    getTranslation(lang: string): Observable<TranslationObject> {
        const translations: Record<string, TranslationObject> = { nl, fr, en, de, es };
        const translation = translations[lang] ?? nl;
        this.transferState.set(i18nStateKey(lang), translation);
        return of(translation);
    }
}

const serverConfig: ApplicationConfig = {
    providers: [
        provideServerRendering(),
        { provide: TranslateLoader, useClass: ServerTranslateLoader, deps: [TransferState] }
    ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);