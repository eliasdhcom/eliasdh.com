/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/02/2026
**/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

export interface NodeCondition {
    type: string;
    status: string;
    reason: string;
    message: string;
    lastHeartbeatTime: string;
    lastTransitionTime: string;
}

export interface NodeResources {
    cpuCapacity: string;
    memoryCapacity: string;
    cpuAllocatable: string;
    memoryAllocatable: string;
    podsCapacity: string;
    podsAllocatable: string;
    storageCapacity?: string;
    storageAllocatable?: string;
}

export interface StatusNode {
    name: string;
    status: string;
    resources: NodeResources;
    allocatable: { [key: string]: string };
    capacity: { [key: string]: string };
    createdAt: string;
    labels: { [key: string]: string };
}

export interface StatusNodesResponse {
    success: boolean;
    data: {
        totalNodes: number;
        healthyNodes: number;
        unhealthyNodes: number;
        nodes: StatusNode[];
        timestamp: string;
    };
}

export interface NodeMetrics {
    total: number;
    ready: number;
    notReady: number;
    memory: { capacity: number; allocatable: number };
    cpu: { capacity: number; allocatable: number };
}

export interface PodMetrics {
    total: number;
    running: number;
    pending: number;
    failed: number;
    succeeded: number;
    unknown: number;
}

export interface DeploymentMetrics {
    total: number;
    readyReplicas: number;
    desiredReplicas: number;
    updatedReplicas: number;
}

export interface StatusOverview {
    clusterHealth: {
        status: string;
        nodesHealthy: boolean;
    };
    nodes: NodeMetrics;
    pods: PodMetrics;
    deployments: DeploymentMetrics;
    timestamp: string;
}

export interface StatusOverviewResponse {
    success: boolean;
    data: StatusOverview;
}

export interface StatusResponse {
    success: boolean;
    data: {
        overview: StatusOverview;
        nodes: {
            totalNodes: number;
            healthyNodes: number;
            unhealthyNodes: number;
            nodes: StatusNode[];
            timestamp: string;
        };
        timestamp: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class StatusService {
    private apiUrl = `${environment.eliasdhApiUrl}/api/v1/cluster`;

    constructor(private http: HttpClient) {}

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'x-api-key': environment.eliasdhApiKey,
            'Content-Type': 'application/json'
        });
    }

    getOverview(): Observable<StatusOverviewResponse> {
        return this.http.get<StatusOverviewResponse>(
            `${this.apiUrl}/overview`,
            { headers: this.getHeaders() }
        );
    }

    getNodes(): Observable<StatusNodesResponse> {
        return this.http.get<StatusNodesResponse>(
            `${this.apiUrl}/nodes`,
            { headers: this.getHeaders() }
        );
    }

    getStatus(): Observable<StatusResponse> {
        return this.http.get<StatusResponse>(
            `${this.apiUrl}/status`,
            { headers: this.getHeaders() }
        );
    }

    getStatusRefreshing(): Observable<StatusResponse> {
        return interval(10000).pipe(
            startWith(0),
            switchMap(() => this.getStatus())
        );
    }

    getNodesRefreshing(): Observable<StatusNodesResponse> {
        return interval(10000).pipe(
            startWith(0),
            switchMap(() => this.getNodes())
        );
    }

    parseMemory(memory: string): number {
        if (!memory) return 0;

        const value = memory.replace(/[a-zA-Z]/g, '');
        const unit = memory.replace(/[0-9]/g, '');

        const numValue = parseFloat(value);

        switch (unit) {
            case 'Ki':
                return numValue * 1024;
            case 'Mi':
                return numValue * 1024 * 1024;
            case 'Gi':
                return numValue * 1024 * 1024 * 1024;
            case 'Ti':
                return numValue * 1024 * 1024 * 1024 * 1024;
            default:
                return numValue;
        }
    }

    parseCpu(cpu: string): number {
        if (!cpu) return 0;

        if (cpu.endsWith('m')) {
            return parseFloat(cpu) / 1000;
        }
        return parseFloat(cpu);
    }

    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    calculateMemoryUsage(allocatable: string, capacity: string): number {
        const allocatableBytes = this.parseMemory(allocatable);
        const capacityBytes = this.parseMemory(capacity);

        if (capacityBytes === 0) return 0;

        return (allocatableBytes / capacityBytes) * 100;
    }
}