/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit, AfterViewInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { SharedModule } from '../shared/shared.module';

@Component({
    selector: 'app-accessdenied',
    templateUrl: './accessdenied.component.html',
    styleUrls: ['./accessdenied.component.css'],
    imports: [TranslatePipe, SharedModule],
    standalone: true
})
export class AccessDeniedComponent implements OnInit, AfterViewInit {
    private isHandRotated = false;
    private isAudioPlayed = false;
    private hand: HTMLElement | null = null;
    private audio: HTMLAudioElement | null = null;

    constructor(private languageService: LanguageService) {}

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
    }

    ngAfterViewInit(): void {
        this.hand = document.getElementById('accessdenied-policeman-hand');
        this.audio = document.getElementById('accessdenied-audio') as HTMLAudioElement;

        if (this.hand) {
            this.hand.style.transformOrigin = 'left bottom';
            this.hand.style.transition = 'transform 0.4s';

            setInterval(() => {
                this.isHandRotated = !this.isHandRotated;
                this.hand!.style.transform = this.isHandRotated ? 'rotate(5deg)' : 'rotate(-10deg)';
            }, 400);
        }

        document.body.addEventListener('click', () => this.playAudio());
    }

    private playAudio(): void {
        if (!this.isAudioPlayed && this.audio) {
            this.isAudioPlayed = true;
            this.audio.play();
        }
    }
}