import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageSelectorComponent } from './language-selector.component';

describe('LanguageSelectorComponent', () => {
  let component: LanguageSelectorComponent;
  let fixture: ComponentFixture<LanguageSelectorComponent>;
  let translateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    const translateSpy = jasmine.createSpyObj('TranslateService', ['use', 'currentLang']);

    await TestBed.configureTestingModule({
      imports: [LanguageSelectorComponent, TranslateModule.forRoot()],
      providers: [
        { provide: TranslateService, useValue: translateSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default language', () => {
    expect(component.selectedLanguage.code).toBe('en');
    expect(component.selectedLanguage.name).toBe('English');
  });

  it('should have all required languages', () => {
    const languages = component.languages();
    expect(languages.length).toBe(4);
    expect(languages.map(l => l.code)).toEqual(['en', 'he', 'ar', 'ru']);
  });

  it('should change language when selection changes', () => {
    const mockLanguage = { code: 'he', name: 'עברית', flag: '🇮🇱', icon: 'pi pi-flag' };
    
    component.onLanguageChange({ value: mockLanguage });
    
    expect(translateService.use).toHaveBeenCalledWith('he');
    expect(localStorage.getItem('preferred-language')).toBe('he');
  });
});
