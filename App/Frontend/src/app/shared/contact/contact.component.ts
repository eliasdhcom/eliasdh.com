/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ContactService } from '../../services/contact.service';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.css'
})

export class ContactComponent {
    @Input() defaultSubject: string = '';
    @Output() closeModal = new EventEmitter<void>();

    formData = {
        name: '',
        email: '',
        subject: '',
        message: ''
    };

    isSubmitting = false;
    submitSuccess = false;
    submitError = false;
    errorMessage = '';

    private contactService = inject(ContactService);

    ngOnInit() {
        if (this.defaultSubject) this.formData.subject = this.defaultSubject;
    }

    onSubmit() {
        if (!this.validateForm()) return;

        this.isSubmitting = true;
        this.submitError = false;
        this.submitSuccess = false;

        this.contactService.submitContactForm(this.formData).subscribe({
            next: (response: any) => {
                this.isSubmitting = false;
                this.submitSuccess = true;
                setTimeout(() => {
                this.close();
                }, 2000);
            },
            error: (error: any) => {
                this.isSubmitting = false;
                this.submitError = true;
                this.errorMessage = error.error?.message || 'CONTACT.ERROR_GENERIC';
            }
        });
    }

    validateForm(): boolean {
        if (!this.formData.name || !this.formData.email || !this.formData.subject || !this.formData.message) {
            this.submitError = true;
            this.errorMessage = 'CONTACT.ERROR_REQUIRED';
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.formData.email)) {
            this.submitError = true;
            this.errorMessage = 'CONTACT.ERROR_EMAIL';
            return false;
        }

        return true;
    }

    close() {
        this.closeModal.emit();
    }

    onBackdropClick(event: MouseEvent) {
        if ((event.target as HTMLElement).classList.contains('contact-modal-backdrop')) this.close();
    }
}