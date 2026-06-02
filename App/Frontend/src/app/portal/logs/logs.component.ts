/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LogsService, LogEntry, LogsFilter } from '../../services/logs.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

const PAGE_SIZE = 50;

@Component({
    selector: 'app-portal-logs',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './logs.component.html',
    styleUrls: ['./logs.component.css']
})
export class PortalLogsComponent implements OnInit, OnDestroy {
    logs:    LogEntry[] = [];
    total    = 0;
    loading  = true;
    error    = '';

    filterSearch   = '';

    currentPage = 1;
    get totalPages(): number { return Math.max(1, Math.ceil(this.total / PAGE_SIZE)); }
    get pageNumbers(): number[] {
        const pages: number[] = [];
        const start = Math.max(1, this.currentPage - 2);
        const end   = Math.min(this.totalPages, this.currentPage + 2);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }

    private destroy$     = new Subject<void>();
    private searchChange = new Subject<string>();

    constructor(private logsService: LogsService) {}

    ngOnInit(): void {
        this.searchChange.pipe(
            debounceTime(350),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => { this.currentPage = 1; this.load(); });
        this.load();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    load(): void {
        this.loading = true;
        this.error   = '';
        const filter: LogsFilter = {
            limit:  PAGE_SIZE,
            offset: (this.currentPage - 1) * PAGE_SIZE
        };
        if (this.filterSearch) filter.search = this.filterSearch;

        this.logsService.getLogs(filter)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next:  r => { this.logs = r.data; this.total = r.total; this.loading = false; },
                error: () => { this.error = 'Logs konden niet worden geladen.'; this.loading = false; }
            });
    }

    onSearchInput(): void { this.searchChange.next(this.filterSearch); }

    goToPage(p: number): void {
        if (p < 1 || p > this.totalPages) return;
        this.currentPage = p;
        this.load();
    }

    formatDate(iso: string): string {
        if (!iso) return '—';
        const d = new Date(iso);
        return isNaN(d.getTime()) ? iso : d.toLocaleString('nl-BE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }

    actionClass(action: string): string {
        switch (action) {
            case 'LOGIN':          return 'logs-badge--login';
            case 'LOGOUT':         return 'logs-badge--logout';
            case 'CREATE':         return 'logs-badge--create';
            case 'UPDATE':         return 'logs-badge--update';
            case 'DELETE':         return 'logs-badge--delete';
            case 'TOGGLE':         return 'logs-badge--toggle';
            case 'DOWNLOAD':       return 'logs-badge--download';
            case 'PASSWORD_RESET': return 'logs-badge--password';
            default:               return 'logs-badge--default';
        }
    }
}