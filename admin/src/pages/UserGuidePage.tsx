import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Step {
  title: string
  body: string
}

interface GuideSection {
  id: string
  icon: string
  title: string
  intro: string
  steps: Step[]
}

const ADMIN_WEB_SECTIONS: GuideSection[] = [
  {
    id: 'admin-dashboard',
    icon: '📊',
    title: 'Dashboard',
    intro: 'The first thing you see after logging in — a snapshot of the whole gym.',
    steps: [
      { title: 'Stat cards', body: 'Total Members, Active Memberships, Upcoming Classes and Monthly Revenue at a glance.' },
      { title: 'New Signups chart', body: 'Shows member sign-ups over the last 14 days.' },
      { title: 'Membership Status', body: 'A breakdown of Active / Expired / Pending / Cancelled memberships.' },
      { title: 'Recent Payments & Today’s Schedule', body: 'The latest successful payments and any classes scheduled for today.' },
      { title: 'Recent Members & Top Trainers', body: 'Newest sign-ups, and trainers ranked by how many members they’re coaching.' },
      { title: 'Needs Attention', body: 'Quick links to memberships expiring soon and payments still pending.' },
    ],
  },
  {
    id: 'admin-members',
    icon: '👥',
    title: 'Members',
    intro: 'Search, filter, and manage every member, trainer and admin account.',
    steps: [
      { title: 'Search', body: 'Type a name or email in the search box at the top of the page.' },
      { title: 'Filter', body: 'Use the Role dropdown (Member/Trainer/Admin) and the Membership Status dropdown (Active/Expired/Pending/Cancelled/No membership) to narrow the list.' },
      { title: 'Bulk actions', body: 'Tick the checkbox on any row (or the header checkbox to select all) to select multiple people, then use “Delete Selected” in the bar that appears. You’ll be asked to confirm before anything is deleted.' },
      { title: 'Full profile', body: 'Click a member’s name to open their full profile: role and assigned-trainer editors, membership history, recent payments, a 7-day water intake chart, every diet plan assigned to them, and their trainer report (assignment notes + PT session history).' },
    ],
  },
  {
    id: 'admin-trainers',
    icon: '🏋️',
    title: 'Trainers',
    intro: 'Manage your coaching staff.',
    steps: [
      { title: 'Add a trainer', body: 'Create a brand-new trainer account, or convert an existing member into a trainer.' },
      { title: 'Trainer profile', body: 'Click a trainer to see their personal & professional info, performance stats, assigned members, and weekly availability/holiday schedule.' },
      { title: 'Assign members', body: 'From a trainer’s profile, search for a member and assign them a training type, schedule and start date.' },
    ],
  },
  {
    id: 'admin-plans',
    icon: '🎫',
    title: 'Membership Plans',
    intro: 'Define the plans members can purchase (e.g. 1 Month, 3 Months, 1 Year).',
    steps: [
      { title: 'Create a plan', body: 'Set a name, duration in days, price, and a list of perks members will see.' },
      { title: 'Edit or deactivate', body: 'Update pricing any time, or deactivate a plan so it stops showing up for new purchases without deleting its history.' },
    ],
  },
  {
    id: 'admin-classes',
    icon: '🗓️',
    title: 'Classes',
    intro: 'Set up group classes like Yoga, HIIT or Zumba and schedule sessions.',
    steps: [
      { title: 'Create a class', body: 'Give it a name, type, capacity, duration and an assigned trainer.' },
      { title: 'Schedule a session', body: 'Pick a class and add a specific date/time — that’s what members will see and book in the mobile app.' },
    ],
  },
  {
    id: 'admin-diet',
    icon: '🥗',
    title: 'Diet Plans & Food Library',
    intro: 'Build a shared library of foods, then assemble diet plans for individual members.',
    steps: [
      { title: 'Food Library', body: 'Add food items with calories, carbs, protein and fat — these are reused across every diet plan.' },
      { title: 'Diet Plans', body: 'Pick a member, name the plan, optionally set a daily water target and supplements, then build out meals per day of the week from the food library.' },
    ],
  },
  {
    id: 'admin-payments',
    icon: '💳',
    title: 'Payments, Revenue & Dues',
    intro: 'Track money coming in and who still owes for a renewal.',
    steps: [
      { title: 'Payments & Revenue', body: 'See every payment with status, amount, method and member.' },
      { title: 'Dues & Renewals', body: 'Two lists: memberships expiring in the next 7 days, and memberships already overdue for renewal.' },
    ],
  },
  {
    id: 'admin-settings',
    icon: '🎨',
    title: 'Settings — Branding',
    intro: 'Customize how the login page looks for your whole team.',
    steps: [
      { title: 'Logo', body: 'Upload a square logo — it shows on the login page and in the sidebar.' },
      { title: 'Login background', body: 'Upload a landscape photo for the left panel of the login page.' },
      { title: 'Title & description', body: 'Replace the default “Gym Fit” name and tagline with your own gym’s branding.' },
    ],
  },
]

