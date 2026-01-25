import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./core/shell/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'progress',
    loadComponent: () => import('./core/shell/progress.component').then(m => m.ProgressComponent)
  },
  {
    path: 'config',
    loadComponent: () => import('./core/shell/config.component').then(m => m.ConfigComponent)
  },
  {
    path: 'alphabet-explorer',
    loadComponent: () => import('./features/alphabet-explorer/discovery.component').then(m => m.AlphabetDiscoveryComponent)
  },
  {
    path: 'alphabet-quiz',
    loadComponent: () => import('./features/alphabet-explorer/quiz.component').then(m => m.AlphabetQuizComponent)
  },
  {
    path: 'vocabulary-quiz',
    loadComponent: () => import('./features/vocabulary/quiz.component').then(m => m.VocabularyQuizComponent)
  },
  {
    path: 'tone-matcher',
    loadComponent: () => import('./features/tone-matcher/quiz.component').then(m => m.ToneMatcherComponent)
  },
  {
    path: 'phrase-builder',
    loadComponent: () => import('./features/phrase-builder/builder.component').then(m => m.PhraseBuilderComponent)
  },
  {
    path: 'character-scramble',
    loadComponent: () => import('./features/character-scramble/quiz.component').then(m => m.CharacterScrambleComponent)
  },
  {
    path: 'listening-comprehension',
    loadComponent: () => import('./features/listening-comprehension/quiz.component').then(m => m.ListeningComprehensionComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

