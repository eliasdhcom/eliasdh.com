/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService, Customer, CustomerLocation, CustomerWebsite, SocialLink } from '../../services/customers.service';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface SocialLinkForm {
    type: string;
    url:  string;
}

interface LocationForm {
    street:      string;
    number:      string;
    postalCode:  string;
    city:        string;
    country:     string;
    vat:         string;
    latitude:    string;
    longitude:   string;
    socialLinks: SocialLinkForm[];
}

interface WebsiteForm {
    name:             string;
    url:              string;
    subscriptionType: string;
    isLive:           boolean;
    startDate:        string;
    frequency:        string;
    payment:          string;
    discount:         string;
}

interface CustomerForm {
    name:      string;
    firstName: string;
    lastName:  string;
    email:     string;
    phone:     string;
    mobile:    string;
    logo:      string;
    locations: LocationForm[];
    websites:  WebsiteForm[];
}

@Component({
    selector: 'app-portal-customers',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './customers.component.html',
    styleUrls: ['./customers.component.css']
})
export class PortalCustomersComponent implements OnInit, OnDestroy {
    customers: Customer[] = [];
    loading   = true;
    error     = '';
    searchQuery    = '';
    expandedId: string | null = null;
    failedLogos    = new Set<string>();
    encodeURIComponent = encodeURIComponent;
    private destroy$ = new Subject<void>();

    // Form state
    showForm    = false;
    isEditing   = false;
    editingId   = '';
    formSaving  = false;
    formError   = '';
    deleteConfirmId: string | null = null;
    form: CustomerForm = this.emptyForm();

    readonly subscriptionTypes = ['Free', 'Basic', 'Growth', 'Startup', 'Business', 'Enterprise', 'ToDo'];
    readonly frequencies       = ['monthly', 'quarterly', 'yearly', 'one-time'];
    readonly socialTypes       = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube', 'github'];

    @Output() navigateToSubscription = new EventEmitter<string>();

    constructor(
        private customersService: CustomersService,
        private authService: AuthService
    ) {}

    ngOnInit(): void { this.loadCustomers(); }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get isAuthenticated(): boolean { return this.authService.isAuthenticated(); }

