# Gym App

An Android (Flutter) gym-management app, a React web admin panel, and a
Node/TypeScript REST backend shared by both.

This covers **auth → member dashboard → membership (with real Razorpay
payments) → workout plans → class booking → diet & nutrition → admin
panel**. Still not built: trainer booking UI in the member app (the API
exists), attendance/QR check-in, challenges/rewards, community, push
notifications, and coupon management.

## Structure

- `backend/` — Node.js + Express + TypeScript REST API, PostgreSQL via Prisma. Serves both the app and the admin panel.
- `app/` — Flutter app (Android now; iOS buildable later from the same code).
- `admin/` — React + Vite + TypeScript web admin panel (staff-only).

## Backend setup

```bash
cd backend
npm install
cp .env.example .env   # then edit DATABASE_URL and RAZORPAY_* with real credentials
npx prisma db push      # or `prisma migrate dev` if your DB user has CREATEDB
npm run seed             # demo plans, exercises, programs, a trainer, classes, an admin user
npm run dev               # http://localhost:4000
```

`GET /health` should return `{"status":"ok"}` once it's running.

The seed creates an admin login: **admin@gymapp.com / Admin123!**

### Things intentionally stubbed for now

- **OTP delivery** — no SMS/email provider is wired up. In dev, OTP codes are
  logged to the console and also returned in the API response
  (`devOtp`/`devToken` fields) so the flow is testable end-to-end. Wire a
  real provider (Twilio, SendGrid, etc.) and stop returning codes in
  responses before shipping.
- **Google / Apple sign-in** — `POST /api/auth/social` exists and issues real
  JWTs, but it trusts a caller-supplied email instead of verifying a real
  Google/Apple ID token. Add `google-auth-library` / `apple-signin-auth`
  verification once you have OAuth client credentials.
- **Push notifications** — not implemented; would need Firebase Cloud
  Messaging (or similar) wired into both the backend and the Flutter app.
- **Coupon management** — no coupon/discount model exists yet.
- **Attendance / QR check-in** — no attendance tracking exists yet, so the
  admin panel has no attendance reports.

### Payments (Razorpay, test mode)

`POST /api/membership/order` creates a pending Payment + Razorpay order;
`POST /api/membership/verify` checks the HMAC signature Razorpay returns and
only then activates/renews/upgrades the membership. Swap the
`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` in `.env` for live keys when ready to
accept real payments.

## Flutter app setup

Requires the Flutter SDK and an Android toolchain (Android Studio or just
the command-line SDK + accepted licenses via `flutter doctor
--android-licenses`).

```bash
cd app
flutter pub get
flutter run   # pick an Android emulator or connected device
```

The app talks to `http://10.0.2.2:4000/api` by default when running on the
Android emulator (which maps to the host machine's `localhost:4000`). To
point at a different backend (e.g. a physical device on your LAN, or a
deployed server):

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.23:4000/api
```

**Note:** if you edit source and rebuild while an old build is still running
on the device, `adb install -r` replaces the APK on disk but does **not**
restart an already-running process — it'll keep executing the old code in
memory. Force-stop the app (or fully swipe it away) before relaunching after
a reinstall.

### What's implemented

- **Auth**: sign up, email/password login, OTP verification, forgot/reset
  password. Social login buttons are present but explain they need OAuth
  setup rather than faking a login.
- **Member dashboard**: membership status, upcoming classes, weekly workout
  summary + chart, today's goal progress rings, quick access to nutrition.
- **Membership**: browse plans, buy/renew/upgrade via real Razorpay
  Checkout (test mode), history, digital membership card with QR code.
- **Workout plans**: browse programs by level, exercise library, build a
  personalized plan, log completed sets, rest timer.
- **Class booking**: browse/filter upcoming classes (Yoga, Zumba, HIIT,
  CrossFit, Pilates, Spin), book, view/cancel your bookings.
- **Diet & Nutrition**: calorie/macro tracking with a meal catalog, BMI
  calculator, TDEE/calorie calculator, water intake tracker, nutrition tips.
- **Navigation drawer**: full site map reachable from every main tab.
- **Profile**: view account, log out.

### Building a release APK

```bash
flutter build apk --release
```

Output lands in `app/build/app/outputs/flutter-apk/app-release.apk`.

## Admin panel setup

```bash
cd admin
npm install
cp .env.example .env   # points at the backend; edit if it's not on localhost:4000
npm run dev              # http://localhost:5173
```

Log in with the seeded admin account (**admin@gymapp.com / Admin123!**) —
only users with the `ADMIN` role can sign in here; the backend also
rejects non-admin tokens on every `/api/admin/*` route.

### What's implemented

- **Dashboard**: total members, active memberships, trainers, new members
  this month, upcoming classes, monthly/all-time revenue.
- **Member management**: search, view membership/payment history, change a
  member's role.
- **Trainer management**: promote an existing member to trainer (bio,
  specialties, rate), remove trainers.
- **Membership plans**: create/edit plans, archive (soft-delete) old ones.
- **Class scheduling**: create classes, assign a trainer, add/remove time
  slots, see booking counts.
- **Payments & revenue reports**: recent transactions table, revenue by
  month (bar chart) and by plan (pie chart).

Not built: attendance reports (no attendance data exists), push
notifications, and coupon management.

### Building for production

```bash
cd admin
npm run build
```

Output lands in `admin/dist/` — deploy it as a static site pointed at your
production backend via `VITE_API_BASE_URL`.
