/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 08/03/2026
**/

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BlogService, BlogPostSummary, PaginationInfo } from '../services/blog.service';
import { SharedModule } from '../shared/shared.module';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Meta, Title } from '@angular/platform-browser';

@Component({
    selector: 'app-blog',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslatePipe],
    templateUrl: './blog.component.html',
    styleUrls: ['./blog.component.css']
})

export class BlogComponent implements OnInit, OnDestroy {
    private blogService = inject(BlogService);
    private languageService = inject(LanguageService);
    private translateService = inject(TranslateService);
    private meta = inject(Meta);
    private title = inject(Title);
    private router = inject(Router);
    private destroy$ = new Subject<void>();

    blogPosts: BlogPostSummary[] = [];
    loading = true;
    error: string | null = null;
    currentLanguage = 'en';

    pagination: PaginationInfo | null = null;
    currentPage = 1;

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
        this.currentLanguage = this.translateService.currentLang || 'en';

        this.translateService.onLangChange
            .pipe(takeUntil(this.destroy$))
            .subscribe(event => {
                this.currentLanguage = event.lang;
                this.updateSeoMeta();
            });

        this.loadBlogPosts(1);
        this.updateSeoMeta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadBlogPosts(page: number): void {
        this.loading = true;
        this.error = null;
        this.currentPage = page;

        this.blogService.getAllPosts(page)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.blogPosts = response.data;
                        this.pagination = response.pagination;
                    } else this.error = 'Failed to load blog posts';
                    this.loading = false;
                },
                error: (err) => {
                    this.error = this.error = 'Failed to load blog posts. Please try again later.';
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

    navigateToPost(slug: string): void {
        this.router.navigate(['/blog', slug]);
    }

    trackBySlug(index: number, post: BlogPostSummary): string {
        return post.slug;
    }

    goToNextPage(): void {
        if (this.pagination?.hasNextPage) {
            this.loadBlogPosts(this.currentPage + 1);
        }
    }

    goToPrevPage(): void {
        if (this.pagination?.hasPrevPage) {
            this.loadBlogPosts(this.currentPage - 1);
        }
    }

    private updateSeoMeta(): void {
        const titleText = this.translateService.instant('BLOG.TRANSLATE14');
        const descText = this.translateService.instant('BLOG.TRANSLATE15');

        this.title.setTitle(titleText);
        this.meta.updateTag({ name: 'description', content: descText });
        this.meta.updateTag({ property: 'og:title', content: titleText });
        this.meta.updateTag({ property: 'og:description', content: descText });
        this.meta.updateTag({ property: 'og:type', content: 'website' });
        this.meta.updateTag({ property: 'og:url', content: 'https://eliasdh.com/blog' });
        this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
        this.meta.updateTag({ name: 'twitter:title', content: titleText });
        this.meta.updateTag({ name: 'twitter:description', content: descText });
    }
}