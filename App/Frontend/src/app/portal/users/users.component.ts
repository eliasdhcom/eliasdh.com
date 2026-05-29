/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, PortalUser } from '../../services/users.service';
import { CustomersService, Customer } from '../../services/customers.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-portal-users',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.css']
})
export class PortalUsersComponent implements OnInit, OnDestroy {
    users:       PortalUser[] = [];
    customers:   Customer[]  = [];
    loading      = true;
    error        = '';
    searchQuery  = '';

    panelOpen      = false;
    isCreating     = false;
    selectedUser:  PortalUser | null = null;
    editedUser:    PortalUser = this.emptyUser();
    newPassword    = '';
    avatarPreview: string | null = null;
    saving         = false;
    deleting       = false;
    saveError      = '';

    readonly ROLES = ['Admin', 'Employee', 'Customer'];

    private destroy$ = new Subject<void>();

    constructor(
        private usersService:    UsersService,
        private customersService: CustomersService
    ) {}

    ngOnInit(): void {
        this.loadUsers();
        this.customersService.getAllCustomers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: r => { this.customers = (r.data ?? []).sort((a, b) => a.name.localeCompare(b.name)); } });
    }
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadUsers(): void {
        this.loading = true;
        this.error   = '';
        this.usersService.getAllUsers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next:  r => { this.users = r.data ?? []; this.loading = false; },
                error: () => { this.error = 'Gebruikers konden niet worden geladen.'; this.loading = false; }
            });
    }

    get filteredUsers(): PortalUser[] {
        const q = this.searchQuery.toLowerCase().trim();
        if (!q) return this.users;
        return this.users.filter(u =>
            u.firstName.toLowerCase().includes(q) ||
            u.lastName.toLowerCase().includes(q)  ||
            u.email.toLowerCase().includes(q)     ||
            u.role.toLowerCase().includes(q)      ||
            u.company.toLowerCase().includes(q)
        );
    }

    onSearch(event: Event): void {
        this.searchQuery = (event.target as HTMLInputElement).value;
    }

    onAvatarFileChange(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        this.resizeImage(file, 200).then(dataUrl => {
            this.avatarPreview      = dataUrl;
            this.editedUser.avatar  = dataUrl;
        });
    }

    removeAvatar(): void {
        this.avatarPreview     = null;
        this.editedUser.avatar = null;
    }

    private resizeImage(file: File, maxPx: number): Promise<string> {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > maxPx) { h = Math.round(h * maxPx / w); w = maxPx; } }
                    else       { if (h > maxPx) { w = Math.round(w * maxPx / h); h = maxPx; } }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.82));
                };
                img.src = e.target!.result as string;
            };
            reader.readAsDataURL(file);
        });
    }

    openCreatePanel(): void {
        this.isCreating    = true;
        this.selectedUser  = null;
        this.editedUser    = this.emptyUser();
        this.newPassword   = '';
        this.avatarPreview = null;
        this.saveError     = '';
        this.panelOpen     = true;
    }

    openPanel(user: PortalUser): void {
        this.isCreating    = false;
        this.selectedUser  = user;
        this.editedUser    = { ...user };
        this.newPassword   = '';
        this.avatarPreview = user.avatar;
        this.saveError     = '';
        this.panelOpen     = true;
    }

    closePanel(): void {
        this.panelOpen    = false;
        this.isCreating   = false;
        this.selectedUser = null;
        this.saveError    = '';
        this.deleting     = false;
    }

    confirmDelete(): void {
        if (!this.selectedUser || this.deleting) return;
        this.deleting  = true;
        this.saveError = '';
        this.usersService.deleteUser(this.selectedUser.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.users = this.users.filter(u => u.id !== this.selectedUser!.id);
                    this.deleting = false;
                    this.closePanel();
                },
                error: () => {
                    this.saveError = 'Verwijderen mislukt. Probeer opnieuw.';
                    this.deleting  = false;
                }
            });
    }

    saveUser(): void {
        if (this.saving) return;
        this.isCreating ? this.doCreate() : this.doUpdate();
    }

    private doCreate(): void {
        const u = this.editedUser;
        if (!u.firstName || !u.lastName || !u.email || !this.newPassword ||
            !u.role || !u.phone || !u.company || !u.birthDate) {
            this.saveError = 'Vul alle verplichte velden in.';
            return;
        }
        if (this.newPassword.length < 8) {
            this.saveError = 'Wachtwoord moet minimaal 8 tekens bevatten.';
            return;
        }
        if (!/[0-9]/.test(this.newPassword)) {
            this.saveError = 'Wachtwoord moet minimaal één cijfer bevatten.';
            return;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(this.newPassword)) {
            this.saveError = 'Wachtwoord moet minimaal één speciaal teken bevatten.';
            return;
        }
        this.saving    = true;
        this.saveError = '';
        this.usersService.createUser({
            email:     this.editedUser.email,
            password:  this.newPassword,
            firstName: this.editedUser.firstName,
            lastName:  this.editedUser.lastName,
            role:      this.editedUser.role || 'user',
            company:   this.editedUser.company,
            phone:     this.editedUser.phone,
            birthDate: this.editedUser.birthDate,
            avatar:    this.editedUser.avatar ?? undefined
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: r => {
                if (r.data) this.users = [...this.users, r.data];
                this.saving = false;
                this.closePanel();
            },
            error: (err) => {
                this.saveError = err?.error?.error ?? 'Aanmaken mislukt. Probeer opnieuw.';
                this.saving    = false;
            }
        });
    }

    private doUpdate(): void {
        if (!this.selectedUser) return;
        this.saving    = true;
        this.saveError = '';
        this.usersService.updateUser(this.selectedUser.id, {
            firstName: this.editedUser.firstName,
            lastName:  this.editedUser.lastName,
            email:     this.editedUser.email,
            role:      this.editedUser.role,
            company:   this.editedUser.company,
            phone:     this.editedUser.phone,
            birthDate: this.editedUser.birthDate,
            avatar:    this.editedUser.avatar
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: () => {
                const idx = this.users.findIndex(u => u.id === this.selectedUser!.id);
                if (idx !== -1) this.users[idx] = { ...this.users[idx], ...this.editedUser };
                this.usersService.avatarUpdated$.next({ id: this.selectedUser!.id, avatar: this.editedUser.avatar ?? null });
                this.saving = false;
                this.closePanel();
            },
            error: () => {
                this.saveError = 'Opslaan mislukt. Probeer opnieuw.';
                this.saving    = false;
            }
        });
    }

    toggleActive(user: PortalUser, event: Event): void {
        event.stopPropagation();
        const newActive = !user.active;
        user.active = newActive;
        if (this.selectedUser?.id === user.id) this.editedUser.active = newActive;
        this.usersService.setActive(user.id, newActive)
            .pipe(takeUntil(this.destroy$))
            .subscribe({ error: () => { user.active = !newActive; } });
    }

    getInitials(u: PortalUser): string {
        return ((u.firstName[0] ?? '') + (u.lastName[0] ?? '')).toUpperCase() || u.email[0].toUpperCase();
    }

    getRoleClass(role: string): string {
        const r = (role ?? '').toLowerCase();
        if (r === 'admin')    return 'users-role--admin';
        if (r === 'employee') return 'users-role--employee';
        return 'users-role--customer';
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '—';
        // Parse YYYY-MM-DD without timezone shift
        const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (iso) {
            const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
            return d.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    get activeCount(): number   { return this.users.filter(u => u.active).length; }
    get inactiveCount(): number { return this.users.filter(u => !u.active).length; }

    private emptyUser(): PortalUser {
        return { id: 0, email: '', firstName: '', lastName: '', role: '', company: '', phone: '', birthDate: '', avatar: null, createdAt: '', active: true };
    }
}
