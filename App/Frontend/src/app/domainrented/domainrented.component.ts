/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { SharedModule } from '../shared/shared.module';

@Component({
    selector: 'app-domainrented',
    templateUrl: './domainrented.component.html',
    styleUrls: ['./domainrented.component.css'],
    imports: [TranslatePipe, SharedModule],
    standalone: true
})

export class DomainRentedComponent implements OnInit {
    constructor(private languageService: LanguageService) { }

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
    }
}