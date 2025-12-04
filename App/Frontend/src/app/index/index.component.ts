/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../services/language.service';
import { SharedModule } from '../shared/shared.module';

interface JoinCard {
    type: 'join';
    titleKey: string;
    descriptionKeys: string[];
    buttonKey: string;
    buttonLink: string;
}

interface MemberCard {
    type: 'member';
    name: string;
    image: string;
    linkedIn: string;
    role: string;
    roleLink: string;
    roleAbbreviation: string;
}

type TeamMember = JoinCard | MemberCard;

@Component({
    selector: 'app-index',
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.css'],
    imports: [TranslatePipe, CommonModule, SharedModule],
    standalone: true
})

export class IndexComponent implements OnInit, OnDestroy {
    dropdownOpen: boolean = false;
    currentLanguage: string = 'en';

    teamMembers: TeamMember[] = [ // Team members
        {
            type: 'join',
            titleKey: 'INDEX.TRANSLATE45',
            descriptionKeys: ['INDEX.TRANSLATE46', 'INDEX.TRANSLATE47', 'INDEX.TRANSLATE48'],
            buttonKey: 'INDEX.TRANSLATE-APPLY',
            buttonLink: 'https://www.linkedin.com/company/eliasdhcom/jobs/'
        },
        {
            type: 'member',
            name: 'Elias De Hondt',
            image: 'assets/media/images/team/team1.png',
            linkedIn: 'https://www.linkedin.com/in/eliasdehondt',
            role: 'Chief Executive Officer',
            roleLink: 'https://en.wikipedia.org/wiki/Chief_executive_officer',
            roleAbbreviation: 'CEO / Founder'
        },
        {
            type: 'member',
            name: 'Thomas Deweerdt',
            image: 'assets/media/images/team/team2.png',
            linkedIn: 'https://www.linkedin.com/in/thomasdeweerdt',
            role: 'Chief Financial Officer',
            roleLink: 'https://en.wikipedia.org/wiki/Chief_financial_officer',
            roleAbbreviation: 'CFO / Founder'
        }
    ];

    currentTeamIndex: number = 0;
    teamTranslateX: number = 0;
    isTeamDragging: boolean = false;
    teamDragStartX: number = 0;
    teamDragCurrentX: number = 0;
    teamStartTranslateX: number = 0;
    teamItemWidth: number = 330;
    itemsToShow: number = 3;
    maxTeamIndex: number = 0;
    teamDots: number[] = [];
    viewportWidth: number = 0;

    get totalTeamItems(): number {
        return this.teamMembers.length;
    }

    settingsConfig = {
        languages: [
            { code: 'en', name: 'English' },
            { code: 'nl', name: 'Nederlands' },
            { code: 'fr', name: 'Français' },
            { code: 'de', name: 'Deutsch' }
        ]
    };

