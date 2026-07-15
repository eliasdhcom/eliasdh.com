/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 15/07/2026
**/

import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { TrafficPoint, TrafficRange } from '../../services/portal.service';

interface ChartPoint {
    x:     number;
    y:     number;
    value: number;
    date:  Date;
}

const WIDTH  = 640;
const HEIGHT = 160;
const PAD    = { left: 30, right: 40, top: 10, bottom: 22 };

@Component({
    selector: 'app-traffic-chart',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './traffic-chart.component.html',
    styleUrls: ['./traffic-chart.component.css']
})
export class TrafficChartComponent {
    @Input() loading = false;
    @Input() range: TrafficRange = '7d';

    @Input() set points(value: TrafficPoint[] | null) {
        this._points = value ?? [];
        this.rebuild();
    }
    get points(): TrafficPoint[] { return this._points; }

    @Output() rangeChange = new EventEmitter<TrafficRange>();

    @ViewChild('svgEl') svgRef?: ElementRef<SVGSVGElement>;

    readonly ranges: TrafficRange[] = ['24h', '7d', '30d'];
    readonly width  = WIDTH;
    readonly height = HEIGHT;
    readonly plotTop    = PAD.top;
    readonly plotBottom = HEIGHT - PAD.bottom;
    readonly plotLeft   = PAD.left;
    readonly plotRight  = WIDTH - PAD.right;

    chartPoints: ChartPoint[] = [];
    linePath  = '';
    areaPath  = '';
    yTicks: { y: number; value: number }[] = [];

    hoverIndex: number | null = null;
    hoverLeftPercent = 0;

    private _points: TrafficPoint[] = [];

    get hasData(): boolean {
        return this._points.length > 0;
    }

    get total(): number {
        return this._points.reduce((sum, p) => sum + p.count, 0);
    }

    get hoverPoint(): ChartPoint | null {
        return this.hoverIndex !== null ? this.chartPoints[this.hoverIndex] : null;
    }

    get endPoint(): ChartPoint | null {
        return this.chartPoints.length ? this.chartPoints[this.chartPoints.length - 1] : null;
    }

    selectRange(r: TrafficRange): void {
        if (r === this.range) return;
        this.rangeChange.emit(r);
    }

    onPointerMove(event: PointerEvent): void {
        if (!this.chartPoints.length || !this.svgRef) return;
        const rect = this.svgRef.nativeElement.getBoundingClientRect();
        if (!rect.width) return;
        const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const targetX = fraction * WIDTH;

        let nearest = 0;
        let best = Infinity;
        this.chartPoints.forEach((p, i) => {
            const d = Math.abs(p.x - targetX);
            if (d < best) { best = d; nearest = i; }
        });

        this.hoverIndex = nearest;
        this.hoverLeftPercent = (this.chartPoints[nearest].x / WIDTH) * 100;
    }

    onPointerLeave(): void {
        this.hoverIndex = null;
    }

    formatTick(value: number): string {
        if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
        return String(Math.round(value));
    }

    formatHoverDate(date: Date): string {
        const opts: Intl.DateTimeFormatOptions = this.range === '24h'
            ? { hour: '2-digit', minute: '2-digit' }
            : { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleString('nl-BE', opts);
    }

    private rebuild(): void {
        this.hoverIndex = null;

        if (!this._points.length) {
            this.chartPoints = [];
            this.linePath = '';
            this.areaPath = '';
            this.yTicks = [];
            return;
        }

        const dates  = this._points.map(p => new Date(p.t));
        const minT   = dates[0].getTime();
        const maxT   = dates[dates.length - 1].getTime();
        const span   = Math.max(1, maxT - minT);
        const rawMax = Math.max(...this._points.map(p => p.count), 1);
        const niceMax = this.niceCeil(rawMax);

        const plotWidth  = WIDTH  - PAD.left - PAD.right;
        const plotHeight = HEIGHT - PAD.top  - PAD.bottom;

        this.chartPoints = this._points.map((p, i) => {
            const t = dates[i].getTime();
            const x = this._points.length === 1
                ? PAD.left + plotWidth / 2
                : PAD.left + ((t - minT) / span) * plotWidth;
            const y = PAD.top + plotHeight - (p.count / niceMax) * plotHeight;
            return { x, y, value: p.count, date: dates[i] };
        });

        this.linePath = this.chartPoints
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(' ');

        const baseline = PAD.top + plotHeight;
        const first = this.chartPoints[0];
        const last  = this.chartPoints[this.chartPoints.length - 1];
        this.areaPath = `${this.linePath} L ${last.x.toFixed(1)},${baseline.toFixed(1)} L ${first.x.toFixed(1)},${baseline.toFixed(1)} Z`;

        this.yTicks = [0, 0.5, 1].map(f => ({
            y: PAD.top + plotHeight - f * plotHeight,
            value: Math.round(niceMax * f)
        }));
    }

    private niceCeil(value: number): number {
        if (value <= 5) return 5;
        const exp = Math.pow(10, Math.floor(Math.log10(value)));
        const fraction = value / exp;
        const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
        return niceFraction * exp;
    }
}
