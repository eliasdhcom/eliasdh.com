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
import { FuckYouComponent } from './fuckyou/fuckyou.component';
import { MapComponent } from './map/map.component';
import { StatusComponent } from './status/status.component';

export const routes: Routes = [
    { 
        path: '', 
        component: IndexComponent, 
        data: { 
            title: 'EliasDH', 
            description: 'Welcome to EliasDH, a company that offers hosting services, web development, and tailored IT solutions for businesses and individuals.',
            canonical: 'https://eliasdh.com/'
        } 
    },
    { 
        path: 'privacypolicy', 
        component: PrivacyPolicyComponent, 
        data: { 
            title: 'EliasDH - Privacy Policy', 
            description: 'Read the Privacy Policy of EliasDH. Learn how we collect, use, and protect your personal data when using our hosting and web development services.',
            canonical: 'https://eliasdh.com/privacypolicy'
        } 
    },
    { 
        path: 'legalguidelines', 
        component: LegalGuidelinesComponent, 
        data: { 
            title: 'EliasDH - Legal Guidelines', 
            description: 'Legal guidelines and terms of service for EliasDH. All content and materials showcased on this platform are subject to these guidelines.',
            canonical: 'https://eliasdh.com/legalguidelines'
        } 
    },
    { 
        path: 'map', 
        component: MapComponent, 
        data: { 
            title: 'EliasDH - Customer Map', 
            description: 'Explore our customer map to see where EliasDH clients are located. Discover businesses and individuals who trust our hosting and web development services.',
            canonical: 'https://eliasdh.com/map'
        } 
    },
    { 
        path: 'status', 
        component: StatusComponent, 
        data: { 
            title: 'EliasDH - Infrastructure Status', 
            description: 'Real-time monitoring of the EliasDH infrastructure status.',
            canonical: 'https://eliasdh.com/status'
        } 
    },
    { 
        path: 'domainrented', 
        component: DomainRentedComponent, 
        data: { 
            title: 'EliasDH - Domain Rented', 
            description: 'This domain is currently rented and managed by EliasDH. Contact us for more information about domain services.',
            canonical: 'https://eliasdh.com/domainrented'
        } 
    },
    { 
        path: '403', 
        component: AccessDeniedComponent, 
        data: { 
            title: 'EliasDH - Access Denied', 
            description: 'Access denied. You do not have permission to view this page on EliasDH.',
            canonical: 'https://eliasdh.com/403'
        } 
    },
    { 
        path: '404', 
        component: NotFoundComponent, 
        data: { 
            title: 'EliasDH - Not Found', 
            description: 'Page not found. The page you are looking for does not exist on EliasDH.',
            canonical: 'https://eliasdh.com/404'
        } 
    },
    { 
        path: 'fuckyou', 
        component: FuckYouComponent, 
        data: { 
            title: 'EliasDH - Fuck You', 
            description: 'EliasDH - Special page.',
            canonical: 'https://eliasdh.com/fuckyou'
        } 
    },
    { 
        path: '**', 
        component: NotFoundComponent, 
        data: { 
            title: 'EliasDH - Not Found', 
            description: 'Page not found. The page you are looking for does not exist on EliasDH.'
        } 
    }
];