    constructor(private languageService: LanguageService, private translate: TranslateService) { }

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
        this.initializeTeamCarousel();
        this.setupEmailIconClick();
    }

    ngOnDestroy(): void {}

    @HostListener('window:resize')
    onResize(): void {
        this.calculateCarouselDimensions();
        this.updateTeamTranslateX();
    }

    private initializeTeamCarousel(): void {
        this.calculateCarouselDimensions();
        this.updateTeamTranslateX();
    }

    private calculateCarouselDimensions(): void {
        const windowWidth = window.innerWidth;

        if (windowWidth >= 1100) this.itemsToShow = 3;
        else if (windowWidth >= 750) this.itemsToShow = 2;
        else this.itemsToShow = 1;

        setTimeout(() => {
            const viewport = document.querySelector('.index-team-carousel-viewport');
            const items = document.querySelectorAll('.index-team-container-carousel-item');

            if (viewport) this.viewportWidth = viewport.clientWidth;

            if (items.length > 0) {
                const firstItem = items[0] as HTMLElement;
                const style = window.getComputedStyle(firstItem);
                const itemWidth = firstItem.offsetWidth;
                const marginLeft = parseFloat(style.marginLeft) || 0;
                const marginRight = parseFloat(style.marginRight) || 0;
                this.teamItemWidth = itemWidth + marginLeft + marginRight;
            }

            this.updateTeamTranslateX();
        }, 0);

        this.maxTeamIndex = Math.max(0, this.totalTeamItems - this.itemsToShow);
        this.teamDots = Array(this.maxTeamIndex + 1).fill(0);

        if (this.currentTeamIndex > this.maxTeamIndex) {
            this.currentTeamIndex = this.maxTeamIndex;
        }
    }

    private updateTeamTranslateX(): void {
        const firstItem = document.querySelector('.index-team-container-carousel-item') as HTMLElement;
        let marginLeft = 15; // default

        if (firstItem) {
            const style = window.getComputedStyle(firstItem);
            marginLeft = parseFloat(style.marginLeft) || 15;
        }

        const totalVisibleWidth = this.itemsToShow * this.teamItemWidth;
        const centerOffset = (this.viewportWidth - totalVisibleWidth) / 2 + marginLeft;
        this.teamTranslateX = -this.currentTeamIndex * this.teamItemWidth + centerOffset;
    }

    nextTeamSlide(): void {
        if (this.currentTeamIndex < this.maxTeamIndex) {
            this.currentTeamIndex++;
            this.updateTeamTranslateX();
        }
    }

    prevTeamSlide(): void {
        if (this.currentTeamIndex > 0) {
            this.currentTeamIndex--;
            this.updateTeamTranslateX();
        }
    }

    goToTeamSlide(index: number): void {
        this.currentTeamIndex = Math.max(0, Math.min(index, this.maxTeamIndex));
        this.updateTeamTranslateX();
    }

    onTeamDragStart(event: MouseEvent): void {
        if (this.maxTeamIndex === 0) return;
        this.isTeamDragging = true;
        this.teamDragStartX = event.clientX;
        this.teamStartTranslateX = this.teamTranslateX;
        event.preventDefault();
    }

    onTeamDragMove(event: MouseEvent): void {
        if (!this.isTeamDragging || this.maxTeamIndex === 0) return;

        this.teamDragCurrentX = event.clientX;
        const diff = this.teamDragCurrentX - this.teamDragStartX;
        const newTranslateX = this.teamStartTranslateX + diff;

        const totalVisibleWidth = this.itemsToShow * this.teamItemWidth;
        const centerOffset = (this.viewportWidth - totalVisibleWidth) / 2;
        const minTranslate = -this.maxTeamIndex * this.teamItemWidth + centerOffset;
        const maxTranslate = centerOffset;

        if (newTranslateX > maxTranslate) this.teamTranslateX = maxTranslate + (newTranslateX - maxTranslate) * 0.3;
        else if (newTranslateX < minTranslate) this.teamTranslateX = minTranslate + (newTranslateX - minTranslate) * 0.3;
        else this.teamTranslateX = newTranslateX;
    }

    onTeamDragEnd(): void {
        if (!this.isTeamDragging || this.maxTeamIndex === 0) return;

        this.isTeamDragging = false;
        const diff = this.teamDragCurrentX - this.teamDragStartX;
        const threshold = this.teamItemWidth * 0.2;

        if (diff < -threshold && this.currentTeamIndex < this.maxTeamIndex) this.currentTeamIndex++;
        else if (diff > threshold && this.currentTeamIndex > 0) this.currentTeamIndex--;

        this.updateTeamTranslateX();
    }

    onTeamTouchStart(event: TouchEvent): void {
        if (this.maxTeamIndex === 0) return;
        this.isTeamDragging = true;
        this.teamDragStartX = event.touches[0].clientX;
        this.teamStartTranslateX = this.teamTranslateX;
    }

    onTeamTouchMove(event: TouchEvent): void {
        if (!this.isTeamDragging || this.maxTeamIndex === 0) return;

        this.teamDragCurrentX = event.touches[0].clientX;
        const diff = this.teamDragCurrentX - this.teamDragStartX;
        const newTranslateX = this.teamStartTranslateX + diff;

        const totalVisibleWidth = this.itemsToShow * this.teamItemWidth;
        const centerOffset = (this.viewportWidth - totalVisibleWidth) / 2;
        const minTranslate = -this.maxTeamIndex * this.teamItemWidth + centerOffset;
        const maxTranslate = centerOffset;

        if (newTranslateX > maxTranslate) this.teamTranslateX = maxTranslate + (newTranslateX - maxTranslate) * 0.3;
        else if (newTranslateX < minTranslate) this.teamTranslateX = minTranslate + (newTranslateX - minTranslate) * 0.3;
        else this.teamTranslateX = newTranslateX;
    }

    private setupEmailIconClick(): void {
        setTimeout(() => {
            const emailIcon = document.getElementById('index-team-emailIcon');
            if (emailIcon) {
                emailIcon.addEventListener('click', () => {
                    window.location.href = 'https://www.linkedin.com/company/eliasdhcom/jobs/';
                });
            }
        }, 100);
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