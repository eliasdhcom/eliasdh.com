/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from "@ngx-translate/core";

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css'],
    imports: [TranslatePipe, RouterLink],
    standalone: true
})

export class FooterComponent implements OnInit {
    currentYear: number = new Date().getFullYear();

    ngOnInit(): void {
        this.currentYear = new Date().getFullYear();
    }
}