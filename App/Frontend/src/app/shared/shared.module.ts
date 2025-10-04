/**
 * @author EliasDH Team
 * @see https://eliasdh.com
 * @since 01/01/2025
 */

import { NgModule } from '@angular/core';
import { ChatComponent } from './chat/chat.component';
import { ContextMenuComponent } from './contextmenu/contextmenu.component';
import { FooterComponent } from './footer/footer.component';

@NgModule({
    imports: [
        ChatComponent,
        ContextMenuComponent,
        FooterComponent
    ],
    exports: [
        ChatComponent,
        ContextMenuComponent,
        FooterComponent
    ]
})

export class SharedModule {}