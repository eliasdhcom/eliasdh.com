/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PricingPlansService, PricingPlan } from '../../services/pricing-plans.service';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface PlanForm {
    name:         string;
    monthlyPrice: string;
}

@Component({
    selector:    'app-portal-pricing-plans',
    standalone:  true,
    imports:     [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './pricing-plans.component.html',
    styleUrls:   ['./pricing-plans.component.css']
})
export class PortalPricingPlansComponent implements OnInit, OnDestroy {
    plans:   PricingPlan[] = [];
    loading  = true;
    error    = '';

    showForm    = false;
    isEditing   = false;
    editingId   = 0;
    formSaving  = false;
    formError   = '';
    form: PlanForm = this.emptyForm();

    deleteConfirmId: number | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private pricingService: PricingPlansService,
        private authService: AuthService
    ) {}

    ngOnInit(): void { this.loadPlans(); }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get isAuthenticated(): boolean { return this.authService.isAuthenticated(); }

    loadPlans(): void {
        this.loading = true;
        this.error   = '';
        this.pricingService.getAll()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (r) => { this.plans = r.data ?? []; this.loading = false; },
                error: () => { this.error = 'Tariefplannen konden niet worden geladen.'; this.loading = false; }
            });
    }

    private emptyForm(): PlanForm { return { name: '', monthlyPrice: '0' }; }

    openCreateForm(): void {
        this.isEditing = false;
        this.editingId = 0;
        this.form      = this.emptyForm();
        this.formError = '';
        this.showForm  = true;
    }

    openEditForm(plan: PricingPlan): void {
        this.isEditing = true;
        this.editingId = plan.id;
        this.form      = { name: plan.name, monthlyPrice: String(plan.monthlyPrice) };
        this.formError = '';
        this.showForm  = true;
    }

    closeForm(): void { this.showForm = false; this.formError = ''; }

    submitForm(): void {
        if (!this.form.name.trim()) { this.formError = 'Naam is verplicht.'; return; }
        const price = Number(this.form.monthlyPrice);
        if (isNaN(price) || price < 0) { this.formError = 'Prijs moet een geldig getal zijn.'; return; }

        this.formSaving = true;
        this.formError  = '';

        const payload = { name: this.form.name.trim(), monthlyPrice: price };
        const req = this.isEditing
            ? this.pricingService.update(this.editingId, payload)
            : this.pricingService.create(payload);

        req.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => { this.formSaving = false; this.closeForm(); this.loadPlans(); },
            error: (err) => { this.formSaving = false; this.formError = err?.error?.error ?? 'Er is een fout opgetreden.'; }
        });
    }

    confirmDelete(id: number): void { this.deleteConfirmId = id; }
    cancelDelete(): void { this.deleteConfirmId = null; }

    executeDelete(): void {
        if (this.deleteConfirmId === null) return;
        const id = this.deleteConfirmId;
        this.deleteConfirmId = null;
        this.pricingService.delete(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: () => this.loadPlans(), error: () => {} });
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    onOverlayClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('pricing-modal-overlay')) this.closeForm();
    }

    onDeleteOverlayClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('pricing-modal-overlay')) this.cancelDelete();
    }
}