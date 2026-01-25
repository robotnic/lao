import { Injectable, signal } from '@angular/core';

export type Theme = 'minimal' | 'playful';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'lao_theme_preference';
  
  // Signal to track current theme
  currentTheme = signal<Theme>(this.getStoredTheme());

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  /**
   * Get stored theme preference from localStorage
   * Defaults to 'adult' if not set
   */
  private getStoredTheme(): Theme {
    const stored = localStorage.getItem(this.THEME_KEY);
    return (stored === 'minimal' || stored === 'playful') ? stored : 'minimal';
  }

  /**
   * Apply theme to document body
   */
  private applyTheme(theme: Theme): void {
    const body = document.body;
    
    // Remove both theme classes
    body.classList.remove('theme-adult', 'theme-child');
    
    // Add the new theme class
    body.classList.add(`theme-${theme}`);
    
    // Save preference
    localStorage.setItem(this.THEME_KEY, theme);
  }

  /**
   * Toggle between minimal and playful themes
   */
  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme() === 'minimal' ? 'playful' : 'minimal';
    this.setTheme(newTheme);
  }

  /**
   * Set theme explicitly
   */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.applyTheme(theme);
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme();
  }

  /**
   * Check if minimal theme is active (clean, dense, professional)
   */
  isMinimalTheme(): boolean {
    return this.currentTheme() === 'minimal';
  }

  /**
   * Check if playful theme is active (high-contrast, large targets, colorful)
   */
  isPlayfulTheme(): boolean {
    return this.currentTheme() === 'playful';
  }
}
