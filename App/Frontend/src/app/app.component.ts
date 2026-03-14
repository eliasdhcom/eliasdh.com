/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, inject, Inject } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { filter, map } from 'rxjs/operators';
import { CommonModule, DOCUMENT } from '@angular/common';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, CommonModule],
    template: `<router-outlet></router-outlet>`,
    providers: [Title, Meta]
})

export class AppComponent {
    private router = inject(Router);
    private titleService = inject(Title);
    private metaService = inject(Meta);

    private defaultDescription = 'Welcome to EliasDH, a company that offers hosting services, web development, and tailored IT solutions for businesses and individuals.';

    constructor(@Inject(DOCUMENT) private document: Document) {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            map(() => {
                let route = this.router.routerState.root;
                while (route.firstChild) {
                    route = route.firstChild;
                }
                return {
                    title: route.snapshot.data['title'] || 'EliasDH',
                    description: route.snapshot.data['description'] || this.defaultDescription,
                    canonical: route.snapshot.data['canonical'] || 'https://eliasdh.com',
                    robots: route.snapshot.data['robots'] || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
                };
            })
        ).subscribe(({ title, description, canonical, robots }) => {
            this.titleService.setTitle(title);
            this.metaService.updateTag({ name: 'description', content: description });
            this.metaService.updateTag({ property: 'og:title', content: title });
            this.metaService.updateTag({ property: 'og:description', content: description });
            this.metaService.updateTag({ name: 'twitter:title', content: title });
            this.metaService.updateTag({ name: 'twitter:description', content: description });
            this.metaService.updateTag({ name: 'robots', content: robots });
            this.metaService.updateTag({ property: 'og:url', content: canonical });
            this.updateCanonicalUrl(canonical);
        });
    }

    private updateCanonicalUrl(url: string): void {
        let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }
}