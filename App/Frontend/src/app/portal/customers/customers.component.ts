/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CustomersService, Customer, CustomerLocation, CustomerWebsite, CustomerDomain, SocialLink } from '../../services/customers.service';
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

interface DomainForm {
    name:        string;
    renewalDate: string;
    annualPrice: string;
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
    domains:   DomainForm[];
}

@Component({
    selector: 'app-portal-customers',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
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

    showForm    = false;
    isEditing   = false;
    editingId   = '';
    formSaving  = false;
    formError   = '';
    deleteConfirmId: string | null = null;
    form: CustomerForm = this.emptyForm();

    readonly subscriptionTypes  = ['Free', 'Basic', 'Growth', 'Startup', 'Business', 'Enterprise', 'Custom'];
    readonly frequencies        = ['monthly', 'quarterly', 'yearly', 'one-time'];
    readonly socialTypes        = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube', 'github'];
    readonly subscriptionPrices: Record<string, number> = {
        Free: 0, Basic: 20, Growth: 40, Startup: 80, Business: 160, Enterprise: 320, Custom: 0
    };

    geocodingLoading: boolean[] = [];

    @Output() navigateToSubscription = new EventEmitter<string>();

    constructor(
        private customersService: CustomersService,
        private authService: AuthService,
        private translate: TranslateService,
        private router: Router
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

    openInMap(loc: Customer['locations'][0], event: Event): void {
        event.stopPropagation();
        if (loc.latitude && loc.longitude) {
            this.router.navigate(['/map'], { queryParams: { lat: loc.latitude, lng: loc.longitude } });
        }
    }

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

    private emptyForm(): CustomerForm {
        return { name: '', firstName: '', lastName: '', email: '', phone: '', mobile: '', logo: '', locations: [], websites: [], domains: [] };
    }

    private emptyDomain(): DomainForm {
        return { name: '', renewalDate: '', annualPrice: '0' };
    }

    private emptyLocation(): LocationForm {
        return { street: '', number: '', postalCode: '', city: '', country: 'Belgium', vat: '', latitude: '', longitude: '', socialLinks: [] };
    }

    private emptyWebsite(): WebsiteForm {
        return { name: '', url: '', subscriptionType: 'Free', isLive: false, startDate: '', frequency: 'monthly', payment: String(this.subscriptionPrices['Free']), discount: '0' };
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
                frequency:        w.frequency,
                payment:          w.subscriptionType !== 'Custom' && w.subscriptionType in this.subscriptionPrices
                                    ? String(this.subscriptionPrices[w.subscriptionType])
                                    : String(w.payment),
                discount:         String(w.discount),
                startDate:        w.startDate ? w.startDate.slice(0, 7) : ''
            })),
            domains: (customer.domains ?? []).map(d => ({
                name:        d.name,
                renewalDate: d.renewalDate ? d.renewalDate.slice(0, 7) : '',
                annualPrice: String(d.annualPrice)
            }))
        };
        this.showForm = true;
    }

    closeForm(): void {
        this.showForm  = false;
        this.formError = '';
    }

    submitForm(): void {
        if (!this.form.name.trim())      { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_NAME');      return; }
        if (!this.form.logo)             { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOGO');      return; }
        if (!this.form.firstName.trim()) { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_FIRSTNAME'); return; }
        if (!this.form.lastName.trim())  { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LASTNAME');  return; }
        if (!this.form.email.trim())     { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_EMAIL');     return; }
        if (!this.form.phone.trim())     { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_PHONE');     return; }
        if (!this.form.mobile.trim())    { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_MOBILE');    return; }
        if (!this.form.locations.length) { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOCATIONS'); return; }

        for (let i = 0; i < this.form.locations.length; i++) {
            const loc = this.form.locations[i];
            const n   = i + 1;
            if (!loc.street.trim())     { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOC_STREET',     { n }); return; }
            if (!loc.number.trim())     { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOC_NUMBER',     { n }); return; }
            if (!loc.postalCode.trim()) { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOC_POSTAL',     { n }); return; }
            if (!loc.city.trim())       { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOC_CITY',       { n }); return; }
            if (!loc.country.trim())    { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOC_COUNTRY',    { n }); return; }
        }

        for (let i = 0; i < this.form.websites.length; i++) {
            const w = this.form.websites[i];
            const n = i + 1;
            if (!w.name.trim())  { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_SUB_NAME',  { n }); return; }
            if (!w.url.trim())   { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_SUB_URL',   { n }); return; }
            if (!w.startDate)    { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_SUB_START', { n }); return; }
        }

        for (let i = 0; i < this.form.domains.length; i++) {
            const d = this.form.domains[i];
            const n = i + 1;
            if (!d.name.trim())    { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_DOM_NAME',    { n }); return; }
            if (!d.renewalDate)    { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_DOM_RENEWAL', { n }); return; }
        }

        this.formSaving = true;
        this.formError  = '';

        const payload: Partial<Customer> = {
            name:      this.form.name.trim(),
            firstName: this.form.firstName.trim(),
            lastName:  this.form.lastName.trim(),
            email:     this.form.email.trim(),
            phone:     this.form.phone.trim(),
            mobile:    this.form.mobile.trim(),
            logo:      this.form.logo,
            locations: this.form.locations.map(l => ({
                street:     l.street.trim(),
                number:     l.number.trim(),
                postalCode: l.postalCode.trim(),
                city:       l.city.trim(),
                country:    l.country.trim(),
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
                startDate:        w.startDate ? `${w.startDate}-01` : undefined,
                frequency:        w.frequency as any,
                payment:          Number(w.payment) || 0,
                discount:         Number(w.discount) || 0,
                subtotal: 0, vat: 0, total: 0, id: ''
            }) as CustomerWebsite),
            domains: this.form.domains.map(d => ({
                name:        d.name.trim(),
                renewalDate: d.renewalDate ? `${d.renewalDate}-01` : '',
                annualPrice: Number(d.annualPrice) || 0,
                discount:    0,
                autoRenew:   true
            }) as CustomerDomain)
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

    addLocation(): void    { this.form.locations.push(this.emptyLocation()); }
    removeLocation(i: number): void { this.form.locations.splice(i, 1); }
    addSocialLink(loc: LocationForm): void    { loc.socialLinks.push({ type: 'facebook', url: '' }); }
    removeSocialLink(loc: LocationForm, i: number): void { loc.socialLinks.splice(i, 1); }

    addWebsite(): void    { this.form.websites.push(this.emptyWebsite()); }
    removeWebsite(i: number): void { this.form.websites.splice(i, 1); }

    addDomain(): void    { this.form.domains.push(this.emptyDomain()); }
    removeDomain(i: number): void { this.form.domains.splice(i, 1); }

    getNextDomainRenewal(startDateStr: string): string {
        if (!startDateStr) return '—';
        const start = new Date(startDateStr);
        if (isNaN(start.getTime())) return '—';
        const now = new Date();
        let next = new Date(start.getFullYear(), start.getMonth(), 1);
        while (next <= now) next = new Date(next.getFullYear() + 1, next.getMonth(), 1);
        return next.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    onOverlayClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('customers-modal-overlay')) this.closeForm();
    }

    onDeleteOverlayClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('customers-modal-overlay')) this.cancelDelete();
    }

    onLogoFileChange(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { this.form.logo = reader.result as string; };
        reader.readAsDataURL(file);
    }

    onSubscriptionTypeChange(w: WebsiteForm): void {
        if (w.subscriptionType !== 'Custom') {
            w.payment = String(this.subscriptionPrices[w.subscriptionType] ?? 0);
            const price = Number(w.payment);
            if (Number(w.discount) > price) w.discount = String(price);
        }
    }

    onDiscountChange(w: WebsiteForm): void {
        const price    = Number(w.payment)   || 0;
        const discount = Number(w.discount)  || 0;
        if (discount > price) w.discount = String(price);
        if (discount < 0)     w.discount = '0';
    }

    onAddressBlur(loc: LocationForm, index: number): void {
        if (!loc.street.trim() || !loc.city.trim()) return;
        if (this.geocodingLoading[index]) return;
        this.geocodingLoading[index] = true;
        const parts = [loc.street, loc.number, loc.postalCode, loc.city, loc.country].filter(s => s.trim());
        const query = parts.join(' ');
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
            .then(r => r.json())
            .then((data: any[]) => {
                if (data?.length) {
                    loc.latitude  = data[0].lat;
                    loc.longitude = data[0].lon;
                }
            })
            .catch(() => {})
            .finally(() => { this.geocodingLoading[index] = false; });
    }
}