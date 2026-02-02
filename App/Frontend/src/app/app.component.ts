/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, inject } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { filter, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

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

    constructor() {
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
                    canonical: route.snapshot.data['canonical'] || 'https://eliasdh.com'
                };
            })
        ).subscribe(({ title, description, canonical }) => {
            this.titleService.setTitle(title);
            this.metaService.updateTag({ name: 'description', content: description });
            this.metaService.updateTag({ property: 'og:title', content: title });
            this.metaService.updateTag({ property: 'og:description', content: description });
            this.metaService.updateTag({ name: 'twitter:title', content: title });
            this.metaService.updateTag({ name: 'twitter:description', content: description });
            this.metaService.updateTag({ rel: 'canonical', href: canonical });
            this.metaService.updateTag({ property: 'og:url', content: canonical });
        });
    }
}