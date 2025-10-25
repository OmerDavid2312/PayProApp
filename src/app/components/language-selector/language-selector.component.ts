import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';

interface Language {
  code: string;
  name: string;
}

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SelectModule],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss'
})
export class LanguageSelectorComponent {
  private readonly translateService = inject(TranslateService);

  readonly languages = signal<Language[]>([
    { 
      code: 'en', 
      name: 'English'
    },
    { 
      code: 'he', 
      name: 'עברית'
    },
    { 
      code: 'ar', 
      name: 'العربية'
    },
    { 
      code: 'ru', 
      name: 'Русский'
    }
  ]);

  selectedLanguage: Language = this.languages()[0];

  constructor() {
    // Initialize with language from localStorage or current language
    const savedLanguage = localStorage.getItem('preferred-language');
    const currentLang = savedLanguage || this.translateService.currentLang || 'en';
    const lang = this.languages().find(l => l.code === currentLang);
    if (lang) {
      this.selectedLanguage = lang;
    }
    
  }

  onLanguageChange(event: any): void {
    const selectedLang = event.value as Language;
    if (selectedLang) {
      console.log('Changing language to:', selectedLang.code);
      this.translateService.use(selectedLang.code).subscribe({
        next: () => {
          console.log('Language changed successfully to:', selectedLang.code);
          console.log('Current language:', this.translateService.currentLang);
        },
        error: (error) => {
          console.error('Error changing language:', error);
        }
      });
      // Store language preference in localStorage
      localStorage.setItem('preferred-language', selectedLang.code);
    }
  }
}