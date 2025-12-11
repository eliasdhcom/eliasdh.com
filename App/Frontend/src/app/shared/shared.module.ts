/**
 * @author EliasDH Team
 * @see https://eliasdh.com
 * @since 01/01/2025
 */

import { NgModule } from '@angular/core';
import { ContextMenuComponent } from './contextmenu/contextmenu.component';
import { FooterComponent } from './footer/footer.component';

@NgModule({
    imports: [
        ContextMenuComponent,
        FooterComponent
    ],
    exports: [
        ContextMenuComponent,
        FooterComponent
    ]
})

export class SharedModule {}