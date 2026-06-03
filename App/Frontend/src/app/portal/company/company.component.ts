/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 03/06/2026
**/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CustomersService, Customer, CustomerLocation, SocialLink } from '../../services/customers.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface SocialLinkForm { type: string; url: string; }

interface LocationForm {
    id?:         number;
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

interface HQForm {
    logo:      string;
    name:      string;
    firstName: string;
    lastName:  string;
    email:     string;
    phone:     string;
    mobile:    string;
    locations: LocationForm[];
}

@Component({
    selector: 'app-portal-company',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './company.component.html',
    styleUrls: ['./company.component.css']
})
export class PortalCompanyComponent implements OnInit, OnDestroy {
    loading   = true;
    saving    = false;
    error     = '';
    success   = false;
    formError = '';

    hqId        = '';
    form: HQForm = this.emptyForm();
    formTouched = false;

    readonly socialTypes = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube', 'github'];
    geocodingLoading: boolean[] = [];

    private destroy$ = new Subject<void>();

    constructor(
        private customersService: CustomersService,
        private translate: TranslateService
    ) {}

    ngOnInit(): void { this.loadHQ(); }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private emptyForm(): HQForm {
        return { logo: '', name: '', firstName: '', lastName: '', email: '', phone: '', mobile: '', locations: [] };
    }

    private emptyLocation(): LocationForm {
        return { street: '', number: '', postalCode: '', city: '', country: 'Belgium', vat: '', latitude: '', longitude: '', socialLinks: [] };
    }

    loadHQ(): void {
        this.loading = true;
        this.error   = '';
        this.customersService.getAllCustomers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: r => {
                    const hq = (r.data ?? []).find(c => c.isHQ);
                    if (!hq) { this.error = 'HQ not found.'; this.loading = false; return; }
                    this.hqId = hq.id;
                    this.form = {
                        logo:      hq.logo      ?? '',
                        name:      hq.name,
                        firstName: hq.firstName ?? '',
                        lastName:  hq.lastName  ?? '',
                        email:     hq.email     ?? '',
                        phone:     hq.phone     ?? '',
                        mobile:    hq.mobile    ?? '',
                        locations: hq.locations.map(l => ({
                            id:          l.id,
                            street:      l.street,
                            number:      l.number,
                            postalCode:  l.postalCode,
                            city:        l.city,
                            country:     l.country,
                            vat:         l.vat ?? '',
                            latitude:    l.latitude  != null ? String(l.latitude)  : '',
                            longitude:   l.longitude != null ? String(l.longitude) : '',
                            socialLinks: (l.socialLinks ?? []).map(s => ({ type: s.type, url: s.url }))
                        }))
                    };
                    this.loading = false;
                },
                error: () => { this.error = 'Failed to load HQ data.'; this.loading = false; }
            });
    }

    addLocation():                                void { this.form.locations.push(this.emptyLocation()); this.formTouched = true; }
    removeLocation(i: number):                    void { this.form.locations.splice(i, 1); this.formTouched = true; }
    addSocialLink(loc: LocationForm):             void { loc.socialLinks.push({ type: 'facebook', url: '' }); this.formTouched = true; }
    removeSocialLink(loc: LocationForm, i: number): void { loc.socialLinks.splice(i, 1); this.formTouched = true; }

    onLogoFileChange(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { this.form.logo = reader.result as string; this.formTouched = true; };
        reader.readAsDataURL(file);
    }

    onAddressBlur(loc: LocationForm, index: number): void {
        if (!loc.street.trim() || !loc.city.trim()) return;
        if (this.geocodingLoading[index]) return;
        this.geocodingLoading[index] = true;
        const parts = [loc.street, loc.number, loc.postalCode, loc.city, loc.country].filter(s => s.trim());
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(parts.join(' '))}&limit=1`)
            .then(r => r.json())
            .then((data: any[]) => { if (data?.length) { loc.latitude = data[0].lat; loc.longitude = data[0].lon; } })
            .catch(() => {})
            .finally(() => { this.geocodingLoading[index] = false; });
    }

    save(): void {
        if (!this.form.name.trim())  { this.formError = this.translate.instant('PORTAL.COMPANY.ERR_NAME');  return; }
        if (!this.form.logo)         { this.formError = this.translate.instant('PORTAL.COMPANY.ERR_LOGO');  return; }
        if (!this.form.email.trim()) { this.formError = this.translate.instant('PORTAL.COMPANY.ERR_EMAIL'); return; }

        for (let i = 0; i < this.form.locations.length; i++) {
            const loc = this.form.locations[i];
            const n   = i + 1;
            if (!loc.street.trim())     { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOC_STREET',  { n }); return; }
            if (!loc.number.trim())     { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOC_NUMBER',  { n }); return; }
            if (!loc.postalCode.trim()) { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOC_POSTAL',  { n }); return; }
            if (!loc.city.trim())       { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOC_CITY',    { n }); return; }
            if (!loc.country.trim())    { this.formError = this.translate.instant('PORTAL.CUSTOMERS.FORM.ERR_LOC_COUNTRY', { n }); return; }
        }

        this.saving    = true;
        this.formError = '';
        this.success   = false;

        const payload: Partial<Customer> = {
            logo:      this.form.logo,
            name:      this.form.name.trim(),
            firstName: this.form.firstName.trim(),
            lastName:  this.form.lastName.trim(),
            email:     this.form.email.trim(),
            phone:     this.form.phone.trim(),
            mobile:    this.form.mobile.trim(),
            locations: this.form.locations.map(l => ({
                id:          l.id,
                street:      l.street.trim(),
                number:      l.number.trim(),
                postalCode:  l.postalCode.trim(),
                city:        l.city.trim(),
                country:     l.country.trim(),
                vat:         l.vat.trim() || undefined,
                latitude:    l.latitude  ? Number(l.latitude)  : 0,
                longitude:   l.longitude ? Number(l.longitude) : 0,
                socialLinks: l.socialLinks.filter(s => s.url.trim()) as SocialLink[]
            }) as CustomerLocation)
        };

        this.customersService.updateCustomer(this.hqId, payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.saving      = false;
                    this.formTouched = false;
                    this.success     = true;
                    setTimeout(() => { this.success = false; }, 3000);
                },
                error: (err) => {
                    this.saving    = false;
                    this.formError = err?.error?.error ?? 'Er is een fout opgetreden.';
                }
            });
    }
}