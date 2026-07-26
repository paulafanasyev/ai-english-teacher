Текущий стек: React 18 + Tailwind, темы через `data-theme` (по умолчанию `candy`), готовые утилиты `.card` / `.btn-primary` / `.chip`, шрифт Nunito, богатая геймификация (XP, монеты, стрики). Ниже — 10 конкретных улучшений, готовые токены Tailwind, требования WCAG и структура Figma. Всё реалистично внедряется за 3 месяца силами 1 дизайнера + 1 фронтендера.

## 10 конкретных улучшений

### 1. Система цветовых токенов + тёмная тема
Уйти от одного фиолетового к семантическим токенам (primary / accent / success / warning / danger / surface / ink) на CSS-переменных, с готовой тёмной темой. Это упрощает ребрендинг и контроль контраста (см. Tailwind-конфиг ниже).

### 2. Типографика: пара «дисплей + текст» и модульная шкала
Дисплей — выразительный гротеск (Onest / Manrope) для заголовков, текст — Nunito / Inter для чтения. Флюидная шкала на `clamp()`, чтобы заголовки красиво масштабировались от телефона до десктопа.

### 3. Микро-анимации состояний
Нажатие кнопки `active:scale-[.97]`, лифт карточек `hover:-translate-y-1`, появление контента (fade/slide), пульс стрика, конфетти при level-up, `skeleton` вместо спиннеров. Все — короткие (150–250 мс), с уважением к `prefers-reduced-motion`.

### 4. Мобильная навигация: нижний таб-бар
Заменить боковое меню на мобильных нижним таб-баром под большой палец: 5 пунктов (Главная · Урок · Игры · Экзамены · Ещё) с индикатором активной вкладки и учётом `safe-area`.

### 5. Онбординг за 3 шага до «ага-момента»
Шаг 1 — цель (IELTS / для школы / для ребёнка / просто разговор), Шаг 2 — выбор учителя-аватара, Шаг 3 — микро-урок на 60 секунд с первым XP. Прогресс-точки и «пропустить».

### 6. Пространство и иерархия
Единая шкала отступов (4/8/12/16/24/32), радиусы карт 20–28px, токены теней (elevation-1..3). Контент должен «дышать» — меньше визуального шума, крупнее ключевые действия.

### 7. Полные состояния кнопок + тактильная отдача
Проработать hover / active / focus-visible / disabled / loading. На мобильных — Capacitor Haptics при важных действиях (правильный ответ, покупка в магазине, получение награды).

### 8. Пустые состояния и загрузка
Дружелюбные empty-states с иллюстрацией и одним понятным CTA; skeleton-карточки вместо крутилки; оптимистичные обновления UI (сначала показываем результат, потом синхронизируем).

### 9. Геймификация как визуальный язык
Кольцо прогресса уровня, анимированный огонёк стрика, XP-тост «+15 XP», момент награды (вспышка + падающие монеты). Вынести в единый компонент `RewardToast`, вызывать из уроков/игр/экзаменов.

### 10. Доступность, встроенная в дизайн
Контраст ≥ 4.5:1, видимый focus-ring, hit-target ≥ 44×44px, поддержка reduced-motion, корректные роли и aria. A11y не «в конце», а часть системы токенов и компонентов.

## Готовый Tailwind-конфиг (tailwind.config.js — extend)
```js
// расширение темы: токены цветов, шрифты, радиусы, тени, анимации
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#7c3aed', 600: '#7c3aed', 700: '#6d28d9' },
        accent:   { DEFAULT: '#d946ef' },
        success: '#10b981', warning: '#f59e0b', danger: '#f43f5e', sky: '#0ea5e9',
        surface:  'rgb(var(--surface) / <alpha-value>)',
        ink:      'rgb(var(--ink) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Onest', 'Nunito', 'system-ui', 'sans-serif'],
        sans:    ['Nunito', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'fluid-h1': ['clamp(1.9rem,5vw,3rem)', { lineHeight: '1.05', fontWeight: '800' }],
        'fluid-h2': ['clamp(1.4rem,3vw,2rem)',  { lineHeight: '1.1',  fontWeight: '800' }],
      },
      borderRadius: { xl: '16px', '2xl': '20px', '3xl': '28px' },
      boxShadow: {
        e1: '0 1px 3px rgba(20,10,50,.06)',
        e2: '0 8px 24px rgba(80,40,160,.10)',
        e3: '0 20px 48px rgba(80,40,160,.16)',
      },
      keyframes: {
        pop:     { '0%': { transform: 'scale(.8)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        floaty:  { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        pop: 'pop .25s ease-out',
        floaty: 'floaty 3s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
};
```

