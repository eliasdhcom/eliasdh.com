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

interface TrustedClient {
    name: string;
    logo: string;
    url: string;
}

interface Review {
    rating: number;
    textKey: string;
    name: string;
}

interface FaqItem {
    questionKey: string;
    answerKey: string;
    isOpen: boolean;
}

type TeamMember = JoinCard | MemberCard;

@Component({
    selector: 'app-index',
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.css'],
    imports: [TranslatePipe, CommonModule, SharedModule],
    standalone: true,
    providers: []
})

export class IndexComponent implements OnInit, OnDestroy {
    dropdownOpen: boolean = false;
    currentLanguage: string = 'en';
    
    showContactModal: boolean = false;
    contactSubject: string = '';

    reviews: Review[] = [
        { rating: 5, textKey: 'INDEX.REVIEW.REVIEW1', name: 'Sarah Van den Berg' },
        { rating: 5, textKey: 'INDEX.REVIEW.REVIEW2', name: 'Michel Dupont' },
        { rating: 5, textKey: 'INDEX.REVIEW.REVIEW3', name: 'Jan Peeters' },
        { rating: 4, textKey: 'INDEX.REVIEW.REVIEW4', name: 'Emma De Smet' },
        { rating: 5, textKey: 'INDEX.REVIEW.REVIEW5', name: 'Thomas Janssen' },
        { rating: 5, textKey: 'INDEX.REVIEW.REVIEW6', name: 'Lisa Mertens' }
    ];

    faqItems: FaqItem[] = [
        { questionKey: 'INDEX.FAQ.QUESTION1', answerKey: 'INDEX.FAQ.ANSWER1', isOpen: false },
        { questionKey: 'INDEX.FAQ.QUESTION2', answerKey: 'INDEX.FAQ.ANSWER2', isOpen: false },
        { questionKey: 'INDEX.FAQ.QUESTION3', answerKey: 'INDEX.FAQ.ANSWER3', isOpen: false },
        { questionKey: 'INDEX.FAQ.QUESTION4', answerKey: 'INDEX.FAQ.ANSWER4', isOpen: false },
        { questionKey: 'INDEX.FAQ.QUESTION5', answerKey: 'INDEX.FAQ.ANSWER5', isOpen: false },
        { questionKey: 'INDEX.FAQ.QUESTION6', answerKey: 'INDEX.FAQ.ANSWER6', isOpen: false }
    ];

    currentReviewIndex: number = 0;
    reviewsAutoRotateInterval: any = null;
    reviewsVisible: number = 3;

    trustedClients: TrustedClient[] = [
        { name: 'Ter Eiken', logo: 'assets/media/images/trusted-clients/tereiken-logo.png', url: 'https://www.tereiken.be' },
        { name: 'Level Up', logo: 'assets/media/images/trusted-clients/levelup-logo.png', url: 'https://www.levelup.be' },
        { name: 'Zizis', logo: 'assets/media/images/trusted-clients/zizis-logo.png', url: 'https://www.zizis.be' },
        { name: 'Bistro Theo', logo: 'assets/media/images/trusted-clients/bistrotheo-logo.png', url: 'https://www.bistrotheo.be' },
        { name: 'Ter Eiken', logo: 'assets/media/images/trusted-clients/tereiken-logo.png', url: 'https://www.tereiken.be' },
        { name: 'Level Up', logo: 'assets/media/images/trusted-clients/levelup-logo.png', url: 'https://www.levelup.be' },
        { name: 'Zizis', logo: 'assets/media/images/trusted-clients/zizis-logo.png', url: 'https://www.zizis.be' },
        { name: 'Bistro Theo', logo: 'assets/media/images/trusted-clients/bistrotheo-logo.png', url: 'https://www.bistrotheo.be' }
    ];

    clientsTranslateX: number = 0;
    isClientsDragging: boolean = false;
    clientsDragStartX: number = 0;
    clientsStartTranslateX: number = 0;
    clientsAutoScrollInterval: any = null;
    clientsResumeTimeout: any = null;
    clientsScrollSpeed: number = 0.5;
    clientsSingleSetWidth: number = 0;
    clientsHasDragged: boolean = false;

    teamMembers: TeamMember[] = [
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
            role: 'Chief Marketing Officer',
            roleLink: 'https://en.wikipedia.org/wiki/Chief_marketing_officer',
            roleAbbreviation: 'CMO / Co-Founder'
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
        this.initializeClientsSlider();
        this.startReviewsAutoRotate();
        this.calculateReviewsVisible();
    }

    ngOnDestroy(): void {
        this.stopClientsAutoScroll();
        this.stopReviewsAutoRotate();
        if (this.clientsResumeTimeout) {
            clearTimeout(this.clientsResumeTimeout);
        }
    }

    @HostListener('window:resize')
    onResize(): void {
        this.calculateCarouselDimensions();
        this.updateTeamTranslateX();
        this.calculateReviewsVisible();
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

        if (this.currentTeamIndex > this.maxTeamIndex) this.currentTeamIndex = this.maxTeamIndex;
    }

