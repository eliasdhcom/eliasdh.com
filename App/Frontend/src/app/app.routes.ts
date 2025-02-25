/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { PrivacyPolicyComponent } from './privacypolicy/privacypolicy.component';
import { LegalGuidelinesComponent } from './legalguidelines/legalguidelines.component';
import { DomainRentedComponent } from './domainrented/domainrented.component';
import { AccessDeniedComponent } from './accessdenied/accessdenied.component';
import { NotFoundComponent } from './notfound/notfound.component';

export const routes: Routes = [
    { path: '', redirectTo: 'index', pathMatch: 'full' },
    { path: 'index', component: IndexComponent, data: { title: 'EliasDH' } },
    { path: 'privacypolicy', component: PrivacyPolicyComponent, data: { title: 'EliasDH - Privacy Policy' } },
    { path: 'legalguidelines', component: LegalGuidelinesComponent, data: { title: 'EliasDH - Legal Guidelines' } },
    { path: 'domainrented', component: DomainRentedComponent, data: { title: 'EliasDH - Domain Rented' } },
    { path: 'accessdenied', component: AccessDeniedComponent, data: { title: 'EliasDH - Access Denied' } },
    { path: '**', component: NotFoundComponent, data: { title: 'EliasDH - Not Found' } }
];