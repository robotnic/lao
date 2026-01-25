import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgressService } from '../../core/services/progress.service';
import { ThemeService } from '../../core/services/theme.service';
import { PwaService } from '../../core/services/pwa.service';

/**
 * Config Screen Component
 *
 * Settings hub for user preferences:
 * - Theme selection (minimal/playful)
 * - Text-to-Speech (TTS) speed adjustment
 * - Audio volume control
 * - Language selection
 * - Data management (export/import progress)
 * - Cache management for PWA
 */
@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-container">
      <div class="header">
        <h1>Settings</h1>
      </div>

      <!-- Theme Settings -->
      <section class="settings-section">
        <h2>Display</h2>
        <div class="setting-item">
          <div class="setting-info">
            <label>Theme</label>
            <p class="description">Choose your preferred learning interface</p>
          </div>
          <div class="setting-control">
            <button
              class="theme-btn"
              [class.active]="theme.isMinimalTheme()"
              (click)="theme.setTheme('minimal')"
            >
              Minimal
            </button>
            <button
              class="theme-btn"
              [class.active]="theme.isPlayfulTheme()"
              (click)="theme.setTheme('playful')"
            >
              Playful
            </button>
          </div>
        </div>
      </section>

      <!-- Audio Settings -->
      <section class="settings-section">
        <h2>Audio Settings</h2>

        <div class="setting-item">
          <div class="setting-info">
            <label>Text-to-Speech Speed</label>
            <p class="description">Adjust pronunciation speed for learning</p>
          </div>
          <div class="setting-control">
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              [(ngModel)]="settings.ttsSpeed"
              (change)="updateSettings()"
              class="slider"
            />
            <span class="value-display">{{ (settings.ttsSpeed * 100).toFixed(0) }}%</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Audio Volume</label>
            <p class="description">Control volume for audio content and TTS</p>
          </div>
          <div class="setting-control">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              [(ngModel)]="settings.audioVolume"
              (change)="updateSettings()"
              class="slider"
            />
            <span class="value-display">{{ settings.audioVolume }}%</span>
          </div>
        </div>
      </section>

      <!-- Language Settings -->
      <section class="settings-section">
        <h2>Language</h2>

        <div class="setting-item">
          <div class="setting-info">
            <label>UI Language</label>
            <p class="description">Select your preferred interface language</p>
          </div>
          <div class="setting-control">
            <select [(ngModel)]="settings.language" (change)="updateSettings()" class="select">
              <option value="en">English</option>
              <option value="lo">ລາວ (Lao)</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Data Management -->
      <section class="settings-section danger-section">
        <h2>Data & Storage</h2>

        <div class="setting-item">
          <div class="setting-info">
            <label>Storage Usage</label>
            <p class="description" *ngIf="storageInfo">
              {{ (storageInfo.used / 1024 / 1024).toFixed(2) }}MB of
              {{ (storageInfo.quota / 1024 / 1024).toFixed(2) }}MB used
            </p>
          </div>
          <div class="setting-control">
            <button
              class="btn btn-secondary"
              (click)="getStorageInfo()"
            >
              Refresh Storage Info
            </button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Cache Management</label>
            <p class="description">Clear offline cache to free space (data will be redownloaded)</p>
          </div>
          <div class="setting-control">
            <button
              class="btn btn-warning"
              (click)="clearCache()"
            >
              Clear Cache
            </button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Export Progress</label>
            <p class="description">Download your learning data as JSON file</p>
          </div>
          <div class="setting-control">
            <button
              class="btn btn-primary"
              (click)="exportProgress()"
            >
              Export JSON
            </button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Import Progress</label>
            <p class="description">Load previously exported learning data</p>
          </div>
          <div class="setting-control">
            <input
              type="file"
              accept=".json"
              (change)="onFileSelected($event)"
              #fileInput
              style="display: none"
            />
            <button
              class="btn btn-secondary"
              (click)="fileInput.click()"
            >
              Import JSON
            </button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Reset All Data</label>
            <p class="description">⚠️ Permanently delete all progress and settings (cannot be undone)</p>
          </div>
          <div class="setting-control">
            <button
              class="btn btn-danger"
              (click)="resetData()"
            >
              Reset Everything
            </button>
          </div>
        </div>
      </section>

      <!-- App Info -->
      <section class="settings-section">
        <h2>About</h2>

        <div class="info-item">
          <p><strong>App Version:</strong> 1.0.0</p>
          <p><strong>Data Version:</strong> 1.0.0</p>
          <p><strong>Offline Capable:</strong> Yes (PWA)</p>
        </div>
      </section>

      <!-- Status Messages -->
      <div *ngIf="message.text" class="message" [ngClass]="'message-' + message.type">
        {{ message.text }}
      </div>
    </div>
  `,
  styles: [
    `
      .config-container {
        padding: var(--spacing-lg);
        background: var(--page-bg);
        min-height: 100vh;
        color: var(--text-primary);
        max-width: 800px;
        margin: 0 auto;
      }

      .header {
        margin-bottom: var(--spacing-xl);
      }

      .header h1 {
        margin: 0;
        font-size: var(--font-size-2xl);
      }

      .settings-section {
        background: var(--tile-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
      }

      .settings-section h2 {
        margin: 0 0 var(--spacing-md) 0;
        font-size: var(--font-size-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--spacing-lg);
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--border-color-light);
      }

      .setting-item:last-child {
        border-bottom: none;
      }

      .setting-info {
        flex: 1;
      }

      .setting-info label {
        display: block;
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
      }

      .description {
        margin: 0;
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }

      .setting-control {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        min-width: 200px;
      }

      .theme-btn {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--secondary-bg);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-normal);
        font-weight: 500;
      }

      .theme-btn:hover {
        border-color: var(--primary-color);
      }

      .theme-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .slider {
        width: 120px;
        height: 6px;
        cursor: pointer;
      }

      .value-display {
        min-width: 40px;
        text-align: right;
        font-weight: 600;
      }

      .select {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--secondary-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: var(--font-size-base);
        cursor: pointer;
        min-width: 120px;
      }

      .btn {
        padding: var(--spacing-sm) var(--spacing-md);
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: 500;
        transition: all var(--transition-normal);
        font-size: var(--font-size-sm);
      }

      .btn-primary {
        background: var(--primary-color);
        color: white;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .btn-secondary {
        background: var(--secondary-bg);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
      }

      .btn-secondary:hover {
        border-color: var(--primary-color);
      }

      .btn-warning {
        background: #ffa500;
        color: white;
      }

      .btn-warning:hover {
        opacity: 0.9;
      }

      .btn-danger {
        background: #e74c3c;
        color: white;
      }

      .btn-danger:hover {
        opacity: 0.9;
      }

      .danger-section {
        border-color: #e74c3c;
        border-width: 2px;
      }

      .info-item {
        padding: var(--spacing-md) 0;
      }

      .info-item p {
        margin: var(--spacing-sm) 0;
        font-size: var(--font-size-sm);
      }

      .message {
        position: fixed;
        bottom: var(--spacing-lg);
        right: var(--spacing-lg);
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--radius-md);
        animation: slideIn 0.3s ease;
      }

      .message-success {
        background: var(--status-mastered);
        color: white;
      }

      .message-error {
        background: #e74c3c;
        color: white;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @media (max-width: 768px) {
        .config-container {
          padding: var(--spacing-md);
        }

        .setting-item {
          flex-direction: column;
          align-items: flex-start;
        }

        .setting-control {
          width: 100%;
          min-width: auto;
        }

        .slider {
          width: 100%;
        }
      }
    `
  ]
})
export class ConfigComponent implements OnInit {
  settings = {
    theme: 'minimal',
    ttsSpeed: 1,
    audioVolume: 100,
    language: 'en'
  };

  storageInfo: { used: number; quota: number } | null = null;
  message = { text: '', type: '' };

  constructor(
    public theme: ThemeService,
    private progress: ProgressService,
    private pwa: PwaService
  ) {}

  ngOnInit(): void {
    const userSettings = this.progress.userSettings();
    this.settings = { ...this.settings, ...userSettings };
    this.getStorageInfo();
  }

  updateSettings(): void {
    this.progress.updateSettings({
      theme: this.settings.theme as 'minimal' | 'playful',
      ttsSpeed: this.settings.ttsSpeed,
      audioVolume: this.settings.audioVolume,
      language: this.settings.language as 'english' | 'lao'
    });
    this.showMessage('Settings updated', 'success');
  }

  async getStorageInfo(): Promise<void> {
    const info = await this.pwa.getStorageInfo();
    this.storageInfo = {
      used: info.usage,
      quota: info.quota
    };
  }

  async clearCache(): Promise<void> {
    await this.pwa.clearAllCaches();
    this.showMessage('Cache cleared successfully', 'success');
  }

  exportProgress(): void {
    const progressData = this.progress.exportProgress();
    const dataStr = JSON.stringify(progressData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lao-learning-progress-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.showMessage('Progress exported successfully', 'success');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        this.progress.importProgress(data);
        this.showMessage('Progress imported successfully', 'success');
      } catch (error) {
        this.showMessage('Failed to import progress file', 'error');
      }
    };
    reader.readAsText(file);
  }

  resetData(): void {
    if (
      confirm(
        'Are you sure? This will delete all your learning progress and cannot be undone.'
      )
    ) {
      localStorage.removeItem('lao_progress_v1');
      localStorage.removeItem('lao_settings_v1');
      window.location.reload();
    }
  }

  private showMessage(text: string, type: string): void {
    this.message = { text, type };
    setTimeout(() => {
      this.message = { text: '', type: '' };
    }, 3000);
  }
}
