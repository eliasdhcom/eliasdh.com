/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 08/03/2026
**/

import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogService, BlogPost, ContentBlock } from '../services/blog.service';
import { SharedModule } from '../shared/shared.module';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Meta, Title } from '@angular/platform-browser';

@Component({
    selector: 'app-blog-article',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslatePipe, RouterLink],
    templateUrl: './blog-article.component.html',
    styleUrls: ['./blog-article.component.css']
})

export class BlogArticleComponent implements OnInit, OnDestroy {
    private blogService = inject(BlogService);
    private languageService = inject(LanguageService);
    private translateService = inject(TranslateService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private meta = inject(Meta);
    private title = inject(Title);
    private destroy$ = new Subject<void>();

    blogPost: BlogPost | null = null;
    loading = true;
    error: string | null = null;
    currentLanguage = 'en';

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        @Inject(DOCUMENT) private document: Document
    ) {}

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
        this.currentLanguage = this.translateService.currentLang || 'en';

        this.translateService.onLangChange
            .pipe(takeUntil(this.destroy$))
            .subscribe(event => {
                this.currentLanguage = event.lang;
            });

        this.route.paramMap
            .pipe(takeUntil(this.destroy$))
            .subscribe(params => {
                const slug = params.get('slug');
                if (slug) {
                    this.loadBlogPost(slug);
                } else {
                    this.router.navigate(['/blog']);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.removeStructuredData();
    }

    loadBlogPost(slug: string): void {
        this.loading = true;
        this.error = null;

        this.blogService.getPostBySlug(slug)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.blogPost = response.data;
                        this.updateSeoMeta();
                        this.addStructuredData();
                    }
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err.message || 'Failed to load blog post';
                    this.loading = false;
                }
            });
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString(this.currentLanguage, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getWordCount(): number {
        if (!this.blogPost) return 0;
        let allText = '';
        for (const block of this.blogPost.content) {
            if (block.text) allText += ' ' + block.text;
            if (block.items) allText += ' ' + block.items.join(' ');
        }
        return allText.split(/\s+/).filter(w => w.length > 0).length;
    }

    getShareUrl(): string {
        if (!this.blogPost) return '';
        return encodeURIComponent(`https://eliasdh.com/blog/${this.blogPost.slug}`);
    }

    getShareTitle(): string {
        if (!this.blogPost) return '';
        return encodeURIComponent(this.blogPost.title);
    }

    copyLink(): void {
        if (!isPlatformBrowser(this.platformId) || !this.blogPost) return;
        const url = `https://eliasdh.com/blog/${this.blogPost.slug}`;
        navigator.clipboard.writeText(url);
    }

    private updateSeoMeta(): void {
        if (!this.blogPost) return;

        const titleText = `${this.blogPost.title} | EliasDH Blog`;
        const descText = this.blogPost.excerpt;
        const canonicalUrl = `https://eliasdh.com/blog/${this.blogPost.slug}`;

        this.title.setTitle(titleText);
        this.meta.updateTag({ name: 'description', content: descText });
        this.meta.updateTag({ name: 'author', content: this.blogPost.author });

        this.meta.updateTag({ property: 'og:title', content: titleText });
        this.meta.updateTag({ property: 'og:description', content: descText });
        this.meta.updateTag({ property: 'og:type', content: 'article' });
        this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
        this.meta.updateTag({ property: 'article:published_time', content: this.blogPost.publishedAt });
        this.meta.updateTag({ property: 'article:author', content: this.blogPost.author });

        this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
        this.meta.updateTag({ name: 'twitter:title', content: titleText });
        this.meta.updateTag({ name: 'twitter:description', content: descText });

        this.updateCanonicalUrl(canonicalUrl);
    }

    private updateCanonicalUrl(url: string): void {
        if (!isPlatformBrowser(this.platformId)) return;

        let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }

    private addStructuredData(): void {
        if (!this.blogPost || !isPlatformBrowser(this.platformId)) return;

        const structuredData = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            'headline': this.blogPost.title,
            'description': this.blogPost.excerpt,
            'author': {
                '@type': 'Person',
                'name': this.blogPost.author
            },
            'datePublished': this.blogPost.publishedAt,
            'publisher': {
                '@type': 'Organization',
                'name': 'EliasDH',
                'url': 'https://eliasdh.com'
            },
            'mainEntityOfPage': {
                '@type': 'WebPage',
                '@id': `https://eliasdh.com/blog/${this.blogPost.slug}`
            },
            'wordCount': this.getWordCount()
        };

        const script = this.document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'blog-structured-data';
        script.text = JSON.stringify(structuredData);
        this.document.head.appendChild(script);
    }

    private removeStructuredData(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const script = this.document.getElementById('blog-structured-data');
        if (script) {
            script.remove();
        }
    }
}