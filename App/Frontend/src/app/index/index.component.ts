/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../footer/footer.component';
import { ContextMenuComponent } from '../contextmenu/contextmenu.component';
import { LanguageService } from '../services/language.service';

@Component({
    selector: 'app-index',
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.css'],
    imports: [TranslatePipe, CommonModule, FooterComponent, ContextMenuComponent],
    standalone: true
})

export class IndexComponent implements OnInit {
    dropdownOpen: boolean = false;
    currentLanguage: string = 'en';

    settingsConfig = {
        languages: [
            { code: 'en', name: 'English' },
            { code: 'nl', name: 'Nederlands' },
            { code: 'fr', name: 'Français' }
        ]
    };

    constructor(private languageService: LanguageService, private translate: TranslateService) { }

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
        this.initializeCarousel();
        this.setupEmailIconClick();
    }

    private initializeCarousel(): void {
        const carouselItems = document.querySelectorAll('.index-team-container-carousel-item');
        let totalItems: number;

        if (window.innerWidth >= 1300) totalItems = carouselItems.length - 2; // 3 items
        else if (window.innerWidth >= 768) totalItems = carouselItems.length - 1; // 2 items
        else totalItems = carouselItems.length; // 1 item

        const itemsToShow = window.innerWidth >= 1300 ? 3 : (window.innerWidth >= 768 ? 2 : 1); // Number of items to show at once
        let currentIndex = 0;

        const showItems = (startIndex: number): void => {
            carouselItems.forEach((item, i) => {
                if (window.innerWidth >= 1300) { // 3 items
                    if (i >= startIndex && i < startIndex + itemsToShow) item.classList.add('index-team-container-carousel-item-active');
                    else item.classList.remove('index-team-container-carousel-item-active');
                } else if (window.innerWidth >= 768) { // 2 items
                    if (i >= startIndex && i < startIndex + itemsToShow) item.classList.add('index-team-container-carousel-item-active');
                    else item.classList.remove('index-team-container-carousel-item-active');
                } else { // 1 item
                    if (i === startIndex) item.classList.add('index-team-container-carousel-item-active');
                    else item.classList.remove('index-team-container-carousel-item-active');
                }
            });
        };

        const nextItem = (): void => {
            currentIndex = (currentIndex + 1) % totalItems;
            showItems(currentIndex);
        };

        showItems(currentIndex);
        setInterval(nextItem, 5000); // 5 seconds interval
    }

    private setupEmailIconClick(): void {
        const emailIcon = document.getElementById('index-team-emailIcon');
        if (emailIcon) {
            emailIcon.addEventListener('click', () => {
                window.location.href = 'https://www.linkedin.com/company/eliasdh/jobs/';
            });
        }
    }

    changeLanguage(languageCode: string) {
        this.translate.use(languageCode);
        localStorage.setItem('language', languageCode);
        this.currentLanguage = languageCode;
        this.dropdownOpen = false;
    }

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }
}