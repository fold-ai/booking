# Fieldbase Crew — iOS companion app (Supabase v0.3)

SwiftUI застосунок для **field crew** — твоїх працівників у машині. Логіниться тим самим email/паролем що й веб, бачить сьогоднішні роботи призначені йому, тапає роботу для деталей і навігації, відмічає **In progress / Done** і пише нотатки.

**Бекенд:** Supabase Postgres + Supabase Auth — те саме що й web. Дані синхронізуються в обидва боки в реальному часі.

## Архітектура

- **SwiftUI** + `@Observable` для стану
- **supabase-swift** SDK для Auth і queries
- **MapKit** для "Open in Maps" з адреси
- **iOS 17+** target

Той самий Postgres что й веб:
- `businesses` — твій бізнес
- `workers` — з полем `user_id` що пов'язує з Supabase auth user
- `bookings` — з масивом `worker_ids` для multi-worker jobs
- `clients`, `services` — нормалізовані таблиці

## Файли

```
ios/
├─ Package.swift                    ← supabase-swift dependency
├─ README.md                        ← цей файл
└─ Sources/FieldbaseCrew/
   ├─ FieldbaseCrewApp.swift        ← @main, без Firebase init
   ├─ AppState.swift                ← @Observable, auth state listener
   ├─ SupabaseClientProvider.swift  ← singleton, читає Info.plist
   ├─ Theme.swift                   ← кольори
   ├─ Models/
   │  ├─ Booking.swift              ← snake_case ↔ camelCase через CodingKeys
   │  ├─ Client.swift
   │  └─ Worker.swift               ← містить user_id
   ├─ Services/
   │  ├─ AuthService.swift          ← Supabase Auth wrapper
   │  └─ SupabaseService.swift      ← queries (workers, bookings, clients, updates)
   └─ Views/
      ├─ LoginView.swift
      ├─ TodayView.swift            ← список сьогоднішніх робіт
      ├─ JobDetailView.swift
      └─ Components/
         ├─ JobRow.swift
         └─ StatusBadge.swift
```

## Setup (одноразово, на Mac)

Потрібно: **Mac з Xcode 15+**.

### 1. Створи Xcode проєкт

В Xcode:

1. **File → New → Project → iOS → App**
2. Назва: `FieldbaseCrew`, Interface: **SwiftUI**, Language: **Swift**, Storage: **None**
3. Видали стандартний `ContentView.swift` і `*App.swift`
4. Перетягни всі файли з `Sources/FieldbaseCrew/` у Xcode (обери **Copy items if needed** + **Create groups**)

### 2. Додай Supabase SDK

В Xcode:

1. **File → Add Package Dependencies…**
2. URL: `https://github.com/supabase/supabase-swift`
3. Додай продукт **Supabase** до target `FieldbaseCrew`

### 3. Додай Supabase credentials у Info.plist

Відкрий `Info.plist` (або в Build Settings — Info tab):

1. Додай новий key `SUPABASE_URL` (String) — значення `https://YOUR_PROJECT.supabase.co`
2. Додай новий key `SUPABASE_ANON_KEY` (String) — значення твого publishable / anon key

(Це ті самі значення що й у Vercel: `VITE_SUPABASE_URL` і `VITE_SUPABASE_ANON_KEY`.)

### 4. Створи worker запис для свого тестового юзера

Перш ніж зайти в iOS застосунок, треба щоб у `workers` таблиці був рядок з `user_id` що відповідає твоєму Supabase auth user. Інакше після логіну застосунок не покаже жодних робіт ("Clear day").

**Швидкий спосіб через SQL Editor:**

```sql
-- 1. Знайди свій user_id (запусти і скопіюй id для свого email)
select id, email from auth.users;

-- 2. Знайди business_id (твоя компанія)
select id, name from public.businesses;

-- 3. Створи worker рядок (підстав свої id)
insert into public.workers (business_id, user_id, name, email, role)
values (
  'YOUR_BUSINESS_ID',
  'YOUR_USER_ID',
  'Захар',
  'bernykzahar@gmail.com',
  'Owner'
);
```

Або через **Table Editor** — відкрий `workers`, натисни **Insert row** і заповни ті ж поля.

### 5. Запусти в симуляторі

Хіт ▶ з вибраним iPhone simulator. Залогінься тим самим email/паролем що й на веб. Має побачити свої сьогоднішні bookings (якщо їх немає — створи кілька на web).

### 6. Запусти на справжньому iPhone

1. Підключи iPhone через USB
2. Xcode → **Signing & Capabilities** → встав свій Apple ID як Team (free tier OK)
3. Вибери свій iPhone як build target → ▶

Безкоштовний Apple ID працює для особистого використання, але білд зникає через 7 днів. Для App Store — потрібен платний Apple Developer Program ($99/рік).

## Як це працює з web (sync)

- Один Postgres у Supabase = єдине джерело правди
- iOS використовує ті ж RLS правила що й web — worker бачить тільки свої роботи (через `user_id` → `workers` → `worker_ids` у `bookings`)
- Коли worker натискає **Mark Done** на iPhone, статус оновлюється в Postgres і миттєво з'являється на web admin сторінці
- Коли admin створює нове бронювання на web — worker побачить його на iPhone після **Pull-to-refresh** (повна real-time синхронізація через `realtime.channel` — наступний крок)

## Deploy в App Store

1. **Apple Developer Program** — $99/рік на https://developer.apple.com/programs
2. **App Store Connect** — створи listing на https://appstoreconnect.apple.com
3. В Xcode: **Product → Archive** → upload до App Store Connect
4. Submit for review (1–3 дні)

Знадобиться:
- App icon (1024×1024 PNG, без прозорості)
- Скріншоти для хоча б одного розміру (6.7" iPhone)
- Privacy policy URL
- Опис + ключові слова
- **Demo акаунт для review-ера** (App Store не приймає застосунки що вимагають логін без demo credentials)

## Що зараз НЕ робить (intentionally)

- Admin дії (створення бронювань, редагування клієнтів) — залишаються на web
- Offline mode — Supabase SDK не кешує між сеансами автоматично
- Фото при завершенні роботи — легко додати через `PhotosPicker` + Storage
- Push сповіщення — потребує APNs cert + Edge Function
- Real-time push нових bookings без pull-to-refresh — додається через `client.channel("bookings")` listen
