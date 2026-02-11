/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/02/2026
**/

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusService, StatusResponse, StatusNode } from '../services/status.service';
import { SharedModule } from '../shared/shared.module';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface SortConfig {
    field: keyof StatusNode | 'memory' | 'cpu';
    direction: 'asc' | 'desc';
}

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

    statusData: StatusResponse | null = null;
    loading = true;
    error: string | null = null;

    currentPage = 1;
    pageSize = 10;

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
        this.loadStatusData();
    }

    loadStatusData(): void {
        this.loading = true;
        this.error = null;

        this.statusService.getStatusRefreshing()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.statusData = data;
                    this.resetPagination();
                    this.loading = false;
                },
                error: (error) => {
                    this.error = 'Failed to load status. Please try again later.';
                    this.loading = false;
                    console.error('Status error:', error);
                }
            });
    }

    resetPagination(): void {
        this.currentPage = 1;
    }

    getFilteredNodes(): StatusNode[] {
        if (!this.statusData?.data.nodes.nodes) return [];
        return [...this.statusData.data.nodes.nodes];
    }

    getPaginatedNodes(): StatusNode[] {
        const filtered = this.getFilteredNodes();
        const start = (this.currentPage - 1) * this.pageSize;
        return filtered.slice(start, start + this.pageSize);
    }

    getTotalPages(): number {
        return Math.ceil(this.getFilteredNodes().length / this.pageSize);
    }

    getTotalNodes(): number {
        return this.getFilteredNodes().length;
    }

    nextPage(): void {
        if (this.currentPage < this.getTotalPages()) {
            this.currentPage++;
        }
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
        }
    }



    getNodeStatusClass(node: StatusNode): string {
        if (node.status === 'Ready') {
            return 'status-ready';
        } else if (node.status === 'NotReady') {
            return 'status-notready';
        }
        return 'status-unknown';
    }

    getMemoryPercentage(node: StatusNode): number {
        if (!node.resources.memoryAllocatable || !node.resources.memoryCapacity) {
            return 0;
        }

        const allocatable = this.statusService.parseMemory(node.resources.memoryAllocatable);
        const capacity = this.statusService.parseMemory(node.resources.memoryCapacity);

        if (capacity === 0) return 0;
        return (allocatable / capacity) * 100;
    }

    getMemoryUsed(node: StatusNode): string {
        if (!node.resources.memoryCapacity || !node.resources.memoryAllocatable) {
            return 'N/A';
        }

        const capacity = this.statusService.parseMemory(node.resources.memoryCapacity);
        const allocatable = this.statusService.parseMemory(node.resources.memoryAllocatable);
        const used = capacity - allocatable;

        return `${this.statusService.formatBytes(used)} / ${this.statusService.formatBytes(capacity)}`;
    }

    getCPUPercentage(node: StatusNode): number {
        if (!node.resources.cpuAllocatable || !node.resources.cpuCapacity) {
            return 0;
        }

        const allocatable = this.statusService.parseCpu(node.resources.cpuAllocatable);
        const capacity = this.statusService.parseCpu(node.resources.cpuCapacity);

        if (capacity === 0) return 0;
        return (allocatable / capacity) * 100;
    }

    getCPUUsed(node: StatusNode): string {
        if (!node.resources.cpuCapacity || !node.resources.cpuAllocatable) {
            return 'N/A';
        }

        const capacity = this.statusService.parseCpu(node.resources.cpuCapacity);
        const allocatable = this.statusService.parseCpu(node.resources.cpuAllocatable);
        const used = capacity - allocatable;

        return `${(used * 1000).toFixed(0)}m / ${(capacity * 1000).toFixed(0)}m`;
    }

    getHealthPercentage(): number {
        if (!this.statusData?.data.overview.nodes) {
            return 0;
        }

        const { ready, total } = this.statusData.data.overview.nodes;
        return (ready / total) * 100;
    }

    getClusterHealthClass(): string {
        if (!this.statusData?.data.overview.clusterHealth) {
            return 'health-unknown';
        }

        const status = this.statusData.data.overview.clusterHealth.status;
        return status === 'Healthy' ? 'health-healthy' : 'health-degraded';
    }

    getMemoryUsageClass(percentage: number): string {
        if (percentage < 50) return 'usage-low';
        if (percentage < 80) return 'usage-medium';
        return 'usage-high';
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}