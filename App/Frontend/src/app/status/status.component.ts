/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/02/2026
**/

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusService, HealthSummary } from '../services/status.service';
import { SharedModule } from '../shared/shared.module';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-status',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslatePipe],
    templateUrl: './status.component.html',
    styleUrls: ['./status.component.css']
})

export class StatusComponent implements OnInit, OnDestroy {
    private statusService = inject(StatusService);
    private languageService = inject(LanguageService);
    private destroy$ = new Subject<void>();

    health: HealthSummary | null = null;
    loading = true;
    error: string | null = null;

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();

        this.statusService.getHealthRefreshing()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.health = response.data;
                    this.loading = false;
                    this.error = null;
                },
                error: (error) => {
                    this.error = 'Failed to load status. Please try again later.';
                    this.loading = false;
                    console.error('Status error:', error);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}