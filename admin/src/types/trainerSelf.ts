export interface DashboardData {
  totalAssignedMembers: number
  todaysSessions: number
  upcomingSessions: number
  pendingWorkoutPlans: number
  completedSessionsToday: number
  unreadMessages: number
  newAssignmentsThisMonth: number
  averageRating: number | null
}

export interface MemberSummary {
  id: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
}

export interface AssignedMemberCard extends MemberSummary {
  membershipPlan: string | null
  goal: string | null
  lastVisit: string | null
  weeklyConsistencyPct: number
  nextSession: string | null
}

export interface Session {
  id: string
  trainerId: string
  userId: string
  startTime: string
  endTime: string
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING' | 'CANCELLED'
  sessionType: string | null
  notes: string | null
  member: MemberSummary
}

export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  equipment: string | null
}

export interface WorkoutPlanExerciseEntry {
  id: string
  exerciseId: string
  exercise: Exercise
  sets: number
  reps: number
  restSeconds: number
  videoUrl: string | null
  notes: string | null
  order: number
}

export interface WorkoutPlan {
  id: string
  name: string
  dayOfWeek: number
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED'
  notes: string | null
  createdAt: string
  member: { id: string; name: string; email: string }
  exercises: WorkoutPlanExerciseEntry[]
}

export interface FoodItem {
  id: string
  name: string
  mealType: string
  calories: number
  carbsG: number
  proteinG: number
  fatsG: number
  servingLabel: string
}

export interface DietPlanMealEntry {
  id: string
  mealType: string
  dayOfWeek: number
  foodItem: FoodItem
}

export interface DietPlan {
  id: string
  name: string
  notes: string | null
  targetWaterMl: number | null
  supplements: string | null
  createdAt: string
  member: { id: string; name: string; email: string }
  meals: DietPlanMealEntry[]
}

export interface BodyMeasurement {
  id: string
  recordedAt: string
  weightKg: number | null
  bmi: number | null
  bodyFatPct: number | null
  chestCm: number | null
  waistCm: number | null
  armsCm: number | null
  thighsCm: number | null
  shouldersCm: number | null
  notes: string | null
}

export interface ProgressPhoto {
  id: string
  photoUrl: string
  type: 'BEFORE' | 'AFTER' | 'PROGRESS'
  takenAt: string
}

export interface Alert {
  type: string
  message: string
  createdAt: string
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  body: string | null
  attachmentUrl: string | null
  attachmentType: 'IMAGE' | 'DOCUMENT' | null
  createdAt: string
  readAt: string | null
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const ALERT_ICONS: Record<string, string> = {
  NEW_MEMBER_ASSIGNED: '👥',
  WORKOUT_DUE: '🏋️',
  DIET_DUE: '🥗',
  MEMBERSHIP_EXPIRING: '⏳',
  BIRTHDAY_REMINDER: '🎂',
  APPOINTMENT_REMINDER: '📅',
}
