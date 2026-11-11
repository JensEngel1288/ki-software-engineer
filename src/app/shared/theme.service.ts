import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly selectedTheme = signal<Theme>('light');
  private readonly storageKey = 'bookmonkey-theme';
  private initialized = false;

  readonly isDark = computed(() => this.selectedTheme() === 'dark');

  initialize(): void {
    if (this.initialized) {
      return;
    }
    let savedTheme: string | null = null;
    try {
      savedTheme = this.document.defaultView?.localStorage.getItem(this.storageKey) ?? null;
    } catch {
      // Storage can be disabled; the system preference remains available.
    }
    const prefersDark = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
    this.applyTheme(savedTheme === 'dark' || (savedTheme !== 'light' && prefersDark) ? 'dark' : 'light');
    this.initialized = true;
  }

  toggle(): void {
    const theme = this.isDark() ? 'light' : 'dark';
    this.applyTheme(theme);
    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, theme);
    } catch {
      // Switching remains usable when the preference cannot be persisted.
    }
  }

  private applyTheme(theme: Theme): void {
    this.document.documentElement.classList.toggle('dark', theme === 'dark');
    this.selectedTheme.set(theme);
  }
}