const TRAINER_WEB_SECTIONS: GuideSection[] = [
  {
    id: 'trainer-dashboard',
    icon: '📊',
    title: 'Dashboard',
    intro: 'Everything a trainer needs for the day, in one screen.',
    steps: [
      { title: 'Stat cards', body: 'Assigned members, today’s and upcoming sessions, pending workout plans, unread messages, and your average rating.' },
      { title: 'Quick Actions', body: 'One-tap shortcuts to add a workout or diet plan, schedule a session, chat with members, or download your members report as CSV.' },
      { title: 'Schedule', body: 'Switch between Today / Tomorrow / This Week to see your upcoming sessions with each member.' },
    ],
  },
  {
    id: 'trainer-members',
    icon: '👥',
    title: 'My Members',
    intro: 'The members currently assigned to you.',
    steps: [
      { title: 'Member profile', body: 'Click a member to see their details, progress, and history with you as their trainer.' },
    ],
  },
  {
    id: 'trainer-plans',
    icon: '🥗',
    title: 'Workout & Diet Plans',
    intro: 'Build training programs and meal plans for your assigned members.',
    steps: [
      { title: 'Workout Plans', body: 'Assemble exercises into a structured program for a member.' },
      { title: 'Diet Plans', body: 'Same builder as the admin panel, scoped to your own members.' },
    ],
  },
  {
    id: 'trainer-comms',
    icon: '💬',
    title: 'Messages & Notifications',
    intro: 'Stay in touch with your members.',
    steps: [
      { title: 'Messages', body: 'Chat directly with any member assigned to you.' },
      { title: 'Notifications', body: 'See alerts about bookings, cancellations and reminders.' },
    ],
  },
]

interface MobileFeature {
  icon: string
  title: string
  body: string
}

const MOBILE_MEMBER: MobileFeature[] = [
  { icon: '🏠', title: 'Dashboard', body: 'Your weekly workout count, calories logged today, active time, membership status, and quick links to everything else.' },
  { icon: '🎫', title: 'Membership', body: 'View your membership card, purchase or renew a plan, and see your full membership history.' },
  { icon: '🏋️', title: 'Workouts', body: 'Browse workout programs by level, explore the exercise library, or build your own plan.' },
  { icon: '🗓️', title: 'Classes', body: 'Browse group classes (Yoga, HIIT, Zumba, etc.) by type and book a spot in an upcoming session.' },
  { icon: '🧑‍🏫', title: 'Trainers', body: 'Browse available trainers and book a personal training session directly from your phone.' },
  { icon: '🥗', title: 'Nutrition', body: 'Track water intake with reminders, log meals, view any diet plan your trainer has assigned you, and use the BMI/calorie calculators.' },
  { icon: '💬', title: 'Messages', body: 'Chat with your assigned trainer.' },
  { icon: '☰', title: 'Menu', body: 'Tap the hamburger icon (top-left) for the full site map with collapsible sections.' },
]

const MOBILE_TRAINER: MobileFeature[] = [
  { icon: '🏠', title: 'Dashboard', body: 'Assigned members, today’s sessions, and quick stats for your coaching load.' },
  { icon: '👥', title: 'My Members', body: 'Tap any member to see their profile — including a read-only view of their water intake progress.' },
  { icon: '📅', title: 'Sessions', body: 'Your upcoming personal-training bookings.' },
  { icon: '🥗', title: 'Diet Plans', body: 'Create and manage diet plans for your members, right from your phone.' },
  { icon: '💧', title: 'Water Intake', body: 'Your own personal hydration tracker with reminders — separate from the water tracking you view for your members.' },
  { icon: '🔔', title: 'Notifications', body: 'Alerts for new bookings, cancellations, and messages.' },
]

