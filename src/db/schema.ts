import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role').notNull().default('TRAINEE'), // TRAINEE, TRAINER, ADMIN
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  qualifications: text('qualifications'),
  experienceYears: integer('experience_years'),
  skills: text('skills').array(), // Tag array
  bio: text('bio'),
});

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  trainerId: integer('trainer_id').references(() => users.id).notNull(),
  subjectTag: text('subject_tag').notNull(), // for competency mapping
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(), // video, pdf, link
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  traineeId: integer('trainee_id').references(() => users.id).notNull(),
  progress: integer('progress').default(0),
  enrolledAt: timestamp('enrolled_at').defaultNow(),
});

export const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  title: text('title').notNull(),
  timeLimitMinutes: integer('time_limit_minutes').notNull().default(30),
  passingThreshold: integer('passing_threshold').notNull().default(60), // percentage
  createdAt: timestamp('created_at').defaultNow(),
});

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  assessmentId: integer('assessment_id').references(() => assessments.id).notNull(),
  questionText: text('question_text').notNull(),
  options: jsonb('options').notNull(), // array of strings
  correctOptionIndex: integer('correct_option_index').notNull(),
});

export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  assessmentId: integer('assessment_id').references(() => assessments.id).notNull(),
  traineeId: integer('trainee_id').references(() => users.id).notNull(),
  score: integer('score').notNull(),
  answers: jsonb('answers').notNull(), // map of questionId to selected option index
  submittedAt: timestamp('submitted_at').defaultNow(),
});

export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  coursesTaught: many(courses),
  enrollments: many(enrollments),
  submissions: many(submissions),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  trainer: one(users, {
    fields: [courses.trainerId],
    references: [users.id],
  }),
  resources: many(resources),
  assessments: many(assessments),
  enrollments: many(enrollments),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  course: one(courses, {
    fields: [assessments.courseId],
    references: [courses.id],
  }),
  questions: many(questions),
  submissions: many(submissions),
}));
