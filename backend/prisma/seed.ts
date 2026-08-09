import { PrismaClient, ProgramLevel, ClassType, MealType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@gymapp.com" },
    update: {},
    create: {
      name: "Gym Admin",
      email: "admin@gymapp.com",
      passwordHash: await bcrypt.hash("Admin123!", 10),
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const planPerks = [
    "Full gym floor access",
    "All group classes (Yoga, Zumba, HIIT, CrossFit, Pilates, Spin)",
    "Personal trainer sessions",
    "Diet & nutrition plan",
    "Progress tracking & analytics",
  ];

  const existingPlanCount = await prisma.membershipPlan.count({ where: { isActive: true } });
  if (existingPlanCount === 0) {
    await prisma.membershipPlan.createMany({
      data: [
        { name: "1 Month", durationDays: 30, price: 1500, perks: planPerks },
        { name: "3 Months", durationDays: 90, price: 4200, perks: planPerks },
        { name: "6 Months", durationDays: 180, price: 7800, perks: planPerks },
        { name: "1 Year", durationDays: 365, price: 14400, perks: planPerks },
      ],
    });
  }

  const existingExerciseCount = await prisma.exercise.count();
  if (existingExerciseCount === 0) {
    await prisma.exercise.createMany({
      data: [
        { name: "Push Up", muscleGroup: "Chest", equipment: "Bodyweight" },
        { name: "Squat", muscleGroup: "Legs", equipment: "Bodyweight" },
        { name: "Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
        { name: "Deadlift", muscleGroup: "Back", equipment: "Barbell" },
        { name: "Plank", muscleGroup: "Core", equipment: "Bodyweight" },
        { name: "Lat Pulldown", muscleGroup: "Back", equipment: "Cable machine" },
      ],
    });
  }

  await prisma.workoutProgram.createMany({
    data: [
      { name: "Beginner Foundations", level: ProgramLevel.BEGINNER, durationWeeks: 4 },
      { name: "Intermediate Strength", level: ProgramLevel.INTERMEDIATE, durationWeeks: 6 },
      { name: "Advanced Powerbuilding", level: ProgramLevel.ADVANCED, durationWeeks: 8 },
    ],
    skipDuplicates: true,
  });

  const trainerUser = await prisma.user.upsert({
    where: { email: "trainer.alex@example.com" },
    update: {},
    create: {
      name: "Alex Rivera",
      email: "trainer.alex@example.com",
      passwordHash: await bcrypt.hash("Password123!", 10),
      role: "TRAINER",
      emailVerified: true,
    },
  });

  const trainer = await prisma.trainer.upsert({
    where: { userId: trainerUser.id },
    update: {},
    create: {
      userId: trainerUser.id,
      bio: "Certified strength & conditioning coach, 8 years experience.",
      specialties: ["Strength Training", "HIIT"],
      ratePerHour: 25,
      availability: {
        create: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 5, startTime: "09:00", endTime: "13:00" },
        ],
      },
    },
  });

  const existingClassCount = await prisma.gymClass.count();
  if (existingClassCount === 0) {
    const yogaClass = await prisma.gymClass.create({
      data: { name: "Morning Yoga", type: ClassType.YOGA, trainerId: trainer.id, capacity: 15, durationMin: 60 },
    });
    const hiitClass = await prisma.gymClass.create({
      data: { name: "Evening HIIT", type: ClassType.HIIT, trainerId: trainer.id, capacity: 20, durationMin: 45 },
    });

    const now = new Date();
    const tomorrow9am = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0);
    const tomorrow6pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 18, 0);

    await prisma.classSchedule.createMany({
      data: [
        { classId: yogaClass.id, startsAt: tomorrow9am, endsAt: new Date(tomorrow9am.getTime() + 60 * 60_000) },
        { classId: hiitClass.id, startsAt: tomorrow6pm, endsAt: new Date(tomorrow6pm.getTime() + 45 * 60_000) },
      ],
    });
  }

  const existingFoodCount = await prisma.foodItem.count();
  if (existingFoodCount === 0) {
    await prisma.foodItem.createMany({
      data: [
        { name: "Oatmeal with Fruits", mealType: MealType.BREAKFAST, calories: 320, carbsG: 58, proteinG: 10, fatsG: 6, servingLabel: "1 bowl" },
        { name: "Greek Yogurt & Granola", mealType: MealType.BREAKFAST, calories: 280, carbsG: 34, proteinG: 18, fatsG: 8, servingLabel: "1 cup" },
        { name: "Veggie Omelette", mealType: MealType.BREAKFAST, calories: 250, carbsG: 6, proteinG: 20, fatsG: 16, servingLabel: "2 eggs" },
        { name: "Grilled Chicken Salad", mealType: MealType.LUNCH, calories: 420, carbsG: 20, proteinG: 45, fatsG: 15, servingLabel: "1 plate" },
        { name: "Paneer Tikka Bowl", mealType: MealType.LUNCH, calories: 480, carbsG: 35, proteinG: 28, fatsG: 22, servingLabel: "1 bowl" },
        { name: "Turkey Sandwich", mealType: MealType.LUNCH, calories: 390, carbsG: 42, proteinG: 30, fatsG: 12, servingLabel: "1 sandwich" },
        { name: "Salmon with Quinoa", mealType: MealType.DINNER, calories: 520, carbsG: 40, proteinG: 38, fatsG: 20, servingLabel: "1 plate" },
        { name: "Stir-Fry Tofu & Veggies", mealType: MealType.DINNER, calories: 380, carbsG: 32, proteinG: 22, fatsG: 16, servingLabel: "1 bowl" },
        { name: "Grilled Fish & Steamed Veg", mealType: MealType.DINNER, calories: 410, carbsG: 18, proteinG: 42, fatsG: 14, servingLabel: "1 plate" },
        { name: "Protein Shake", mealType: MealType.SNACK, calories: 180, carbsG: 12, proteinG: 25, fatsG: 3, servingLabel: "1 scoop" },
        { name: "Mixed Nuts", mealType: MealType.SNACK, calories: 200, carbsG: 7, proteinG: 6, fatsG: 17, servingLabel: "30g" },
        { name: "Apple with Peanut Butter", mealType: MealType.SNACK, calories: 220, carbsG: 25, proteinG: 5, fatsG: 12, servingLabel: "1 apple + 1 tbsp" },
      ],
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
