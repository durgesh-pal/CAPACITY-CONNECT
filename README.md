# 🎓 CAPACITY CONNECT: Digital Capacity Building & LMS Portal

**CAPACITY CONNECT** is an enterprise-grade Digital Capacity Building and Learning Management System designed to modernize organizational training, competency development, and institutional knowledge sharing through a scalable, role-based web platform.

---

## 🌟 Key Features & Role-Based Access Control (RBAC)

### 👨‍🎓 1. Trainee Portal
- **Rich Professional Profile:** Manage qualifications, work history, skill taxonomy tags, career interests, and auto-generated digital certificates.
- **Interactive Course Player:** Self-enrollment workflow with built-in responsive video streaming and document/PDF viewers.
- **Timed Assessment Engine:** Subject-wise timed MCQ examinations featuring real-time timers, client-side state preservation, immediate score generation, and question-by-question review.
- **Feedback & Ratings:** Post-training multi-criteria feedback mechanisms.

### 👨‍🏫 2. Trainer Hub
- **Competency & Verification:** Profile configuration with verified domain expertise and availability tracking.
- **Resource Repository:** Upload and structure multi-format materials (recorded lectures, slide decks, reference docs).
- **Assessment Management:** Build custom quizzes with configurable time windows, negative marking, and passing thresholds.
- **Performance Analytics:** Real-time visibility into trainee progress, engagement metrics, and CSV/PDF exportable reports.

### 🛡️ 3. Administrator Console
- **User Governance:** Registration validation, account activation, and role delegation.
- **Automated Competency Mapping:** Smart scoring algorithm matching subject requirements to verified trainer profiles based on expertise, experience, and trainee feedback ratings.
- **System-Wide Analytics:** Live metrics tracking active enrollments, course completions, and assessment trends.
- **Communication Hub:** Broadcast administrative bulletins, spotlight achievements, and showcase newly released learning modules.

---

## 🏗️ System Architecture & Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, Radix UI / Shadcn UI.
- **Backend:** Next.js Route Handlers / Server Actions, Node.js.
- **Database & ORM:** PostgreSQL with Prisma ORM.
- **Authentication:** NextAuth.js (Auth.js) / Supabase Auth with JWT and Role-Based Route Protection.
- **State Management:** TanStack Query (React Query) + Zustand.
- **Styling:** Tailwind CSS with CSS Variables for dynamic dark/light themes.

---

## 🗄️ Database Architecture (Prisma Schema Highlights)

The data model provides relationships across identity, learning resources, evaluations, and competence metrics:

- `User` ⟷ `Profile` (One-to-One)
- `User` ⟷ `Course` (Trainer 1-to-Many creation; Trainee Many-to-Many enrollment via `Enrollment`)
- `Course` ⟷ `Assessment` ⟷ `Question` (1-to-Many hierarchy)
- `Assessment` ⟷ `AssessmentSubmission` ⟷ `AnswerRecord`
- `TrainerProfile` ⟷ `CompetencyTag` (Evaluation engine for matching algorithm)

---

## 🧠 Smart Competency Mapping Algorithm

The platform evaluates trainer suitability using a weighted scoring formula:

$$\text{Matching Score} = (0.45 \times \text{SkillMatch}) + (0.35 \times \text{RatingScore}) + (0.20 \times \text{ExperienceWeight})$$

* **Skill Match (45%):** Exact string matching against required competency tags.
* **Trainer Rating (35%):** Normalized average rating from past trainee evaluations.
* **Experience Factor (20%):** Years of verified subject matter experience.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `>= 18.x`
- PostgreSQL database instance
- npm, yarn, or pnpm

### 1. Clone the Repository
```bash
git clone [https://github.com/your-org/capacity-connect.git](https://github.com/your-org/capacity-connect.git)
cd capacity-connect
