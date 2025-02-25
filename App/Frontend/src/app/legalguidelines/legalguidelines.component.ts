/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component } from '@angular/core';
import { TranslatePipe, TranslateService } from "@ngx-translate/core";

@Component({
    selector: 'app-legalguidelines',
    templateUrl: './legalguidelines.component.html',
    styleUrls: ['./legalguidelines.component.css'],
    imports: [TranslatePipe],
    standalone: true
})

export class LegalGuidelinesComponent {
    constructor(private translate: TranslateService) {
        this.translate.setDefaultLang('en');
        this.translate.use('en');
    }
}