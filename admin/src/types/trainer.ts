export interface TrainerUser {
  id: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  gender: string | null
  dateOfBirth: string | null
  address: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  createdAt: string
}

export interface TrainerDetail {
  id: string
  userId: string
  bio: string | null
  specialties: string[]
  ratePerHour: string | null
  qualification: string | null
  certifications: string[]
  experienceYears: number | null
  salary: string | null
  joiningDate: string | null
  isActive: boolean
  createdAt: string
  user: TrainerUser
  _count: { members: number }
}

export interface TrainerAssignment {
  id: string
  trainerId: string
  memberId: string
  trainingType: string
  startDate: string
  endDate: string | null
  schedule: string | null
  notes: string | null
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  member: { id: string; name: string; email: string; phone: string | null }
}

export interface TrainerPerformance {
  totalMembersAssigned: number
  activeMembers: number
  dietPlansCreated: number
  monthlyAssignments: { month: string; count: number }[]
  averageRating: number | null
  attendanceRate: number | null
}

export interface TrainerProfile extends TrainerDetail {
  performance: TrainerPerformance
  assignments: TrainerAssignment[]
}

export interface AvailabilityBlock {
  id: string
  trainerId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  label: string | null
}

export interface TrainerHoliday {
  id: string
  trainerId: string
  date: string
  reason: string | null
}

export interface TrainerSchedule {
  availability: AvailabilityBlock[]
  holidays: TrainerHoliday[]
  upcomingBookings: { id: string; startTime: string; endTime: string; userId: string }[]
  upcomingClasses: { id: string; startsAt: string; endsAt: string; gymClass: { name: string; type: string } }[]
  weeklyOffDays: number[]
}

export interface MemberOption {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  memberships?: { plan: { name: string }; endDate: string }[]
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
