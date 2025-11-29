/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/11/2025
**/

import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';
import { CustomersService, Customer } from '../services/customers.service';
import { LanguageService } from '../services/language.service';
import * as L from 'leaflet';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css'],
    imports: [CommonModule, TranslatePipe, SharedModule],
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
            zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        this.fixLeafletIcons();
    }

    private fixLeafletIcons(): void {
        const iconDefault = L.icon({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        L.Marker.prototype.options.icon = iconDefault;
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
            className: 'custom-marker',
            html: `<div class="marker-pin"></div>`,
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

    goBack(): void {
        window.history.back();
    }
}