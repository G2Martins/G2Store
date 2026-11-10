import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Inline SVG icons: lucide-style strokes + simple-icons brand marks (compatibility hints only).
const STROKE: Record<string, string[]> = {
  search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'm21 21-4.3-4.3'],
  bag: ['M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z', 'M3 6h18', 'M16 10a4 4 0 0 1-8 0'],
  heart: ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'],
  package: ['m7.5 4.27 9 5.15', 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'm3.3 7 8.7 5 8.7-5', 'M12 22V12'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  'arrow-right': ['M5 12h14', 'm12 5 7 7-7 7'],
  'arrow-up-right': ['M7 7h10v10', 'M7 17 17 7'],
  play: ['M6 3l14 9-14 9V3z'],
  check: ['M20 6 9 17l-5-5'],
  copy: ['M8 8h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z', 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'],
  trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'],
  plus: ['M5 12h14', 'M12 5v14'],
  minus: ['M5 12h14'],
  sliders: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M2 14h4', 'M10 8h4', 'M18 16h4'],
  tag: ['M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z', 'M7.5 7.5h.01'],
  gift: ['M3 8h18v4H3z', 'M12 8v13', 'M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7', 'M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5'],
  gamepad: ['M6 11h4', 'M8 9v4', 'M15 12h.01', 'M18 10h.01', 'M17.32 5H6.68a4 4 0 0 0-3.98 3.59l-.6 6.05A3 3 0 0 0 5.08 18c.97 0 1.86-.53 2.32-1.39L8.5 15h7l1.1 1.61A2.64 2.64 0 0 0 18.92 18a3 3 0 0 0 2.98-3.36l-.6-6.05A4 4 0 0 0 17.32 5z'],
  clock: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 6v6l4 2'],
  truck: ['M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2', 'M15 18H9', 'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14', 'M7 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', 'M17 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'],
  shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4'],
  info: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 16v-4', 'M12 8h.01'],
  zap: ['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z'],
  monitor: ['M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8 21h8', 'M12 17v4'],
  key: ['m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4', 'm21 2-9.6 9.6', 'M7.5 10a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z'],
};

// Brand marks live in styles.css (.bi-*) as CSS masks.
const BRANDS = new Set(['steam', 'playstation', 'xbox', 'nintendo', 'github']);

/** Platform family -> brand mark. PC keys are Steam keys. */
export const FAMILY_ICON = { pc: 'steam', playstation: 'playstation', xbox: 'xbox', nintendo: 'nintendo' } as const;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    @if (brand()) {
      <span class="bi" [class]="'bi-' + name()" [style.width.px]="size()" [style.height.px]="size()"></span>
    } @else {
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor"
           stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        @for (d of stroke(); track $index) { <path [attr.d]="d" /> }
      </svg>
    }
  `,
})
export class Icon {
  name = input.required<string>();
  size = input(18);
  protected brand = computed(() => BRANDS.has(this.name()));
  protected stroke = computed(() => STROKE[this.name()] ?? []);
}

/** The G2Store mark: a lime tile with a "G" and a superscript "2". Original artwork. */
@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 32 32" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="8.5" fill="#c8f53c" />
      <path d="M19.6 11.4a6.6 6.6 0 1 0 1 7.1h-5.4" fill="none" stroke="#060a24" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M22.2 6.9c.3-1 1.1-1.5 2-1.5 1.1 0 1.9.8 1.9 1.8 0 1.5-2 2.4-3.9 4.3h4" fill="none" stroke="#060a24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
})
export class Brand {
  size = input(30);
}
