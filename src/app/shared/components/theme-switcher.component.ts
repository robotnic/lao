import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, type Theme } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-switcher">
      <button 
        class="theme-btn"
        [class.active]="themeService.isMinimalTheme()"
        (click)="selectTheme('minimal')"
        aria-label="Switch to minimal theme (clean, dense, professional)"
        title="Minimal Theme: Clean, professional design">
        <span class="theme-icon minimal-icon">⚙️</span>
        <span class="theme-label">Minimal</span>
      </button>
      <button 
        class="theme-btn"
        [class.active]="themeService.isPlayfulTheme()"
        (click)="selectTheme('playful')"
        aria-label="Switch to playful theme (colorful, large targets)"
        title="Playful Theme: Colorful, accessible design">
        <span class="theme-icon playful-icon">🎨</span>
        <span class="theme-label">Playful</span>
      </button>
    </div>
  `,
  styles: [`
    .theme-switcher {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
      padding: var(--spacing-sm);
      background-color: rgba(255, 255, 255, 0.8);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }

    .theme-btn {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: transparent;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-normal);
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-secondary);
      min-height: 44px;
    }

    .theme-btn:hover {
      background-color: var(--primary-bg);
      border-color: var(--secondary-color);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .theme-btn.active {
      background-color: var(--secondary-color);
      border-color: var(--secondary-color);
      color: white;
    }

    .theme-icon {
      font-size: 1.2rem;
    }

    .minimal-icon,
    .playful-icon {
      font-size: 1.2rem;
    }

    .theme-label {
      display: none;
    }

    @media (min-width: 480px) {
      .theme-label {
        display: inline;
      }
    }

    /* Accessibility: High contrast mode support */
    @media (prefers-contrast: more) {
      .theme-btn {
        border-width: 3px;
      }

      .theme-btn.active {
        text-decoration: underline;
      }
    }

    /* Accessibility: Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .theme-btn {
        transition: none;
      }

      .theme-btn:hover {
        transform: none;
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: more) {
      .theme-btn {
        border-width: 3px;
      }
    }
  `]
})
export class ThemeSwitcherComponent {
  constructor(public themeService: ThemeService) {}

  selectTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }
}
