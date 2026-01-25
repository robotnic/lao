import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let store: Record<string, string> = {};

  beforeEach(() => {
    // Mock localStorage
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };

    spyOn(localStorage, 'getItem').and.callFake(mockLocalStorage.getItem);
    spyOn(localStorage, 'setItem').and.callFake(mockLocalStorage.setItem);

    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to minimal theme', () => {
    expect(service.getTheme()).toBe('minimal');
  });

  it('should set playful theme', () => {
    service.setTheme('playful');
    expect(service.getTheme()).toBe('playful');
    expect(service.isPlayfulTheme()).toBe(true);
    expect(service.isMinimalTheme()).toBe(false);
  });

  it('should toggle between themes', () => {
    expect(service.getTheme()).toBe('minimal');
    service.toggleTheme();
    expect(service.getTheme()).toBe('playful');
    service.toggleTheme();
    expect(service.getTheme()).toBe('minimal');
  });

  it('should persist theme to localStorage', () => {
    service.setTheme('playful');
    expect(localStorage.setItem).toHaveBeenCalledWith('lao_theme_preference', 'playful');
  });

  it('should apply theme class to body element', () => {
    service.setTheme('playful');
    expect(document.body.classList.contains('theme-playful')).toBe(true);
    service.setTheme('minimal');
    expect(document.body.classList.contains('theme-minimal')).toBe(true);
  });
});
