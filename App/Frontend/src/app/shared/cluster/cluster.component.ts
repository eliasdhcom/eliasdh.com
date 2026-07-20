/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 20/07/2026
**/

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { K8sPod, StatusNode, StatusService } from '../../services/status.service';
import { forkJoin, interval, of, Subject } from 'rxjs';
import { catchError, switchMap, startWith, takeUntil } from 'rxjs/operators';

interface NamespacePodStats {
    namespace: string;
    total: number;
    running: number;
    pending: number;
    failed: number;
}

@Component({
    selector:    'app-cluster',
    standalone:  true,
    imports:     [CommonModule, TranslatePipe],
    templateUrl: './cluster.component.html',
    styleUrls:   ['./cluster.component.css']
})
export class ClusterComponent implements OnInit, OnDestroy {
    @Input() relevantNamespaces: string[] = [];

    clusterLoading = true;
    clusterMemoryStats: { percent: number; formatted: string } = { percent: 0, formatted: 'N/A' };
    clusterCpuStats:    { percent: number; formatted: string } = { percent: 0, formatted: 'N/A' };
    clusterStorageTotal = 'N/A';

    nodesExpanded = false;
    nodesLoaded   = false;
    nodesLoading  = false;
    nodesError    = false;

    nodes: StatusNode[] = [];
    expandedNode: string | null = null;

    private podsByNode = new Map<string, K8sPod[]>();
    private destroy$ = new Subject<void>();

    constructor(private statusService: StatusService) {}

    ngOnInit(): void { this.loadClusterData(); }
    ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

    private loadClusterData(): void {
        this.clusterLoading = true;
        interval(15000).pipe(
            startWith(0),
            switchMap(() => this.statusService.getStatus().pipe(catchError(() => of(null)))),
            takeUntil(this.destroy$)
        ).subscribe(response => {
            if (response?.data?.nodes?.nodes) {
                const nodes = response.data.nodes.nodes;
                let memUsed = 0, memCap = 0, cpuUsed = 0, cpuCap = 0, storageCap = 0;
                for (const node of nodes) {
                    if (node.usage?.memoryUsed)          memUsed    += this.statusService.parseMemory(node.usage.memoryUsed);
                    if (node.resources?.memoryCapacity)  memCap     += this.statusService.parseMemory(node.resources.memoryCapacity);
                    if (node.usage?.cpuUsed)             cpuUsed    += this.statusService.parseCpu(node.usage.cpuUsed);
                    if (node.resources?.cpuCapacity)     cpuCap     += this.statusService.parseCpu(node.resources.cpuCapacity);
                    if (node.resources?.storageCapacity) storageCap += this.statusService.parseMemory(node.resources.storageCapacity);
                }
                this.clusterMemoryStats = {
                    percent:   memCap > 0 ? Math.round((memUsed / memCap) * 100) : 0,
                    formatted: `${this.statusService.formatBytes(memUsed)} / ${this.statusService.formatBytes(memCap)}`
                };
                this.clusterCpuStats = {
                    percent:   cpuCap > 0 ? Math.round((cpuUsed / cpuCap) * 100) : 0,
                    formatted: `${(cpuUsed * 1000).toFixed(0)}m / ${(cpuCap * 1000).toFixed(0)}m`
                };
                this.clusterStorageTotal = storageCap > 0 ? this.statusService.formatBytes(storageCap) : 'N/A';
            }
            this.clusterLoading = false;
        });
    }

    getUsageClass(pct: number): string {
        if (pct < 70) return 'usage-low';
        if (pct < 90) return 'usage-medium';
        return 'usage-high';
    }

    toggleNodes(): void {
        this.nodesExpanded = !this.nodesExpanded;
        if (this.nodesExpanded && !this.nodesLoaded) this.loadNodes();
    }

    toggleNode(nodeName: string): void {
        this.expandedNode = this.expandedNode === nodeName ? null : nodeName;
    }

    private loadNodes(): void {
        this.nodesLoading = true;
        this.nodesError   = false;

        forkJoin({
            nodes: this.statusService.getNodes(),
            pods:  this.statusService.getAllPods()
        }).pipe(
            catchError(() => { this.nodesError = true; return of(null); }),
            takeUntil(this.destroy$)
        ).subscribe(result => {
            if (result) {
                this.nodes = result.nodes.data?.nodes ?? [];

                this.podsByNode.clear();
                for (const pod of result.pods.data?.pods ?? []) {
                    if (!pod.node) continue;
                    const list = this.podsByNode.get(pod.node) ?? [];
                    list.push(pod);
                    this.podsByNode.set(pod.node, list);
                }
                this.nodesLoaded = true;
            }
            this.nodesLoading = false;
        });
    }

    namespaceStats(nodeName: string): NamespacePodStats[] {
        const relevant = new Set(this.relevantNamespaces);
        const pods = (this.podsByNode.get(nodeName) ?? []).filter(p => relevant.has(p.namespace));
        const map = new Map<string, NamespacePodStats>();

        for (const pod of pods) {
            let stat = map.get(pod.namespace);
            if (!stat) {
                stat = { namespace: pod.namespace, total: 0, running: 0, pending: 0, failed: 0 };
                map.set(pod.namespace, stat);
            }
            stat.total++;
            if (pod.status === 'Running' || pod.status === 'Succeeded') stat.running++;
            else if (pod.status === 'Pending') stat.pending++;
            else stat.failed++;
        }

        return Array.from(map.values()).sort((a, b) => a.namespace.localeCompare(b.namespace));
    }

    relevantPodCount(nodeName: string): number {
        return this.namespaceStats(nodeName).reduce((sum, s) => sum + s.total, 0);
    }

    nodeStatusClass(status: string): string {
        return status === 'Ready' ? 'cluster-nodes-status--ok' : 'cluster-nodes-status--error';
    }

    get clusterNodesStatusClass(): string {
        return this.nodes.length > 0 && this.nodes.every(n => n.status === 'Ready') ? 'cluster-nodes-status--ok' : 'cluster-nodes-status--error';
    }
}