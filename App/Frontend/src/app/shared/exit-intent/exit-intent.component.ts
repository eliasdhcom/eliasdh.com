/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 19/02/2026
**/

import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-exit-intent',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './exit-intent.component.html',
    styleUrls: ['./exit-intent.component.css']
})

export class ExitIntentComponent {
    showPopup: boolean = false;
    popupShown: boolean = false;

    @HostListener('document:mouseleave', ['$event'])
    onMouseLeave(event: MouseEvent): void {
        if (event.clientY <= 0 && !this.popupShown) {
            this.showPopup = true;
            this.popupShown = true;
        }
    }

    closePopup(): void {
        this.showPopup = false;
    }
}