    loadCustomers(): void {
        this.loading = true;
        this.error   = '';
        this.customersService.getAllCustomers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.customers = (response.data ?? []).filter(c => !c.isHQ);
                    this.loading   = false;
                },
                error: () => {
                    this.error   = 'Klanten konden niet worden geladen.';
                    this.loading = false;
                }
            });
    }

    get filteredCustomers(): Customer[] {
        if (!this.searchQuery.trim()) return this.customers;
        const q = this.searchQuery.toLowerCase();
        return this.customers.filter(c => {
            if (c.id.toLowerCase().includes(q)) return true;
            if (c.name.toLowerCase().includes(q)) return true;
            if (c.locations.some(loc => loc.vat?.toLowerCase().includes(q))) return true;
            if (`${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase().includes(q)) return true;
            return c.locations?.some(loc =>
                `${loc.street} ${loc.number} ${loc.city} ${loc.postalCode}`.toLowerCase().includes(q)
            ) ?? false;
        });
    }

    onSubscriptionItemClick(websiteId: string): void { this.navigateToSubscription.emit(websiteId); }
    onSearch(event: Event): void { this.searchQuery = (event.target as HTMLInputElement).value; }
    toggleExpand(id: string): void { this.expandedId = this.expandedId === id ? null : id; }
    handleLogoError(id: string): void { this.failedLogos.add(id); }
    showLogo(customer: Customer): boolean { return !!customer.logo && !this.failedLogos.has(customer.id); }
    getInitials(name: string): string { return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2); }
    formatAddress(loc: Customer['locations'][0]): string { return `${loc.street} ${loc.number}, ${loc.postalCode} ${loc.city}`; }

    getSubscriptionClass(type: string): string {
        const t = type.toLowerCase();
        if (t.includes('enterprise')) return 'customers-badge--enterprise';
        if (t.includes('business'))   return 'customers-badge--business';
        if (t.includes('startup'))    return 'customers-badge--startup';
        if (t.includes('growth'))     return 'customers-badge--growth';
        if (t.includes('basic'))      return 'customers-badge--basic';
        if (t.includes('free'))       return 'customers-badge--free';
        if (t.includes('todo'))       return 'customers-badge--todo';
        return 'customers-badge--custom';
    }

    getVisibleBadges(customer: Customer) { return customer.websites?.slice(0, 3) ?? []; }
    getExtraBadgeCount(customer: Customer): number { return Math.max(0, (customer.websites?.length ?? 0) - 3); }
    hasContactInfo(customer: Customer): boolean {
        return !!(customer.firstName || customer.lastName || customer.email || customer.phone || customer.mobile);
    }

    // ── Form helpers ──────────────────────────────────────────────────────────

    private emptyForm(): CustomerForm {
        return { name: '', firstName: '', lastName: '', email: '', phone: '', mobile: '', logo: '', locations: [], websites: [] };
    }

    private emptyLocation(): LocationForm {
        return { street: '', number: '', postalCode: '', city: '', country: 'Belgium', vat: '', latitude: '', longitude: '', socialLinks: [] };
    }

    private emptyWebsite(): WebsiteForm {
        return { name: '', url: '', subscriptionType: 'Free', isLive: false, startDate: '', frequency: 'monthly', payment: '0', discount: '0' };
    }

    openCreateForm(): void {
        this.isEditing  = false;
        this.editingId  = '';
        this.form       = this.emptyForm();
        this.formError  = '';
        this.showForm   = true;
    }

    openEditForm(customer: Customer, event: Event): void {
        event.stopPropagation();
        this.isEditing  = true;
        this.editingId  = customer.id;
        this.formError  = '';
        this.form = {
            name:      customer.name,
            firstName: customer.firstName ?? '',
            lastName:  customer.lastName  ?? '',
            email:     customer.email     ?? '',
            phone:     customer.phone     ?? '',
            mobile:    customer.mobile    ?? '',
            logo:      customer.logo      ?? '',
            locations: customer.locations.map(l => ({
                street:     l.street,
                number:     l.number,
                postalCode: l.postalCode,
                city:       l.city,
                country:    l.country,
                vat:        l.vat ?? '',
                latitude:   l.latitude  != null ? String(l.latitude)  : '',
                longitude:  l.longitude != null ? String(l.longitude) : '',
                socialLinks: (l.socialLinks ?? []).map(s => ({ type: s.type, url: s.url }))
            })),
            websites: customer.websites.map(w => ({
                name:             w.name,
                url:              w.url,
                subscriptionType: w.subscriptionType,
                isLive:           w.isLive,
                startDate:        w.startDate ?? '',
                frequency:        w.frequency,
                payment:          String(w.payment),
                discount:         String(w.discount)
            }))
        };
        this.showForm = true;
    }

    closeForm(): void {
        this.showForm  = false;
        this.formError = '';
    }

    submitForm(): void {
        if (!this.form.name.trim()) { this.formError = 'Bedrijfsnaam is verplicht.'; return; }
        this.formSaving = true;
        this.formError  = '';

        const payload: Partial<Customer> = {
            name:      this.form.name.trim(),
            firstName: this.form.firstName.trim() || undefined,
            lastName:  this.form.lastName.trim()  || undefined,
            email:     this.form.email.trim()     || undefined,
            phone:     this.form.phone.trim()     || undefined,
            mobile:    this.form.mobile.trim()    || undefined,
            logo:      this.form.logo.trim()      || undefined,
            locations: this.form.locations.map(l => ({
                street:     l.street.trim(),
                number:     l.number.trim(),
                postalCode: l.postalCode.trim(),
                city:       l.city.trim(),
                country:    l.country.trim() || 'Belgium',
                vat:        l.vat.trim() || undefined,
                latitude:   l.latitude  ? Number(l.latitude)  : 0,
                longitude:  l.longitude ? Number(l.longitude) : 0,
                socialLinks: l.socialLinks.filter(s => s.url.trim()) as SocialLink[]
            }) as CustomerLocation),
            websites: this.form.websites.map(w => ({
                name:             w.name.trim(),
                url:              w.url.trim(),
                subscriptionType: w.subscriptionType,
                isLive:           w.isLive,
                startDate:        w.startDate || undefined,
                frequency:        w.frequency as any,
                payment:          Number(w.payment) || 0,
                discount:         Number(w.discount) || 0,
                subtotal: 0, vat: 0, total: 0, id: ''
            }) as CustomerWebsite)
        };

        const req = this.isEditing
            ? this.customersService.updateCustomer(this.editingId, payload)
            : this.customersService.createCustomer(payload);

        req.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.formSaving = false;
                this.closeForm();
                this.loadCustomers();
            },
            error: (err) => {
                this.formSaving = false;
                this.formError  = err?.error?.error ?? 'Er is een fout opgetreden.';
            }
        });
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    confirmDelete(id: string, event: Event): void {
        event.stopPropagation();
        this.deleteConfirmId = id;
    }

    cancelDelete(): void { this.deleteConfirmId = null; }

    executeDelete(): void {
        if (!this.deleteConfirmId) return;
        const id = this.deleteConfirmId;
        this.deleteConfirmId = null;
        this.customersService.deleteCustomer(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    if (this.expandedId === id) this.expandedId = null;
                    this.loadCustomers();
                },
                error: () => {}
            });
    }

    // ── Location helpers ──────────────────────────────────────────────────────

    addLocation(): void    { this.form.locations.push(this.emptyLocation()); }
    removeLocation(i: number): void { this.form.locations.splice(i, 1); }
    addSocialLink(loc: LocationForm): void    { loc.socialLinks.push({ type: 'facebook', url: '' }); }
    removeSocialLink(loc: LocationForm, i: number): void { loc.socialLinks.splice(i, 1); }

    // ── Website helpers ───────────────────────────────────────────────────────

    addWebsite(): void    { this.form.websites.push(this.emptyWebsite()); }
    removeWebsite(i: number): void { this.form.websites.splice(i, 1); }

    // ── Misc ──────────────────────────────────────────────────────────────────

    onOverlayClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('customers-modal-overlay')) this.closeForm();
    }

    onDeleteOverlayClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('customers-modal-overlay')) this.cancelDelete();
    }
}
