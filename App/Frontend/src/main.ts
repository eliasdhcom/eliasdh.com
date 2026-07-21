/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));

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