/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 15/07/2026
**/

import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { TrafficPoint, TrafficRange } from '../../services/portal.service';

interface ChartPoint {
    x:     number;
    y:     number;
    value: number;
    date:  Date;
}

const FALLBACK_WIDTH = 640;
const HEIGHT = 160;
const PAD    = { left: 30, right: 40, top: 10, bottom: 22 };

@Component({
    selector: 'app-traffic-chart',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './traffic-chart.component.html',
    styleUrls: ['./traffic-chart.component.css']
})
export class TrafficChartComponent implements AfterViewInit, OnDestroy {
    @Input() loading = false;
    @Input() range: TrafficRange = '7d';

    @Input() set points(value: TrafficPoint[] | null) {
        this._points = value ?? [];
        this.rebuild();
    }
    get points(): TrafficPoint[] { return this._points; }

    @Output() rangeChange = new EventEmitter<TrafficRange>();

    @ViewChild('rootEl') rootRef?: ElementRef<HTMLDivElement>;
    @ViewChild('svgEl') svgRef?: ElementRef<SVGSVGElement>;

    readonly ranges: TrafficRange[] = ['24h', '7d', '30d'];
    /** Kept in sync with the container's real rendered pixel width so 1 viewBox unit === 1 CSS pixel - no non-uniform stretch. */
    width = FALLBACK_WIDTH;
    readonly height   = HEIGHT;
    readonly plotTop    = PAD.top;
    readonly plotBottom = HEIGHT - PAD.bottom;
    readonly plotLeft   = PAD.left;
    get plotRight(): number { return this.width - PAD.right; }

    chartPoints: ChartPoint[] = [];
    linePath  = '';
    areaPath  = '';
    yTicks: { y: number; value: number }[] = [];

    hoverIndex: number | null = null;
    hoverLeftPercent = 0;

    private _points: TrafficPoint[] = [];
    private resizeObserver?: ResizeObserver;

    constructor(private ngZone: NgZone) {}

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

    ngAfterViewInit(): void {
        if (typeof ResizeObserver === 'undefined' || !this.rootRef) return;
        // ResizeObserver callbacks run outside Angular's zone (zone.js doesn't patch it by
        // default), so mutating `width` here wouldn't trigger change detection without this.
        this.resizeObserver = new ResizeObserver(entries => {
            const measured = Math.round(entries[0]?.contentRect.width ?? 0);
            if (measured > 0 && Math.abs(measured - this.width) > 0.5) {
                this.ngZone.run(() => {
                    this.width = measured;
                    this.rebuild();
                });
            }
        });
        this.resizeObserver.observe(this.rootRef.nativeElement);
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
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
        const targetX = fraction * this.width;

        let nearest = 0;
        let best = Infinity;
        this.chartPoints.forEach((p, i) => {
            const d = Math.abs(p.x - targetX);
            if (d < best) { best = d; nearest = i; }
        });

        this.hoverIndex = nearest;
        this.hoverLeftPercent = (this.chartPoints[nearest].x / this.width) * 100;
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
        const rawMin = Math.min(...this._points.map(p => p.count));
        const rawMax = Math.max(...this._points.map(p => p.count), 1);
        const { min: domainMin, max: domainMax } = this.niceScale(rawMin, rawMax);
        const domainSpan = Math.max(1, domainMax - domainMin);

        const plotWidth  = this.width - PAD.left - PAD.right;
        const plotHeight = HEIGHT - PAD.top  - PAD.bottom;

        const valueToY = (value: number) => PAD.top + plotHeight - ((value - domainMin) / domainSpan) * plotHeight;

        this.chartPoints = this._points.map((p, i) => {
            const t = dates[i].getTime();
            const x = this._points.length === 1
                ? PAD.left + plotWidth / 2
                : PAD.left + ((t - minT) / span) * plotWidth;
            return { x, y: valueToY(p.count), value: p.count, date: dates[i] };
        });

        this.linePath = this.chartPoints
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(' ');

        const baseline = valueToY(domainMin);
        const first = this.chartPoints[0];
        const last  = this.chartPoints[this.chartPoints.length - 1];
        this.areaPath = `${this.linePath} L ${last.x.toFixed(1)},${baseline.toFixed(1)} L ${first.x.toFixed(1)},${baseline.toFixed(1)} Z`;

        this.yTicks = [0, 0.5, 1].map(f => ({
            y: PAD.top + plotHeight - f * plotHeight,
            value: Math.round(domainMin + domainSpan * f)
        }));
    }

    /** "Nice numbers" axis scaling (Heckbert) - zooms to the data's own range instead of always anchoring at 0, so small fluctuations stay readable. */
    private niceScale(min: number, max: number): { min: number; max: number } {
        if (min === max) { min -= 1; max += 1; }
        const range     = this.niceNumber(max - min, false);
        const step      = this.niceNumber(range / 3, true);
        const niceMin   = Math.floor(min / step) * step;
        const niceMax   = Math.ceil(max / step) * step;
        return { min: Math.max(0, niceMin), max: niceMax };
    }

    private niceNumber(range: number, round: boolean): number {
        const exponent = Math.floor(Math.log10(range));
        const fraction  = range / Math.pow(10, exponent);
        let niceFraction: number;
        if (round) {
            niceFraction = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
        } else {
            niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
        }
        return niceFraction * Math.pow(10, exponent);
    }
}
