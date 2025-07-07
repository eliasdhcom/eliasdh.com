/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { HttpClient } from "@angular/common/http";
import { TranslateLoader } from "@ngx-translate/core";

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
document.documentElement.setAttribute('data-theme', 'light');

// Set Default Translation
export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
    return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

// Set Default Theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme: string | null = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

// Easter Egg :)
console.log(`
█████████████████████████████████████████████████
███████████████████             █████████████████
███████████████                     █████████████
████████████                          ███████████
██████████                              █████████
████████                                 ████████
███████           ████████████             ██████
██████          ██████    ███████           █████
█████         █████           █████         █████
████         █████             █████         ████
████        █████          ████████           ███
███         █████      ████████            ██████
███         █████   ████████            █████████
████        █████████████           █████████████
████         ████████           █████████    ████
████     ███████████        ██████████      █████
███████████████████████████████████         █████
█████████████     ██████████████           ██████
█████████             █████               ███████
█████████                                ████████
████████████                           ██████████
███████████████                      ████████████
███████████████████               ███████████████
█████████████████████████████████████████████████

Curious? Join us at https://www.linkedin.com/company/eliasdhcom/jobs
`);