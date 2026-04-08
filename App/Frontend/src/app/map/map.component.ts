/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/11/2025
**/

import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';
import { CustomersService, Customer } from '../services/customers.service';
import { LanguageService } from '../services/language.service';

declare const L: any;

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css'],
    imports: [CommonModule, FormsModule, TranslatePipe, SharedModule],
    standalone: true
})

export class MapComponent implements OnInit, OnDestroy, AfterViewInit {
    private map: any;
    private markers: any[] = [];
    private markerClusterGroup: any;
    private userLocationMarker: any = null;
    private refreshInterval: any;
    customers: Customer[] = [];
    selectedCustomer: Customer | null = null;
    isLoading: boolean = true;
    error: string | null = null;
    isSidebarOpen: boolean = false;

    searchQuery: string = '';
    filteredCustomers: Customer[] = [];
    isSearchFocused: boolean = false;

    userLocation: { lat: number; lng: number } | null = null;

    encodeURIComponent = encodeURIComponent;

    constructor(
        private customersService: CustomersService,
        private languageService: LanguageService,
        private translateService: TranslateService
    ) { }

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
        this.loadCustomers();
        this.startAutoRefresh();
    }

    ngAfterViewInit(): void {
        this.initMap();
        this.locateUser();
        if (this.customers.length > 0) {
            this.addMarkersToMap();
        }
    }

    ngOnDestroy(): void {
        if (this.map) this.map.remove();
        if (this.refreshInterval) clearInterval(this.refreshInterval);
    }

    private initMap(): void {
        console.log('Initializing map...');
        const mapElement = document.getElementById('map');
        console.log('Map element:', mapElement);
        
        this.map = L.map('map', {
            center: [50.8503, 4.3517],
            zoom: 8,
            zoomControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        if (!L.markerClusterGroup) {
            console.error('leaflet.markercluster not loaded');
            return;
        }
        
        this.markerClusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            disableClusteringAtZoom: 16,
            iconCreateFunction: (cluster: any) => {
                const count = cluster.getChildCount();
                let clusterSize = 36;
                let fontSizeCluster = 13;
                if (count >= 10) {
                    clusterSize = 44;
                    fontSizeCluster = 15;
                }
                if (count >= 50) {
                    clusterSize = 52;
                    fontSizeCluster = 17;
                }
                return L.divIcon({
                    html: `<div class="cursor-pointer" style="width: ${clusterSize}px; height: ${clusterSize}px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--primary); color: var(--background); box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3); font-size: ${fontSizeCluster}px; font-weight: 600;"><span>${count}</span></div>`,
                    className: 'map-custom-cluster-icon',
                    iconSize: L.point(clusterSize, clusterSize),
                    iconAnchor: [clusterSize / 2, clusterSize / 2]
                });
            }
        });
        this.map.addLayer(this.markerClusterGroup);
        console.log('Map initialized successfully');
    }

    loadCustomers(): void {
        this.isLoading = true;
        this.error = null;

        this.customersService.getAllCustomers().subscribe({
            next: (response) => {
                console.log('API Response:', response);
                if (response.success) {
                    this.customers = response.data;
                    console.log('Customers loaded:', this.customers);
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
        console.log('addMarkersToMap called with', this.customers.length, 'customers');
        if (!this.markerClusterGroup) {
            console.error('markerClusterGroup not initialized!');
            return;
        }
        
        this.markerClusterGroup.clearLayers();
        this.markers = [];

        const customIcon = L.divIcon({
            className: 'map-custom-marker cursor-pointer',
            html: `<div class="map-marker-pin cursor-pointer"></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        const hqIcon = L.divIcon({
            className: 'map-hq-location-marker',
            html: `<div class="cursor-pointer map-hq-home-marker"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7h-10zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        this.customers.forEach(customer => {
            if (customer.latitude && customer.longitude) {
                console.log(`Adding marker for ${customer.name} (${customer.latitude}, ${customer.longitude})`);
                const icon = (customer as any).isHQ ? hqIcon : customIcon;
                const marker = L.marker([customer.latitude, customer.longitude], { icon: icon }).on('click', () => this.selectCustomer(customer));

                marker.bindTooltip(customer.name, {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -40]
                });

                this.markers.push(marker);

                if ((customer as any).isHQ) {
                    this.map.addLayer(marker);
                } else {
                    this.markerClusterGroup.addLayer(marker);
                }
            }
        });

        console.log('Total markers added:', this.markers.length);
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

    private startAutoRefresh(): void {
        this.refreshInterval = setInterval(() => {
            this.refreshCustomers();
        }, 10 * 60 * 1000); // 10 minutes
    }

    private refreshCustomers(): void {
        this.customersService.getAllCustomers().subscribe({
            next: (response) => {
                if (response.success) {
                    this.customers = response.data;
                    this.addMarkersToMap();
                }
            },
            error: (err) => {
                console.error('Error refreshing customers:', err);
            }
        });
    }

    locateUser(): void {
        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                this.userLocation = { lat, lng };

                if (this.userLocationMarker) {
                    this.map.removeLayer(this.userLocationMarker);
                }

                const userIcon = L.divIcon({
                    className: 'map-user-location-marker',
                    html: `<div class="map-user-person-marker"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });

                this.userLocationMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
                this.userLocationMarker.bindTooltip(this.translateService.instant('MAP.TRANSLATE15'), {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -20]
                });
            },
            (error) => {
                console.log('Could not get user location:', error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    getDirections(mode: 'driving' | 'bicycling' | 'walking'): void {
        if (!this.userLocation || !this.selectedCustomer?.latitude || !this.selectedCustomer?.longitude) {
            return;
        }

        const origin = `${this.userLocation.lat},${this.userLocation.lng}`;
        const destination = `${this.selectedCustomer.latitude},${this.selectedCustomer.longitude}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`;
        window.open(url, '_blank');
    }
}