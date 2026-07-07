/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 07/07/2026
**/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PasswordsService, PasswordEntry, PasswordEntryInput } from '../../services/passwords.service';
import { VaultService } from '../../services/vault.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-portal-passwords',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './passwords.component.html',
    styleUrls: ['./passwords.component.css']
})
export class PortalPasswordsComponent implements OnInit, OnDestroy {
    entries:     PasswordEntry[] = [];
    loading      = true;
    error        = '';
    searchQuery  = '';

    panelOpen          = false;
    isCreating         = false;
    selectedEntry:     PasswordEntry | null = null;
    editedEntry:       PasswordEntryInput = this.emptyEntry();
    editedPassword     = '';
    saving             = false;
    deleting           = false;
    deleteConfirmOpen  = false;
    saveError          = '';
    formTouched        = false;
    showDiscardConfirm = false;

    revealedPasswords: Record<number, string | undefined> = {};
    private revealHideTimers: Record<number, ReturnType<typeof setTimeout>> = {};

    vaultPromptOpen = false;
    vaultPassword   = '';
    vaultError      = '';
    vaultVerifying  = false;
    private pendingRevealId: number | null = null;

    vaultUnlocked       = false;
    vaultRemainingLabel = '';
    private countdownTimer: ReturnType<typeof setInterval> | null = null;