## Токены на CSS-переменных (styles.css)
```css
:root { --surface: 255 255 255; --ink: 15 18 34; }
[data-theme="dark"] { --surface: 20 18 34; --ink: 236 233 248; }

/* уважение к настройке «уменьшить движение» */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    transition-duration: .001ms !important;
  }
}
```

## Ключевые компоненты — готовые классы
```html
<!-- Кнопка со всеми состояниями -->
<button class="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-white
  shadow-e2 transition active:scale-[.97] hover:-translate-y-0.5
  focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40
  disabled:opacity-50 disabled:pointer-events-none">
  Начать урок
</button>

<!-- Нижний таб-бар (мобильный) -->
<nav class="fixed bottom-0 inset-x-0 z-40 flex justify-around border-t border-black/5
  bg-surface/90 backdrop-blur px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
  <a aria-current="page" class="flex flex-col items-center gap-0.5 py-2 min-w-[56px]
     text-xs font-bold text-ink/50 aria-[current=page]:text-primary">
    <span class="text-xl">🏠</span>Главная
  </a>
  <!-- ...ещё 4 пункта... -->
</nav>

<!-- Skeleton-загрузка -->
<div class="relative overflow-hidden rounded-2xl bg-black/5 h-24">
  <div class="absolute inset-0 -translate-x-full animate-shimmer
     bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
</div>
```

## Доступность (WCAG 2.1 AA) — чек-лист
- Контраст текста ≥ 4.5:1 (крупный ≥ 3:1). Отдельно проверить фиолетовый на белом и в тёмной теме.
- Видимый `focus-visible` ring на всех интерактивных элементах.
- Цель нажатия ≥ 44×44px (особенно таб-бар и иконки-кнопки).
- Не передавать смысл только цветом: у «верно/неверно» — иконка + текст, не только зелёный/красный.
- Все аватары/картинки — `alt`; кнопки-иконки — `aria-label`.
- Поддержка `prefers-reduced-motion` (отключать floaty/конфетти/шиммер).
- Логичный порядок фокуса; модалки с focus-trap и закрытием по `Esc`.
- Формы: связка `label` + сообщение об ошибке, `aria-invalid` на невалидных полях.
- Атрибут `lang` для контента на RU/EN/VI.

## Структура Figma-файла для дизайнера
```text
📁 AI Teacher — Design System
├─ 00 Cover
├─ 01 Foundations
│   ├─ Colors (токены + light/dark)
│   ├─ Typography (шкала, стили текста)
│   ├─ Spacing · Radius · Elevation
│   └─ Iconography / Emoji set
├─ 02 Components
│   ├─ Buttons (все состояния как variants)
│   ├─ Cards · Chips · Inputs · Selects
│   ├─ Avatar (4 эмоции) + SpeechBubble
│   ├─ Nav (desktop sidebar + mobile tab-bar)
│   └─ Gamification (XP toast · streak · progress ring · reward)
├─ 03 Screens — Mobile
│   ├─ Onboarding (3 шага)
│   ├─ Home · Lesson · Talk · Games
│   ├─ Exams (IELTS/TOEFL) · Courses · Diary
│   └─ Empty & Loading states
├─ 04 Screens — Cabinets (teacher / parent / admin)
├─ 05 Prototype (flows: онбординг · урок · покупка)
└─ 06 Handoff (specs · redlines · экспорт)
```
Практика: компоненты — на auto-layout + variants; токены — через Figma Variables (light/dark); имена токенов совпадают с Tailwind, чтобы дизайн ложился в код 1:1.
