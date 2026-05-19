/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { Title, Meta, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { ApplicationConfig } from "@angular/core";
import { HttpClient, provideHttpClient, withFetch } from "@angular/common/http";
import { TranslateLoader, provideTranslateService } from "@ngx-translate/core";
import { HttpLoaderFactory } from "../translate-loader";

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(withFetch()),
        provideClientHydration(withEventReplay()),
        provideTranslateService({
            defaultLanguage: 'nl',
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        }),
        Title,
        Meta
    ]
};