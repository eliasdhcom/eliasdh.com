/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { NgModule } from '@angular/core';
import { ContextMenuComponent } from './contextmenu/contextmenu.component';
import { FooterComponent } from './footer/footer.component';
import { ContactComponent } from './contact/contact.component';
import { ContactBarComponent } from './contact-bar/contact-bar.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { ErrorBoxComponent } from './error-box/error-box.component';
import { ExitIntentComponent } from './exit-intent/exit-intent.component';

@NgModule({
    imports: [
        ContextMenuComponent,
        FooterComponent,
        ContactComponent,
        ContactBarComponent,
        PageHeaderComponent,
        LoadingSpinnerComponent,
        ErrorBoxComponent,
        ExitIntentComponent
    ],
    exports: [
        ContextMenuComponent,
        FooterComponent,
        ContactComponent,
        ContactBarComponent,
        PageHeaderComponent,
        LoadingSpinnerComponent,
        ErrorBoxComponent,
        ExitIntentComponent
    ]
})

export class SharedModule {}