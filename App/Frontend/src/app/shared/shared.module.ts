/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { NgModule } from '@angular/core';
import { ContextMenuComponent } from './contextmenu/contextmenu.component';
import { FooterComponent } from './footer/footer.component';
import { ContactComponent } from './contact/contact.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { ErrorBoxComponent } from './error-box/error-box.component';

@NgModule({
    imports: [
        ContextMenuComponent,
        FooterComponent,
        ContactComponent,
        PageHeaderComponent,
        LoadingSpinnerComponent,
        ErrorBoxComponent
    ],
    exports: [
        ContextMenuComponent,
        FooterComponent,
        ContactComponent,
        PageHeaderComponent,
        LoadingSpinnerComponent,
        ErrorBoxComponent
    ]
})

export class SharedModule {}