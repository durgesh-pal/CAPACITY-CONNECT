import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest, requireRole } from "./src/middleware/auth.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { db } from "./src/db/index.ts";
import { courses, assessments, questions, submissions, enrollments, users } from "./src/db/schema.ts";
import { eq, and } from "drizzle-orm";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // API Routes

  // Auth sync
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      
      const { name } = req.body;
      const user = await getOrCreateUser(req.user.uid, req.user.email || "", name || "Anonymous");
      res.json(user);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get self profile
  app.get("/api/users/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      res.json(req.dbUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update role (Demo Purpose)
  app.post("/api/users/me/role", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { role } = req.body;
      const dbUser = req.dbUser;
      
      const updatedUser = await db.update(users)
        .set({ role })
        .where(eq(users.id, dbUser.id))
        .returning();
        
      res.json(updatedUser[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- TRAINEE ROUTES ---
  app.get("/api/courses", requireAuth, async (req: AuthRequest, res) => {
    try {
      const allCourses = await db.select().from(courses);
      res.json(allCourses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/enrollments", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { courseId } = req.body;
      const enrollment = await db.insert(enrollments).values({
        courseId,
        traineeId: req.dbUser.id,
      }).returning();
      res.json(enrollment[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/assessments/my", requireAuth, async (req: AuthRequest, res) => {
    try {
      // Find all courses the user is enrolled in
      const userEnrollments = await db.select().from(enrollments).where(eq(enrollments.traineeId, req.dbUser.id));
      const enrolledCourseIds = userEnrollments.map(e => e.courseId);
      
      if (enrolledCourseIds.length === 0) {
        return res.json([]);
      }
      
      // Get all assessments for those courses
      const allAssessments = await db.select().from(assessments);
      const userAssessments = allAssessments.filter(a => enrolledCourseIds.includes(a.courseId));
      
      res.json(userAssessments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- TRAINER ROUTES ---
  app.post("/api/courses", requireAuth, requireRole('TRAINER'), async (req: AuthRequest, res) => {
    try {
      const { title, description, subjectTag } = req.body;
      const course = await db.insert(courses).values({
        title,
        description,
        subjectTag,
        trainerId: req.dbUser.id,
        isPublished: true,
      }).returning();
      res.json(course[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/assessments", requireAuth, requireRole('TRAINER'), async (req: AuthRequest, res) => {
    try {
      const { courseId, title, timeLimitMinutes, passingThreshold, questionsData } = req.body;
      
      const assessmentResult = await db.insert(assessments).values({
        courseId,
        title,
        timeLimitMinutes,
        passingThreshold,
      }).returning();
      
      const assessmentId = assessmentResult[0].id;
      
      if (questionsData && questionsData.length > 0) {
        const insertQuestions = questionsData.map((q: any) => ({
          assessmentId,
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
        }));
        await db.insert(questions).values(insertQuestions);
      }
      
      res.json({ assessment: assessmentResult[0] });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/assessments/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const assessmentData = await db.select().from(assessments).where(eq(assessments.id, assessmentId));
      if (assessmentData.length === 0) return res.status(404).json({ error: 'Not found' });
      
      const assessmentQuestions = await db.select({
        id: questions.id,
        questionText: questions.questionText,
        options: questions.options
      }).from(questions).where(eq(questions.assessmentId, assessmentId));
      
      res.json({
        ...assessmentData[0],
        questions: assessmentQuestions
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // MCQ Submission Engine
  app.post("/api/assessments/:id/submit", requireAuth, async (req: AuthRequest, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const { answers } = req.body; // { questionId: selectedIndex }
      
      const assessmentQuestions = await db.select().from(questions).where(eq(questions.assessmentId, assessmentId));
      
      let score = 0;
      assessmentQuestions.forEach((q) => {
        if (answers[q.id] === q.correctOptionIndex) {
          score++;
        }
      });
      
      const percentageScore = Math.round((score / assessmentQuestions.length) * 100);
      
      const submission = await db.insert(submissions).values({
        assessmentId,
        traineeId: req.dbUser.id,
        score: percentageScore,
        answers,
      }).returning();
      
      res.json(submission[0]);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
