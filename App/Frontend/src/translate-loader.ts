/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { HttpClient } from "@angular/common/http";
import { TransferState, makeStateKey } from "@angular/core";
import { TranslateLoader, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";

export function i18nStateKey(lang: string) {
    return makeStateKey<TranslationObject>(`i18n-${lang}`);
}

/**
 * Reuses translations already loaded (synchronously) during SSR via TransferState,
 * so the client doesn't re-fetch them over HTTP and briefly render raw translation
 * keys before that second request resolves.
 */
class TransferStateTranslateLoader implements TranslateLoader {
    private readonly httpLoader: TranslateHttpLoader;

    constructor(http: HttpClient, private transferState: TransferState) {
        this.httpLoader = new TranslateHttpLoader(http, './assets/i18n/', '.json');
    }

    getTranslation(lang: string): Observable<TranslationObject> {
        const key = i18nStateKey(lang);
        if (this.transferState.hasKey(key)) {
            const translations = this.transferState.get(key, {} as TranslationObject);
            this.transferState.remove(key);
            return of(translations);
        }
        return this.httpLoader.getTranslation(lang) as Observable<TranslationObject>;
    }
}

export function HttpLoaderFactory(http: HttpClient, transferState: TransferState) {
    return new TransferStateTranslateLoader(http, transferState);
}