/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/02/2026
**/

import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from "@ngx-translate/core";

@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.css'],
    imports: [TranslatePipe, RouterLink],
    standalone: true
})

export class PageHeaderComponent {
    @Input() titleKey: string = '';
    @Input() backLabelKey: string = '';
    @Input() backRoute: string = '/';
}