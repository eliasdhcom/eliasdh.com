/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { NgModule } from '@angular/core';
import { ContextMenuComponent } from './contextmenu/contextmenu.component';
import { FooterComponent } from './footer/footer.component';
import { ContactComponent } from './contact/contact.component';

@NgModule({
    imports: [
        ContextMenuComponent,
        FooterComponent,
        ContactComponent
    ],
    exports: [
        ContextMenuComponent,
        FooterComponent,
        ContactComponent
    ]
})

export class SharedModule {}