    copiedKey: string | null = null;
    private copiedTimer: ReturnType<typeof setTimeout> | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private passwordsService: PasswordsService,
        private vaultService:     VaultService
    ) {}

    ngOnInit(): void {
        this.loadEntries();
        this.vaultService.unlocked$
            .pipe(takeUntil(this.destroy$))
            .subscribe(unlocked => {
                this.vaultUnlocked = unlocked;
                if (unlocked) this.startCountdown(); else this.stopCountdown();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.stopCountdown();
        Object.values(this.revealHideTimers).forEach(t => clearTimeout(t));
        if (this.copiedTimer) clearTimeout(this.copiedTimer);
    }

    loadEntries(): void {
        this.loading = true;
        this.error   = '';
        this.passwordsService.getAll()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next:  r => { this.entries = (r.data ?? []).sort((a, b) => a.serviceName.localeCompare(b.serviceName)); this.loading = false; },
                error: () => { this.error = 'Wachtwoorden konden niet worden geladen.'; this.loading = false; }
            });
    }

    get filteredEntries(): PasswordEntry[] {
        const q = this.searchQuery.toLowerCase().trim();
        if (!q) return this.entries;
        return this.entries.filter(e =>
            e.serviceName.toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q)       ||
            e.username.toLowerCase().includes(q)
        );
    }

    onSearch(event: Event): void {
        this.searchQuery = (event.target as HTMLInputElement).value;
    }

    markTouched(): void { this.formTouched = true; }

    openCreatePanel(): void {
        this.isCreating         = true;
        this.selectedEntry      = null;
        this.editedEntry        = this.emptyEntry();
        this.editedPassword     = '';
        this.saveError          = '';
        this.formTouched        = false;
        this.showDiscardConfirm = false;
        this.panelOpen          = true;
    }

    openPanel(entry: PasswordEntry): void {
        this.isCreating    = false;
        this.selectedEntry = entry;
        this.editedEntry   = {
            serviceName: entry.serviceName,
            loginUrl:    entry.loginUrl,
            email:       entry.email,
            username:    entry.username,
            has2fa:      entry.has2fa
        };
        this.editedPassword     = '';
        this.saveError          = '';
        this.formTouched        = false;
        this.showDiscardConfirm = false;
        this.panelOpen          = true;
    }

    requestClose(): void {
        if (this.formTouched) { this.showDiscardConfirm = true; return; }
        this.closePanel();
    }

    confirmDiscard(): void { this.showDiscardConfirm = false; this.closePanel(); }
    cancelDiscard(): void  { this.showDiscardConfirm = false; }

    closePanel(): void {
        this.panelOpen          = false;
        this.isCreating         = false;
        this.selectedEntry      = null;
        this.saveError          = '';
        this.deleting           = false;
        this.deleteConfirmOpen  = false;
        this.formTouched        = false;
        this.showDiscardConfirm = false;
    }

    openDeleteConfirm(): void   { this.deleteConfirmOpen = true; }
    cancelDeleteConfirm(): void { this.deleteConfirmOpen = false; }

    executeDelete(): void {
        if (!this.selectedEntry || this.deleting) return;
        this.deleting  = true;
        this.saveError = '';
        this.passwordsService.delete(this.selectedEntry.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.entries = this.entries.filter(e => e.id !== this.selectedEntry!.id);
                    this.deleting          = false;
                    this.deleteConfirmOpen = false;
                    this.closePanel();
                },
                error: () => {
                    this.saveError         = 'Verwijderen mislukt. Probeer opnieuw.';
                    this.deleting          = false;
                    this.deleteConfirmOpen = false;
                }
            });
    }

    saveEntry(): void {
        if (this.saving) return;
        if (!this.editedEntry.serviceName?.trim()) { this.saveError = 'Vul de servicenaam in.'; return; }
        if (this.isCreating && !this.editedPassword) { this.saveError = 'Vul een wachtwoord in.'; return; }
        this.isCreating ? this.doCreate() : this.doUpdate();
    }

    private doCreate(): void {
        this.saving    = true;
        this.saveError = '';
        this.passwordsService.create({ ...this.editedEntry, password: this.editedPassword })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: r => {
                    if (r.data) this.entries = [...this.entries, r.data].sort((a, b) => a.serviceName.localeCompare(b.serviceName));
                    this.saving = false;
                    this.closePanel();
                },
                error: err => {
                    this.saveError = err?.error?.error ?? 'Aanmaken mislukt. Probeer opnieuw.';
                    this.saving    = false;
                }
            });
    }

    private doUpdate(): void {
        if (!this.selectedEntry) return;
        this.saving    = true;
        this.saveError = '';
        const payload: Partial<PasswordEntryInput> = { ...this.editedEntry };
        if (this.editedPassword) payload.password = this.editedPassword;
        this.passwordsService.update(this.selectedEntry.id, payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: r => {
                    const idx = this.entries.findIndex(e => e.id === this.selectedEntry!.id);
                    if (idx !== -1 && r.data) this.entries[idx] = r.data;
                    this.saving = false;
                    this.closePanel();
                },
                error: () => {
                    this.saveError = 'Opslaan mislukt. Probeer opnieuw.';
                    this.saving    = false;
                }
            });
    }

    generatePassword(): void {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+';
        const bytes = new Uint32Array(20);
        window.crypto.getRandomValues(bytes);
        this.editedPassword = Array.from(bytes, b => chars[b % chars.length]).join('');
        this.markTouched();
    }

    get passwordStrength(): 'weak' | 'fair' | 'strong' {
        const pw = this.editedPassword;
        let score = 0;
        if (pw.length >= 8)  score++;
        if (pw.length >= 14) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 2) return 'weak';
        if (score <= 3) return 'fair';
        return 'strong';
    }

    requestReveal(entry: PasswordEntry): void {
        if (this.revealedPasswords[entry.id] !== undefined) { this.hideRevealed(entry.id); return; }
        if (!this.vaultService.isUnlocked) {
            this.pendingRevealId = entry.id;
            this.openVaultPrompt();
            return;
        }
        this.doReveal(entry.id);
    }

    private doReveal(id: number): void {
        const token = this.vaultService.getToken();
        if (!token) { this.pendingRevealId = id; this.openVaultPrompt(); return; }
        this.passwordsService.reveal(id, token)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: r => {
                    this.revealedPasswords[id] = r.data.password;
                    if (this.revealHideTimers[id]) clearTimeout(this.revealHideTimers[id]);
                    this.revealHideTimers[id] = setTimeout(() => this.hideRevealed(id), 15000);
                },
                error: () => {
                    this.vaultService.lock();
                    this.pendingRevealId = id;
                    this.openVaultPrompt();
                }
            });
    }

    hideRevealed(id: number): void {
        delete this.revealedPasswords[id];
        if (this.revealHideTimers[id]) {
            clearTimeout(this.revealHideTimers[id]);
            delete this.revealHideTimers[id];
        }
    }

    openVaultPrompt(): void {
        this.vaultPassword   = '';
        this.vaultError      = '';
        this.vaultPromptOpen = true;
    }

    closeVaultPrompt(): void {
        this.vaultPromptOpen  = false;
        this.pendingRevealId  = null;
    }

    submitVaultPassword(): void {
        if (!this.vaultPassword || this.vaultVerifying) return;
        this.vaultVerifying = true;
        this.vaultError     = '';
        this.passwordsService.verify(this.vaultPassword)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: r => {
                    this.vaultService.unlock(r.token, r.expiresAt);
                    this.vaultVerifying  = false;
                    this.vaultPromptOpen = false;
                    const pending = this.pendingRevealId;
                    this.pendingRevealId = null;
                    if (pending != null) this.doReveal(pending);
                },
                error: err => {
                    this.vaultError     = err?.error?.error ?? 'Onjuist wachtwoord.';
                    this.vaultVerifying = false;
                }
            });
    }

    lockVaultNow(): void {
        this.vaultService.lock();
        Object.values(this.revealHideTimers).forEach(t => clearTimeout(t));
        this.revealHideTimers  = {};
        this.revealedPasswords = {};
    }

    copyText(text: string, key: string): void {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            this.copiedKey = key;
            if (this.copiedTimer) clearTimeout(this.copiedTimer);
            this.copiedTimer = setTimeout(() => { this.copiedKey = null; }, 1500);
        });
    }

    private startCountdown(): void {
        this.stopCountdown();
        this.updateCountdownLabel();
        this.countdownTimer = setInterval(() => this.updateCountdownLabel(), 1000);
    }

    private stopCountdown(): void {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer      = null;
        this.vaultRemainingLabel = '';
    }

    private updateCountdownLabel(): void {
        const ms = this.vaultService.remainingMs;
        if (ms <= 0) { this.vaultRemainingLabel = ''; return; }
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        this.vaultRemainingLabel = `${m}m ${s.toString().padStart(2, '0')}s`;
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '—';
        const d = new Date(dateStr.replace(' ', 'T'));
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    private emptyEntry(): PasswordEntryInput {
        return { serviceName: '', loginUrl: '', email: '', username: '', has2fa: false };
    }
}
