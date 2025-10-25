import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';
import { AccordionModule } from 'primeng/accordion';
import { StepsModule } from 'primeng/steps';
import { MenuModule } from 'primeng/menu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    FormsModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    CardModule,
    ButtonModule,
    TabsModule,
    CheckboxModule,
    AccordionModule,
    StepsModule,
    MenuModule,
    ContextMenuModule,
    DrawerModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly translate = inject(TranslateService);
  protected readonly title = signal('Ticket Admin Dashboard');
  protected readonly isRtl = signal(false);
  protected readonly currentLang = signal('en');

  constructor() {
    const browserLang = this.translate.getBrowserLang();
    const supportedLangs = ['en', 'he', 'ar', 'ru'];
    const savedLanguage = localStorage.getItem('preferred-language'); 
    let langToUse =  savedLanguage || browserLang ||'en';
    // fallback to english if the language is not supported
    if(!supportedLangs.includes(langToUse)) { langToUse = 'en'; }
    this.translate.setDefaultLang(langToUse);
    this.translate.use(langToUse);
    this.currentLang.set(langToUse);
    this.updateDirection(langToUse);

    // Subscribe to language changes
    this.translate.onLangChange.subscribe((event) => {
      this.currentLang.set(event.lang);
      this.updateDirection(event.lang);
    });
  }

  private updateDirection(lang: string): void {
    // RTL languages: Hebrew and Arabic
    const rtlLanguages = ['he', 'ar'];
    this.isRtl.set(rtlLanguages.includes(lang));
  }


  // Sample data for components
  selectedCity: any = null;
  cities = [
    { name: 'High Priority', code: 'HIGH' },
    { name: 'Medium Priority', code: 'MED' },
    { name: 'Low Priority', code: 'LOW' },
    { name: 'Critical', code: 'CRIT' },
    { name: 'Resolved', code: 'RES' }
  ];

  selectedDate: Date | null = null;
  checked: boolean = false;

  activeIndex: number = 0;

  sidebarVisible: boolean = false;


  items = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home'
    },
    {
      label: 'Tickets',
      icon: 'pi pi-ticket',
      items: [
        {
          label: 'Open Tickets',
          icon: 'pi pi-clock'
        },
        {
          label: 'In Progress',
          icon: 'pi pi-spin pi-spinner'
        },
        {
          label: 'Resolved',
          icon: 'pi pi-check'
        },
        {
          label: 'Closed',
          icon: 'pi pi-times'
        }
      ]
    },
    {
      label: 'Users',
      icon: 'pi pi-users'
    },
    {
      label: 'Reports',
      icon: 'pi pi-chart-bar'
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog'
    }
  ];
}
