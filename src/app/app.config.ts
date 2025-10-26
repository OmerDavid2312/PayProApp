import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { MyPreset } from './themes/preset.theme';
import { authInterceptor } from './interceptors/auth.interceptor';

// Custom TranslateLoader implementation
export class HttpTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`);
  }
}

// Factory function for TranslateHttpLoader
export function createTranslateLoader(http: HttpClient) {
  return new HttpTranslateLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: MyPreset,
      },
      ripple: true, // enables ripple effect on buttons and interactive elements
      inputVariant: 'outlined' // or 'filled' for different input field styles
    }),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient]
        },
        defaultLanguage: 'en'
      })
    ),
    // Initialize language from localStorage
    {
      provide: 'APP_INITIALIZER',
      useFactory: (translateService: TranslateService) => {
        return () => {
          const savedLanguage = localStorage.getItem('preferred-language') || 'en';
          console.log('APP_INITIALIZER: Loading language:', savedLanguage);
          translateService.setDefaultLang('en');
          return translateService.use(savedLanguage).toPromise().then(() => {
            console.log('APP_INITIALIZER: Language loaded successfully:', savedLanguage);
            console.log('APP_INITIALIZER: Current language:', translateService.currentLang);
          });
        };
      },
      deps: [TranslateService],
      multi: true
    }
  ]
};
