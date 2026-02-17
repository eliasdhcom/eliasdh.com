/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component } from '@angular/core';
import { TranslatePipe } from "@ngx-translate/core";

@Component({
    selector: 'app-contact-bar',
    templateUrl: './contact-bar.component.html',
    styleUrls: ['./contact-bar.component.css'],
    imports: [TranslatePipe],
    standalone: true
})

export class ContactBarComponent {}