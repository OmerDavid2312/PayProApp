import { Component, ChangeDetectionStrategy, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Components
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule
  ],
  template: `
    <p-dialog
      header="Terms and Conditions"
      [visible]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [style]="{width: '80vw', maxWidth: '800px'}"
      [draggable]="false"
      [dismissableMask]="true"
      [resizable]="false"
      [closable]="true">
      
      <div class="terms-content">
        <p class="text-600 mb-4"><em>Last updated: September 22, 2025</em></p>
        
        <div class="mb-4">
          <h3 class="text-900 mb-2">1. Acceptance of Terms</h3>
          <p class="text-700 line-height-3">By accessing and using PayPro, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </div>
        
        <div class="mb-4">
          <h3 class="text-900 mb-2">2. Use License</h3>
          <p class="text-700 line-height-3">Permission is granted to temporarily download one copy of PayPro for personal, non-commercial transitory viewing only.</p>
        </div>
        
        <div class="mb-4">
          <h3 class="text-900 mb-2">3. Privacy Policy</h3>
          <p class="text-700 line-height-3">Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our service.</p>
        </div>
        
        <div class="mb-4">
          <h3 class="text-900 mb-2">4. User Account</h3>
          <p class="text-700 line-height-3">You are responsible for safeguarding the password and for maintaining the confidentiality of your account information.</p>
        </div>
        
        <div class="mb-4">
          <h3 class="text-900 mb-2">5. Cancellation Policy</h3>
          <p class="text-700 line-height-3">You may cancel your account at any time by contacting our support team. Upon cancellation, your access to the service will be terminated.</p>
        </div>
        
        <div class="mb-4">
          <h3 class="text-900 mb-2">6. Limitation of Liability</h3>
          <p class="text-700 line-height-3">In no event shall PayPro or its suppliers be liable for any damages arising out of the use or inability to use the service.</p>
        </div>
        
        <div class="mb-4">
          <h3 class="text-900 mb-2">7. Contact Information</h3>
          <p class="text-700 line-height-3">If you have any questions about these Terms and Conditions, please contact us at support@paypro.com</p>
        </div>
      </div>
      
      <ng-template pTemplate="footer">
        <div class="flex justify-content-end">
          <p-button
            label="Close"
            icon="pi pi-check"
            (onClick)="onClose()"
            styleClass="p-button-text"/>
        </div>
      </ng-template>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TermsComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