const MOBILE_ADMIN: MobileFeature[] = [
  { icon: '🏠', title: 'Dashboard', body: 'Gym-wide stats at a glance, right on your phone.' },
  { icon: '👥', title: 'Members & Trainers', body: 'Browse the full member and trainer lists on the go.' },
  { icon: '🗓️', title: 'Classes', body: 'Check today’s and upcoming class schedule.' },
  { icon: '💧', title: 'Water Intake', body: 'Your own personal hydration tracker with reminders.' },
]

export default function UserGuidePage() {
  const [tab, setTab] = useState<'web' | 'mobile'>('web')

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border sticky top-0 bg-bg/90 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple flex items-center justify-center text-lg shrink-0">
              🏋️‍♂️
            </span>
            <div className="font-bold">Gym Fit User Guide</div>
          </div>
          <Link to="/login" className="text-sm text-primary font-medium">
            &larr; Back to Login
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">How to use Gym Fit</h1>
        <p className="text-text-muted mb-8">
          A walkthrough of the web dashboard (Admin &amp; Trainer) and the mobile app (Member, Trainer &amp; Admin).
          This page is public — share it with your team, no login required.
        </p>

        <div className="flex gap-1 bg-surface-hover rounded-lg p-1 mb-8 w-fit">
          <button
            onClick={() => setTab('web')}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
              tab === 'web' ? 'bg-surface-raised text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            💻 Web Dashboard
          </button>
          <button
            onClick={() => setTab('mobile')}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
              tab === 'mobile' ? 'bg-surface-raised text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            📱 Mobile App
          </button>
        </div>

        {tab === 'web' ? (
          <>
            <SubHeading emoji="🛡️" title="Admin Panel" />
            {ADMIN_WEB_SECTIONS.map((s) => (
              <SectionCard key={s.id} section={s} />
            ))}

            <SubHeading emoji="🏋️" title="Trainer Panel" />
            {TRAINER_WEB_SECTIONS.map((s) => (
              <SectionCard key={s.id} section={s} />
            ))}
          </>
        ) : (
          <>
            <p className="text-sm text-text-muted mb-6">
              The mobile app adapts to whichever role you log in as — the same app, three different experiences.
            </p>

            <SubHeading emoji="🙋" title="Member" />
            <FeatureGrid features={MOBILE_MEMBER} />

            <SubHeading emoji="🏋️" title="Trainer" />
            <FeatureGrid features={MOBILE_TRAINER} />

            <SubHeading emoji="🛡️" title="Admin" />
            <FeatureGrid features={MOBILE_ADMIN} />
          </>
        )}

        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-text-faint">
          Need something not covered here? Contact your gym’s admin.
        </div>
      </div>
    </div>
  )
}

function SubHeading({ emoji, title }: { emoji: string; title: string }) {
  return (
    <h2 className="text-lg font-bold mt-10 mb-4 first:mt-0 flex items-center gap-2">
      <span>{emoji}</span> {title}
    </h2>
  )
}

function SectionCard({ section }: { section: GuideSection }) {
  return (
    <div id={section.id} className="bg-surface rounded-2xl border border-border p-6 mb-4">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-xl">{section.icon}</span>
        <div className="font-semibold text-text">{section.title}</div>
      </div>
      <p className="text-sm text-text-muted mb-4">{section.intro}</p>
      <ol className="space-y-3">
        {section.steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div>
              <span className="text-sm font-medium text-text">{step.title}</span>
              <p className="text-sm text-text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function FeatureGrid({ features }: { features: MobileFeature[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 mb-4">
      {features.map((f) => (
        <div key={f.title} className="bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">{f.icon}</span>
            <div className="font-semibold text-text text-sm">{f.title}</div>
          </div>
          <p className="text-sm text-text-muted">{f.body}</p>
        </div>
      ))}
    </div>
  )
}
