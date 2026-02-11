/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/11/2025
**/

import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';
import { CustomersService, Customer } from '../services/customers.service';
import { LanguageService } from '../services/language.service';
import * as L from 'leaflet';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css'],
    imports: [CommonModule, FormsModule, TranslatePipe, SharedModule],
    standalone: true
})

export class MapComponent implements OnInit, OnDestroy, AfterViewInit {
    private map!: L.Map;
    private markers: L.Marker[] = [];
    customers: Customer[] = [];
    selectedCustomer: Customer | null = null;
    isLoading: boolean = true;
    error: string | null = null;
    isSidebarOpen: boolean = false;

    searchQuery: string = '';
    filteredCustomers: Customer[] = [];
    isSearchFocused: boolean = false;

    encodeURIComponent = encodeURIComponent;

    constructor(
        private customersService: CustomersService,
        private languageService: LanguageService
    ) { }

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
        this.loadCustomers();
    }

    ngAfterViewInit(): void {
        this.initMap();
    }

    ngOnDestroy(): void {
        if (this.map) this.map.remove();
    }

    private initMap(): void {
        this.map = L.map('map', {
            center: [50.8503, 4.3517],
            zoom: 8,
            zoomControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
    }

    loadCustomers(): void {
        this.isLoading = true;
        this.error = null;

        this.customersService.getAllCustomers().subscribe({
            next: (response) => {
                if (response.success) {
                    this.customers = response.data;
                    this.addMarkersToMap();
                } else this.error = 'Failed to load customers';
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading customers:', err);
                this.error = 'Failed to load customers. Please try again later.';
                this.isLoading = false;
            }
        });
    }

    private addMarkersToMap(): void {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];

        const customIcon = L.divIcon({
            className: 'custom-marker cursor-pointer',
            html: `<div class="marker-pin cursor-pointer"></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        this.customers.forEach(customer => {
            if (customer.latitude && customer.longitude) {
                const marker = L.marker([customer.latitude, customer.longitude], { icon: customIcon }).addTo(this.map).on('click', () => this.selectCustomer(customer));

                marker.bindTooltip(customer.name, {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -40]
                });

                this.markers.push(marker);
            }
        });

        if (this.markers.length > 0) {
            const group = L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    selectCustomer(customer: Customer): void {
        this.selectedCustomer = customer;
        this.isSidebarOpen = true;

        if (customer.websites && customer.websites.length > 0) {
            customer.websites.forEach(website => {
                this.customersService.getVisitorCount(website.url).subscribe({
                    next: (response) => {
                        if (response.success) website.visitors = response.visitors;
                    },
                    error: (err) => {
                        console.error(`Failed to load visitors for ${website.url}:`, err);
                        website.visitors = 0;
                    }
                });
            });
        }

        if (customer.latitude && customer.longitude) {
            this.map.setView([customer.latitude, customer.longitude], 14, {
                animate: true
            });
        }
    }

    closeSidebar(): void {
        this.isSidebarOpen = false;
        this.selectedCustomer = null;
    }

    openWebsite(url: string): void {
        window.open(url, '_blank');
    }

    onSearchInput(): void {
        if (!this.searchQuery.trim()) {
            this.filteredCustomers = [];
            return;
        }

        const query = this.searchQuery.toLowerCase().trim();
        this.filteredCustomers = this.customers.filter(customer => 
            customer.name.toLowerCase().includes(query) ||
            customer.address?.toLowerCase().includes(query) ||
            customer.vat?.toLowerCase().includes(query)
        ).slice(0, 5);
    }

    onSearchFocus(): void {
        this.isSearchFocused = true;
        if (this.searchQuery.trim()) {
            this.onSearchInput();
        }
    }

    onSearchBlur(): void {
        setTimeout(() => {
            this.isSearchFocused = false;
        }, 200);
    }

    selectSearchResult(customer: Customer): void {
        this.searchQuery = '';
        this.filteredCustomers = [];
        this.isSearchFocused = false;
        this.selectCustomer(customer);
    }

    clearSearch(): void {
        this.searchQuery = '';
        this.filteredCustomers = [];
        this.isSearchFocused = false;
    }
}