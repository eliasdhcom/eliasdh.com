/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CustomersService, Customer, CustomerLocation, CustomerWebsite, CustomerDomain, SocialLink } from '../../services/customers.service';
import { PricingPlansService, PricingPlan } from '../../services/pricing-plans.service';
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
    id:               string;
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
    name:           string;
    firstName:      string;
    lastName:       string;
    email:          string;
    phone:          string;
    mobile:         string;
    logo:           string;
    showOnHomePage:  boolean;
    locations:      LocationForm[];
    websites:       WebsiteForm[];
    domains:        DomainForm[];
}

@Component({
    selector: 'app-portal-customers',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe, DatePipe],
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

    showForm           = false;
    isEditing          = false;
    editingId          = '';
    formSaving         = false;
    formError          = '';
    formTouched        = false;
    showDiscardConfirm = false;
    overlayMousedownIsBackdrop = false;
    deleteConfirmId: string | null = null;
    form: CustomerForm = this.emptyForm();

    subscriptionTypes: string[]            = ['Free', 'Basic', 'Growth', 'Startup', 'Business', 'Enterprise', 'Custom'];
    readonly frequencies                   = ['monthly', 'quarterly', 'yearly', 'one-time'];
    readonly socialTypes                   = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube', 'github'];
    subscriptionPrices: Record<string, number> = { Free: 0, Custom: 0 };
    private pricingPlans: PricingPlan[]    = [];

    geocodingLoading: boolean[] = [];

    // ── Agreement modal state ─────────────────────────────────────────────────
    agreementCustomer     : Customer | null = null;
    agreementSigning       = false;
    agreementError         = '';
    agreementSuccess       = false;
    agreementShowDiscard   = false;
    sigHasContent          = false;
    private agreementPdf   : string | null = null;
    agreementLang     = 'nl';
    readonly agreementLangs = [
        { code: 'nl', label: 'NL' },
        { code: 'en', label: 'EN' },
        { code: 'de', label: 'DE' },
        { code: 'fr', label: 'FR' },
        { code: 'es', label: 'ES' }
    ];
    private prevLang   = 'nl';
    private sigDrawing = false;
    private sigLastX   = 0;
    private sigLastY   = 0;
    private sigCanvas: HTMLCanvasElement | null = null;
    private readonly boundPreventScroll = (e: Event) => e.preventDefault();

    @Output() navigateToSubscription = new EventEmitter<string>();

    constructor(
        private customersService: CustomersService,
        private pricingPlansService: PricingPlansService,
        private authService: AuthService,
        private translate: TranslateService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadCustomers();
        this.pricingPlansService.getAll()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (r) => {
                this.pricingPlans = r.data ?? [];
                this.pricingPlansService.setPlanColors(this.pricingPlans);
                const prices: Record<string, number> = { Custom: 0 };
                const types: string[] = [];
                for (const p of this.pricingPlans) { prices[p.name] = p.monthlyPrice; types.push(p.name); }
                this.subscriptionPrices = prices;
                this.subscriptionTypes  = [...types, 'Custom'];
                if (this.customers.length) this.customers = [...this.customers];
            }});
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get isAuthenticated(): boolean { return this.authService.isAuthenticated(); }

    get todayLabel(): string {
        return new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: 'long', year: 'numeric' });
    }

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
                    this.error   = this.translate.instant('PORTAL.CUSTOMERS.LOAD_ERROR');
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

    openInMap(customer: Customer, loc: Customer['locations'][0], event: Event): void {
        event.stopPropagation();
        if (loc.latitude && loc.longitude) {
            const url = this.router.serializeUrl(
                this.router.createUrlTree(['/map'], { queryParams: { lat: loc.latitude, lng: loc.longitude, customerId: customer.id } })
            );
            window.open(url, '_blank');
        }
    }

    getBadgeStyle(type: string) { return this.pricingPlansService.getBadgeStyle(type); }

    getVisibleBadges(customer: Customer) { return customer.websites?.slice(0, 3) ?? []; }
    getExtraBadgeCount(customer: Customer): number { return Math.max(0, (customer.websites?.length ?? 0) - 3); }
    hasContactInfo(customer: Customer): boolean {
        return !!(customer.firstName || customer.lastName || customer.email || customer.phone || customer.mobile);
    }

    private emptyForm(): CustomerForm {
        return { name: '', firstName: '', lastName: '', email: '', phone: '', mobile: '', logo: '', showOnHomePage: true, locations: [], websites: [], domains: [] };
    }

    private emptyDomain(): DomainForm {
        return { name: '', renewalDate: '', annualPrice: '0' };
    }

    private emptyLocation(): LocationForm {
        return { street: '', number: '', postalCode: '', city: '', country: 'Belgium', vat: '', latitude: '', longitude: '', socialLinks: [] };
    }

    private emptyWebsite(): WebsiteForm {
        return { id: '', name: '', url: '', subscriptionType: 'Free', isLive: false, startDate: '', frequency: 'monthly', payment: String(this.subscriptionPrices['Free']), discount: '0' };
    }

    markTouched(): void { this.formTouched = true; }

    openCreateForm(): void {
        this.isEditing          = false;
        this.editingId          = '';
        this.form               = this.emptyForm();
        this.formError          = '';
        this.formTouched        = false;
        this.showDiscardConfirm = false;
        this.showForm           = true;
    }

    openEditForm(customer: Customer, event: Event): void {
        event.stopPropagation();
        this.isEditing          = true;
        this.editingId          = customer.id;
        this.formError          = '';
        this.formTouched        = false;
        this.showDiscardConfirm = false;
        this.form = {
            name:          customer.name,
            firstName:     customer.firstName ?? '',
            lastName:      customer.lastName  ?? '',
            email:         customer.email     ?? '',
            phone:         customer.phone     ?? '',
            mobile:        customer.mobile    ?? '',
            logo:          customer.logo      ?? '',
            showOnHomePage: customer.showOnHomePage !== false,
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
                id:               w.id,
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

    requestClose(): void {
        if (this.formTouched) { this.showDiscardConfirm = true; return; }
        this.closeForm();
    }

    confirmDiscard(): void {
        this.showDiscardConfirm = false;
        this.closeForm();
    }

    cancelDiscard(): void {
        this.showDiscardConfirm = false;
    }

    closeForm(): void {
        this.showForm           = false;
        this.formError          = '';
        this.formTouched        = false;
        this.showDiscardConfirm = false;
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
            name:          this.form.name.trim(),
            firstName:     this.form.firstName.trim(),
            lastName:      this.form.lastName.trim(),
            email:         this.form.email.trim(),
            phone:         this.form.phone.trim(),
            mobile:        this.form.mobile.trim(),
            logo:          this.form.logo,
            showOnHomePage: this.form.showOnHomePage,
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
                id:               w.id || '',
                name:             w.name.trim(),
                url:              w.url.trim(),
                subscriptionType: w.subscriptionType,
                isLive:           w.isLive,
                startDate:        w.startDate ? `${w.startDate}-01` : undefined,
                frequency:        w.frequency as any,
                payment:          Number(w.payment) || 0,
                discount:         Number(w.discount) || 0,
                subtotal: 0, vat: 0, total: 0
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

    onOverlayMousedown(event: MouseEvent): void {
        this.overlayMousedownIsBackdrop = event.target === event.currentTarget;
    }

    onOverlayClick(event: MouseEvent): void {
        if (this.overlayMousedownIsBackdrop && event.target === event.currentTarget) this.requestClose();
        this.overlayMousedownIsBackdrop = false;
    }

    onDeleteOverlayClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) this.cancelDelete();
    }

    onLogoFileChange(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const MAX = 256;
                let w = img.width, h = img.height;
                if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
                else       { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                this.form.logo = canvas.toDataURL('image/webp', 0.85);
            };
            img.src = reader.result as string;
        };
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

    openAgreementModal(customer: Customer, event: Event): void {
        event.stopPropagation();
        this.prevLang            = localStorage.getItem('language') ?? 'nl';
        this.agreementLang       = this.prevLang;
        this.agreementCustomer   = customer;
        this.agreementSigning    = false;
        this.agreementError      = '';
        this.agreementSuccess    = false;
        this.agreementShowDiscard = false;
        this.sigHasContent       = false;
        this.sigCanvas           = null;
        setTimeout(() => this.initCanvas(), 60);
    }

    requestCloseAgreement(): void {
        if (this.agreementSigning) return;
        if (this.sigHasContent && !this.agreementSuccess) {
            this.agreementShowDiscard = true;
            return;
        }
        this.closeAgreementModal();
    }

    confirmDiscardAgreement(): void {
        this.agreementShowDiscard = false;
        this.closeAgreementModal();
    }

    cancelDiscardAgreement(): void {
        this.agreementShowDiscard = false;
    }

    closeAgreementModal(): void {
        this.destroyCanvas();
        this.translate.use(this.prevLang);
        this.agreementCustomer    = null;
        this.agreementError       = '';
        this.agreementSuccess     = false;
        this.agreementShowDiscard = false;
        this.agreementPdf         = null;
    }

    downloadAgreementPdf(): void {
        if (!this.agreementPdf || !this.agreementCustomer) return;
        const name     = this.agreementCustomer.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `customer_agreement-EliasDH-${name}.pdf`;
        const bytes    = atob(this.agreementPdf);
        const arr      = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: 'application/pdf' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    async downloadSignedCustomerAgreement(customer: Customer, event: Event): Promise<void> {
        event.stopPropagation();
        if (!customer.agreementSignedAt) return;
        try {
            const name      = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
            const filename  = `customer_agreement-EliasDH-${name}.pdf`;
            const signingDate = new Date(customer.agreementSignedAt);
            const pdfBase64 = await this.buildAgreementPdf(customer, customer.agreementSignature ?? '', signingDate);
            const bytes     = atob(pdfBase64);
            const arr       = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
            const blob = new Blob([arr], { type: 'application/pdf' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Failed to download agreement:', e);
        }
    }

    setAgreementLang(code: string): void {
        this.agreementLang = code;
        this.translate.use(code);
    }

    private initCanvas(): void {
        const el = document.getElementById('customers-agr-sig-canvas') as HTMLCanvasElement | null;
        if (!el) return;
        this.sigCanvas = el;
        const ctx = el.getContext('2d')!;
        ctx.strokeStyle = '#4f94f0';
        ctx.lineWidth   = 2.5;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';

        el.addEventListener('mousedown',  this.onSigDown.bind(this));
        el.addEventListener('mousemove',  this.onSigMove.bind(this));
        el.addEventListener('mouseup',    this.onSigUp.bind(this));
        el.addEventListener('mouseleave', this.onSigUp.bind(this));
        el.addEventListener('touchstart', this.onSigTouchStart.bind(this), { passive: false });
        el.addEventListener('touchmove',  this.onSigTouchMove.bind(this),  { passive: false });
        el.addEventListener('touchend',   this.onSigUp.bind(this));
    }

    private destroyCanvas(): void {
        if (!this.sigCanvas) return;
        const el = this.sigCanvas;
        el.removeEventListener('mousedown',  this.onSigDown.bind(this));
        el.removeEventListener('mousemove',  this.onSigMove.bind(this));
        el.removeEventListener('mouseup',    this.onSigUp.bind(this));
        el.removeEventListener('mouseleave', this.onSigUp.bind(this));
        el.removeEventListener('touchstart', this.onSigTouchStart.bind(this));
        el.removeEventListener('touchmove',  this.onSigTouchMove.bind(this));
        el.removeEventListener('touchend',   this.onSigUp.bind(this));
        this.sigCanvas = null;
    }

    private canvasPos(el: HTMLCanvasElement, clientX: number, clientY: number): [number, number] {
        const r      = el.getBoundingClientRect();
        const scaleX = el.width  / r.width;
        const scaleY = el.height / r.height;
        return [(clientX - r.left) * scaleX, (clientY - r.top) * scaleY];
    }

    private lockScroll(): void {
        document.addEventListener('touchmove', this.boundPreventScroll, { passive: false });
    }
    private unlockScroll(): void {
        document.removeEventListener('touchmove', this.boundPreventScroll);
    }

    private onSigDown(e: MouseEvent): void {
        this.sigDrawing = true;
        this.lockScroll();
        [this.sigLastX, this.sigLastY] = this.canvasPos(this.sigCanvas!, e.clientX, e.clientY);
    }
    private onSigMove(e: MouseEvent): void {
        if (!this.sigDrawing || !this.sigCanvas) return;
        const [x, y] = this.canvasPos(this.sigCanvas, e.clientX, e.clientY);
        this.drawSigLine(x, y);
    }
    private onSigUp(): void {
        this.sigDrawing = false;
        this.unlockScroll();
    }

    private onSigTouchStart(e: TouchEvent): void {
        if (e.cancelable) e.preventDefault();
        if (!this.sigCanvas || !e.touches[0]) return;
        this.sigDrawing = true;
        this.lockScroll();
        [this.sigLastX, this.sigLastY] = this.canvasPos(this.sigCanvas, e.touches[0].clientX, e.touches[0].clientY);
    }
    private onSigTouchMove(e: TouchEvent): void {
        e.preventDefault();
        if (!this.sigDrawing || !this.sigCanvas || !e.touches[0]) return;
        const [x, y] = this.canvasPos(this.sigCanvas, e.touches[0].clientX, e.touches[0].clientY);
        this.drawSigLine(x, y);
    }

    private drawSigLine(x: number, y: number): void {
        const ctx = this.sigCanvas!.getContext('2d')!;
        ctx.beginPath();
        ctx.moveTo(this.sigLastX, this.sigLastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        this.sigLastX    = x;
        this.sigLastY    = y;
        this.sigHasContent = true;
    }

    clearSignature(): void {
        if (!this.sigCanvas) return;
        const ctx = this.sigCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, this.sigCanvas.width, this.sigCanvas.height);
        this.sigHasContent = false;
    }

    async submitAgreement(): Promise<void> {
        if (!this.agreementCustomer || !this.sigHasContent || this.agreementSigning) return;
        this.agreementSigning = true;
        this.agreementError   = '';
        try {
            const signatureDataUrl = this.sigCanvas!.toDataURL('image/jpeg', 0.85);
            const pdfBase64 = await this.buildAgreementPdf(this.agreementCustomer, signatureDataUrl);
            this.agreementPdf = pdfBase64;
            this.customersService.signAgreement(this.agreementCustomer.id, signatureDataUrl)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (r) => {
                        const idx = this.customers.findIndex(c => c.id === this.agreementCustomer!.id);
                        if (idx !== -1) this.customers[idx] = { ...this.customers[idx], agreementSignedAt: r.signedAt, agreementSignature: signatureDataUrl };
                        this.agreementSigning = false;
                        this.agreementSuccess = true;
                    },
                    error: () => {
                        this.agreementError   = this.translate.instant('PORTAL.CUSTOMERS.AGREEMENT.ERR_FAILED');
                        this.agreementSigning = false;
                    }
                });
        } catch {
            this.agreementError   = this.translate.instant('PORTAL.CUSTOMERS.AGREEMENT.ERR_PDF');
            this.agreementSigning = false;
        }
    }

    private async buildAgreementPdf(c: Customer, signatureDataUrl: string, dateOverride?: Date): Promise<string> {
        let enTr: any = {};
        try {
            const resp = await fetch('assets/i18n/en.json');
            if (resp.ok) enTr = await resp.json();
        } catch { }
        const t = (key: string, params?: Record<string, string>): string => {
            let val: any = enTr;
            for (const seg of ['PORTAL', 'CUSTOMERS', 'AGREEMENT', key]) val = val?.[seg];
            if (typeof val !== 'string') return key;
            if (params) return Object.entries(params).reduce((s, [k, v]) => s.replace(new RegExp(`{{${k}}}`, 'g'), v), val);
            return val;
        };

        const { jsPDF } = await import('jspdf');
        const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W       = 210;
        const M       = 15;
        const CW      = W - M * 2;
        const P: [number, number, number] = [79, 148, 240];
        const fd      = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const today   = fd(dateOverride ?? new Date());
        const contact = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();

        let logoBase64: string | null = null;
        try {
            const resp = await fetch('assets/media/images/logo.png');
            const blob = await resp.blob();
            logoBase64 = await new Promise<string>((res, rej) => {
                const r = new FileReader(); r.onloadend = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(blob);
            });
        } catch { }

        let y = 42;
        const newPageIfNeeded = (mm: number): void => { if (y + mm > 280) { doc.addPage(); y = M; } };

        const addPara = (text: string): void => {
            const lines = doc.splitTextToSize(text, CW);
            newPageIfNeeded(lines.length * 4 + 3);
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 55, 55);
            doc.text(lines, M, y);
            y += lines.length * 3.8 + 2;
        };

        const addSection = (titleKey: string, paraKeys: string[]): void => {
            newPageIfNeeded(10 + paraKeys.length * 12);
            doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(79, 148, 240);
            doc.text(t(titleKey), M, y); y += 5;
            paraKeys.forEach(k => addPara(t(k)));
            y += 3;
        };

        const drawSubsTable = (): void => {
            const subs = (c.websites ?? []).filter(w => !!w.name);
            if (!subs.length) return;
            newPageIfNeeded(10 + subs.length * 12);
            doc.setFillColor(241, 243, 248);
            doc.rect(M, y, CW, 7, 'F');
            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(70, 70, 70);
            doc.text(t('SUBS_APP').toUpperCase(),   M + 2,     y + 4.8);
            doc.text(t('SUBS_TYPE').toUpperCase(),  M + 75,    y + 4.8);
            doc.text(t('SUBS_FREQ').toUpperCase(),  M + 110,   y + 4.8);
            doc.text(t('SUBS_PRICE').toUpperCase(), W - M - 2, y + 4.8, { align: 'right' });
            y += 7;
            for (const w of subs) {
                doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
                doc.text(w.name, M + 2, y + 4);
                doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
                doc.text(w.url, M + 2, y + 7.5);
                doc.setFontSize(8); doc.setTextColor(20, 20, 20);
                doc.text(w.subscriptionType, M + 75, y + 4);
                doc.text(t('FREQ_' + w.frequency.toUpperCase()), M + 110, y + 4);
                doc.setFont('helvetica', 'bold');
                doc.text(`€${w.payment.toFixed(2)}`, W - M - 2, y + 4, { align: 'right' });
                y += 11;
            }
            doc.setDrawColor(210, 210, 210); doc.line(M, y, W - M, y); y += 4;
        };

        doc.setFillColor(...P); doc.rect(0, 0, W, 32, 'F');
        const logoSize = 16;
        if (logoBase64) doc.addImage(logoBase64, 'PNG', M, 8, logoSize, logoSize);
        const tX = logoBase64 ? M + logoSize + 4 : M;
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.text('EliasDH', tX, 17);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.text('eliasdh.com', tX, 23);
        doc.setFontSize(17); doc.setFont('helvetica', 'bold'); doc.text(t('TITLE').toUpperCase(), W - M, 18, { align: 'right' });

        const col2X = M + CW / 2 + 8;
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130);
        doc.text(t('FROM'), M, y); doc.text(t('CLIENT_LABEL'), col2X, y); y += 5;
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
        doc.text('EliasDH BV', M, y); doc.text(c.name, col2X, y); y += 5;
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 70);
        doc.text('info@eliasdh.com  ·  eliasdh.com', M, y);
        if (contact) doc.text(contact, col2X, y); y += 4;
        doc.text('VAT: BE1034925266', M, y);
        if (c.vat) doc.text(`VAT: ${c.vat}`, col2X, y); y += 4;
        doc.text(`Date: ${today}`, M, y);

        y = 80;
        doc.setDrawColor(210, 210, 210); doc.line(M, y, W - M, y); y += 6;
        const introText = `${t('INTRO_BEFORE')} ${today}${t('INTRO_BETWEEN')} ${c.name}${c.vat ? `${t('INTRO_VAT')} ${c.vat}` : ''}${t('INTRO_AFTER')}`;
        const introLines = doc.splitTextToSize(introText, CW);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 55, 55);
        doc.text(introLines, M, y); y += introLines.length * 3.8 + 6;

        addSection('ART1_TITLE', ['ART1_P1', 'ART1_P2']);

        newPageIfNeeded(14);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(79, 148, 240);
        doc.text(t('ART2_TITLE'), M, y); y += 5;
        addPara(t('ART2_P1'));
        drawSubsTable();
        ['ART2_P2', 'ART2_P3', 'ART2_P4'].forEach(k => addPara(t(k)));
        y += 3;

        addSection('ART3_TITLE',  ['ART3_P1', 'ART3_P2']);
        addSection('ART4_TITLE',  ['ART4_P1', 'ART4_P2', 'ART4_P3', 'ART4_P4']);
        addSection('ART5_TITLE',  ['ART5_P1', 'ART5_P2']);
        addSection('ART6_TITLE',  ['ART6_P1', 'ART6_P2']);
        addSection('ART7_TITLE',  ['ART7_P1']);
        addSection('ART8_TITLE',  ['ART8_P1', 'ART8_P2']);
        addSection('ART9_TITLE',  ['ART9_P1']);
        newPageIfNeeded(14);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(79, 148, 240);
        doc.text(t('ART10_TITLE'), M, y); y += 5;
        ['ART10_P1', 'ART10_P2', 'ART10_P3'].forEach(k => addPara(t(k)));
        addPara(`${t('ART10_CONTACT')} info@eliasdh.com`);
        y += 3;

        newPageIfNeeded(40);
        doc.setDrawColor(210, 210, 210); doc.line(M, y, W - M, y); y += 6;
        const declLines = doc.splitTextToSize(t('DECLARATION', { client: c.name }), CW);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
        doc.text(declLines, M, y); y += declLines.length * 3.8 + 6;

        const sigColW = CW / 2 - 5;
        const sigX = M + sigColW + 10;
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130);
        doc.text('NAME & TITLE', M, y); doc.text('SIGNATURE', sigX, y); y += 5;
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20);
        doc.text(contact || c.name, M, y);
        doc.setFontSize(8); doc.setTextColor(100, 100, 100);
        doc.text(`Date: ${today}`, M, y + 5);
        if (signatureDataUrl && signatureDataUrl.length > 0) {
            doc.addImage(signatureDataUrl, 'PNG', sigX, y - 3, sigColW, 22);
        } else {
            doc.setFillColor(240, 247, 255);
            doc.roundedRect(sigX, y - 4, sigColW, 18, 2, 2, 'F');
            doc.setDrawColor(79, 148, 240);
            doc.roundedRect(sigX, y - 4, sigColW, 18, 2, 2, 'S');
            doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(79, 148, 240);
            doc.text('Electronically signed', sigX + sigColW / 2, y + 3.5, { align: 'center' });
            doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 140, 200);
            doc.text(today, sigX + sigColW / 2, y + 9, { align: 'center' });
        }

        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let pg = 1; pg <= totalPages; pg++) {
            doc.setPage(pg);
            doc.setDrawColor(210, 210, 210); doc.line(M, 287, W - M, 287);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(150, 150, 150);
            doc.text('EliasDH BV  ·  VAT: BE1034925266  ·  info@eliasdh.com  ·  eliasdh.com', M, 291);
            doc.text(`Page ${pg} / ${totalPages}`, W - M, 291, { align: 'right' });
        }

        const ab = doc.output('arraybuffer');
        const bytes = new Uint8Array(ab);
        let bin = '';
        for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
    }
}