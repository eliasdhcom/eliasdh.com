/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FooterComponent } from '../footer/footer.component';
import { ContextMenuComponent } from '../contextmenu/contextmenu.component';
import { LanguageService } from '../services/language.service';

@Component({
    selector: 'app-domainrented',
    templateUrl: './domainrented.component.html',
    styleUrls: ['./domainrented.component.css'],
    imports: [TranslatePipe, FooterComponent, ContextMenuComponent],
    standalone: true
})

export class DomainRentedComponent implements OnInit {
    constructor(private languageService: LanguageService) { }

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
    }
}