import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  protected readonly title = signal('Ticket Admin Dashboard');
  
  
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