    private updateTeamTranslateX(): void {
        const firstItem = document.querySelector('.index-team-container-carousel-item') as HTMLElement;
        let marginLeft = 15;

        if (firstItem) {
            const style = window.getComputedStyle(firstItem);
            marginLeft = parseFloat(style.marginLeft) || 15;
        }

        const totalItemsWidth = this.totalTeamItems * this.teamItemWidth;
        const visibleItemsWidth = this.itemsToShow * this.teamItemWidth;

        if (this.totalTeamItems <= this.itemsToShow) {
            const centerOffset = (this.viewportWidth - totalItemsWidth) / 2 + marginLeft;
            this.teamTranslateX = centerOffset;
        } else {
            const centerOffset = (this.viewportWidth - visibleItemsWidth) / 2 + marginLeft;
            this.teamTranslateX = -this.currentTeamIndex * this.teamItemWidth + centerOffset;
        }
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

    openContactModal(subject: string = ''): void {
        this.contactSubject = subject;
        this.showContactModal = true;
    }

    closeContactModal(): void {
        this.showContactModal = false;
        this.contactSubject = '';
    }

    private initializeClientsSlider(): void {
        setTimeout(() => {
            this.calculateClientsSingleSetWidth();
            this.clientsTranslateX = 0;
            this.startClientsAutoScroll();
        }, 100);
    }

    private calculateClientsSingleSetWidth(): void {
        const logos = document.querySelector('.index-trusted-clients-logos');
        if (logos) {
            const items = logos.querySelectorAll('.client-logo-wrapper');
            const numClients = this.trustedClients.length;
            if (items.length > 0 && numClients > 0) {
                let totalWidth = 0;
                for (let i = 0; i < numClients; i++) {
                    const item = items[i] as HTMLElement;
                    totalWidth += item.offsetWidth;
                }
                this.clientsSingleSetWidth = totalWidth;
            }
        }
    }

    private startClientsAutoScroll(): void {
        if (this.clientsAutoScrollInterval) return;

        const animate = () => {
            this.clientsTranslateX -= this.clientsScrollSpeed;
            if (this.clientsTranslateX <= -this.clientsSingleSetWidth) this.clientsTranslateX += this.clientsSingleSetWidth;
            this.clientsAutoScrollInterval = requestAnimationFrame(animate);
        };

        this.clientsAutoScrollInterval = requestAnimationFrame(animate);
    }

    private normalizeClientsPosition(): void {
        if (this.clientsSingleSetWidth <= 0) return;
        while (this.clientsTranslateX <= -this.clientsSingleSetWidth) this.clientsTranslateX += this.clientsSingleSetWidth;
        while (this.clientsTranslateX > 0) this.clientsTranslateX -= this.clientsSingleSetWidth;
    }

    private stopClientsAutoScroll(): void {
        if (this.clientsAutoScrollInterval) {
            cancelAnimationFrame(this.clientsAutoScrollInterval);
            this.clientsAutoScrollInterval = null;
        }
    }

    private resumeClientsAutoScroll(): void {
        if (this.clientsResumeTimeout) clearTimeout(this.clientsResumeTimeout);

        this.clientsResumeTimeout = setTimeout(() => {
            this.startClientsAutoScroll();
        }, 2000);
    }

    onClientsDragStart(event: MouseEvent): void {
        this.isClientsDragging = true;
        this.clientsHasDragged = false;
        this.clientsDragStartX = event.clientX;
        this.clientsStartTranslateX = this.clientsTranslateX;
        this.stopClientsAutoScroll();
    }

    onClientsDragMove(event: MouseEvent): void {
        if (!this.isClientsDragging) return;

        const diff = event.clientX - this.clientsDragStartX;
        if (Math.abs(diff) > 5) {
            this.clientsHasDragged = true;
            event.preventDefault();
        }

        if (this.clientsHasDragged) {
            this.clientsTranslateX = this.clientsStartTranslateX + diff;
            this.normalizeClientsPosition();
        }
    }

    onClientsDragEnd(): void {
        if (!this.isClientsDragging) return;

        setTimeout(() => {
            this.isClientsDragging = false;
            this.clientsHasDragged = false;
        }, 50);

        this.resumeClientsAutoScroll();
    }

    onLogoClick(event: MouseEvent): void {
        if (this.clientsHasDragged) {
            event.preventDefault();
        }
    }

    onClientsTouchStart(event: TouchEvent): void {
        this.isClientsDragging = true;
        this.clientsHasDragged = false;
        this.clientsDragStartX = event.touches[0].clientX;
        this.clientsStartTranslateX = this.clientsTranslateX;
        this.stopClientsAutoScroll();
    }

    onClientsTouchMove(event: TouchEvent): void {
        if (!this.isClientsDragging) return;

        const diff = event.touches[0].clientX - this.clientsDragStartX;
        if (Math.abs(diff) > 5) this.clientsHasDragged = true;

        this.clientsTranslateX = this.clientsStartTranslateX + diff;
        this.normalizeClientsPosition();
    }

    private startReviewsAutoRotate(): void {
        this.reviewsAutoRotateInterval = setInterval(() => {
            this.currentReviewIndex = (this.currentReviewIndex + 1) % this.reviews.length;
        }, 4000);
    }

    private stopReviewsAutoRotate(): void {
        if (this.reviewsAutoRotateInterval) {
            clearInterval(this.reviewsAutoRotateInterval);
            this.reviewsAutoRotateInterval = null;
        }
    }

    private calculateReviewsVisible(): void {
        const windowWidth = window.innerWidth;
        if (windowWidth >= 1200) this.reviewsVisible = 3;
        else if (windowWidth >= 768) this.reviewsVisible = 2;
        else this.reviewsVisible = 1;
    }

    isReviewVisible(index: number): boolean {
        const total = this.reviews.length;
        for (let i = 0; i < this.reviewsVisible; i++) {
            if ((this.currentReviewIndex + i) % total === index) return true;
        }
        return false;
    }

    toggleFaq(index: number): void {
        this.faqItems[index].isOpen = !this.faqItems[index].isOpen;
    }
}