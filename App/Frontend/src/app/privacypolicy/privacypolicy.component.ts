/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from "@ngx-translate/core";
import { LanguageService } from '../services/language.service';
import { SharedModule } from '../shared/shared.module';

@Component({
    selector: 'app-privacypolicy',
    templateUrl: './privacypolicy.component.html',
    styleUrls: ['./privacypolicy.component.css'],
    imports: [TranslatePipe, SharedModule],
    standalone: true
})

export class PrivacyPolicyComponent implements OnInit {
    constructor(private languageService: LanguageService) { }

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
    }
}