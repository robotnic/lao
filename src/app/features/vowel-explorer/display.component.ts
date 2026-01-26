import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonDataProviderService } from '../../core/services/json-data-provider.service';
import { AudioService } from '../../core/services/audio.service';

interface VowelEntry {
  id: string;
  lao: string;
  name: string;
  type: string;
  vowel_length?: string;
  sounds?: {
    sound_vowel?: string;
    ipa?: string;
  };
  mnemonic: string;
  level_id: string;
  audio_key: string;
}

@Component({
  selector: 'app-vowel-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="vowel-container">
      <h1>Lao Vowels</h1>
      <p class="subtitle">Click on any vowel to hear its pronunciation</p>
      
      <!-- Filter tabs -->
      <div class="filter-tabs">
        @for (tab of filterTabs; track tab) {
          <button 
            [class.active]="activeFilter === tab"
            (click)="activeFilter = tab; updateFilteredVowels()"
            class="tab-btn">
            {{ tab }}
          </button>
        }
      </div>

      <!-- Vowel grid -->
      <div class="vowel-grid">
        @for (vowel of filteredVowels; track vowel.id) {
          <div 
            class="vowel-card"
            (click)="playVowelSound(vowel)"
            [class.playing]="playingId === vowel.id">
          
            <div class="vowel-lao">{{ vowel.lao }}</div>
            <div class="vowel-name">{{ vowel.name }}</div>
            
            <div class="vowel-info">
              @if (vowel.sounds && vowel.sounds.ipa) {
                <div class="ipa">
                  IPA: {{ vowel.sounds.ipa }}
                </div>
              }
              @if (vowel.vowel_length) {
                <div class="vowel-length">
                  ({{ vowel.vowel_length }})
                </div>
              }
            </div>

            <div class="mnemonic">{{ vowel.mnemonic }}</div>
            
            <div class="play-btn">
              @if (playingId === vowel.id) {
                <span class="playing-indicator">🔊</span>
              } @else {
                <span class="play-icon">▶</span>
              }
            </div>
          </div>
        }
      </div>

      @if (filteredVowels.length === 0) {
        <div class="no-results">
          No vowels found in this category.
        </div>
      }
    </div>
  `,
  styles: [`
    .vowel-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
    }

    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }

    .filter-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .tab-btn {
      padding: 10px 20px;
      border: 2px solid #ddd;
      background: white;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .tab-btn:hover {
      border-color: #4CAF50;
      color: #4CAF50;
    }

    .tab-btn.active {
      background: #4CAF50;
      color: white;
      border-color: #4CAF50;
    }

    .vowel-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      gap: 16px;
      margin-bottom: 30px;
    }

    .vowel-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 240px;
      overflow: hidden;
    }

    .vowel-card:hover {
      border-color: #4CAF50;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
      transform: translateY(-4px);
    }

    .vowel-card.playing {
      background: #f0f8f0;
      border-color: #4CAF50;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }

    .vowel-lao {
      font-size: 42px;
      font-weight: bold;
      color: #333;
      margin-bottom: 6px;
      min-height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      word-break: break-word;
      line-height: 1.2;
    }

    .vowel-name {
      font-size: 13px;
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
      line-height: 1.3;
      min-height: 32px;
    }

    .vowel-info {
      font-size: 11px;
      color: #666;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .ipa {
      font-family: 'Arial', sans-serif;
      font-style: italic;
      margin-bottom: 3px;
    }

    .vowel-length {
      font-size: 10px;
      color: #999;
    }

    .mnemonic {
      font-size: 11px;
      color: #888;
      font-style: italic;
      margin-bottom: 8px;
      min-height: auto;
      line-height: 1.3;
    }

    .play-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      padding: 8px;
      border-radius: 8px;
      background: #f5f5f5;
      transition: all 0.3s ease;
    }

    .vowel-card:hover .play-btn {
      background: #4CAF50;
      color: white;
    }

    .vowel-card.playing .play-btn {
      background: #4CAF50;
      color: white;
    }

    .play-icon {
      display: inline-block;
    }

    .playing-indicator {
      display: inline-block;
      animation: pulse 0.6s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .no-results {
      text-align: center;
      color: #999;
      padding: 40px 20px;
      font-size: 16px;
    }

    @media (max-width: 768px) {
      .vowel-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
      }

      .vowel-lao {
        font-size: 32px;
        min-height: 40px;
        margin-bottom: 4px;
      }

      .vowel-name {
        font-size: 12px;
        margin-bottom: 4px;
        min-height: 28px;
      }

      .vowel-card {
        padding: 10px;
        min-height: 200px;
      }
    }

    @media (max-width: 480px) {
      .vowel-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 10px;
      }

      .vowel-lao {
        font-size: 28px;
        min-height: 35px;
      }

      .vowel-name {
        font-size: 11px;
        min-height: 24px;
      }

      .vowel-info {
        font-size: 10px;
      }

      .mnemonic {
        font-size: 10px;
      }

      .vowel-card {
        padding: 8px;
        min-height: 180px;
        gap: 4px;
      }
    }
  `]
})
export class VowelDisplayComponent implements OnInit {
  private dataProvider = inject(JsonDataProviderService);
  private audioService = inject(AudioService);

  allVowels: VowelEntry[] = [];
  filteredVowels: VowelEntry[] = [];
  activeFilter = 'All';
  playingId: string | null = null;

  filterTabs = ['All', 'Individual Vowels', 'Diphthongs', 'Short', 'Long'];

  ngOnInit(): void {
    this.loadVowels();
  }

  loadVowels(): void {
    // Access alphabet via the signal
    const alphabet = this.dataProvider.alphabet();
    
    // Filter only vowel-related entries (vowels and diphthongs)
    this.allVowels = alphabet.filter((item: any) => 
      item.type === 'vowel' || item.type === 'diphthong' || item.type === 'special_vowel'
    ) as VowelEntry[];
    
    this.updateFilteredVowels();
  }

  updateFilteredVowels(): void {
    switch (this.activeFilter) {
      case 'Individual Vowels':
        this.filteredVowels = this.allVowels.filter(v => 
          v.type === 'vowel' && v.vowel_length !== 'long' && !v.name.includes('Pair')
        );
        break;
      case 'Diphthongs':
        this.filteredVowels = this.allVowels.filter(v => v.type === 'diphthong');
        break;
      case 'Short':
        this.filteredVowels = this.allVowels.filter(v => v.vowel_length === 'short');
        break;
      case 'Long':
        this.filteredVowels = this.allVowels.filter(v => v.vowel_length === 'long');
        break;
      default: // 'All'
        this.filteredVowels = this.allVowels;
    }
  }

  playVowelSound(vowel: VowelEntry): void {
    this.playingId = vowel.id;
    this.audioService.playAudio(vowel.audio_key, vowel.lao, 'lo-LA');
    
    // Reset playing indicator after audio finishes (estimate ~3 seconds)
    setTimeout(() => {
      if (this.playingId === vowel.id) {
        this.playingId = null;
      }
    }, 3000);
  }
}
