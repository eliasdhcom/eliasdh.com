/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component } from '@angular/core';
import { TranslatePipe, TranslateService } from "@ngx-translate/core";

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css'],
    imports: [TranslatePipe],
    standalone: true
})

export class FooterComponent {
    constructor(private translate: TranslateService) {
        this.translate.setDefaultLang('en');
        this.translate.use('en');
    }

    ngOnInit(): void {
        this.setJavaScriptFooter();
    }

    setJavaScriptFooter(): void {
        const footerYearElement = document.getElementById("footer-year");
        if (footerYearElement) footerYearElement.textContent = new Date().getFullYear().toString();
    }
}