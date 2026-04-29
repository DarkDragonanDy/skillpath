import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { LearningPlan, SavedCourse } from "../types/skill";

// Save a new course to Firestore
export async function saveCourse(
    userId: string,
    plan: LearningPlan
): Promise<string> {
  const docRef = doc(collection(db, "courses"));
  const course: Omit<SavedCourse, "id"> = {
    userId,
    plan,
    currentLesson: 0,
    completedLessons: [],
    quizScores: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, course);
  return docRef.id;
}

// Load all courses for a user
export async function getUserCourses(userId: string): Promise<SavedCourse[]> {
  const q = query(collection(db, "courses"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as SavedCourse[];
}

// Load a single course by ID
export async function getCourse(courseId: string): Promise<SavedCourse | null> {
  const docRef = doc(db, "courses", courseId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as SavedCourse;
  }
  return null;
}

// Delete a course
export async function deleteCourse(courseId: string): Promise<void> {
  await deleteDoc(doc(db, "courses", courseId));
}

// Update current lesson position
export async function updateCourseLesson(
    courseId: string,
    lessonIndex: number
): Promise<void> {
  const docRef = doc(db, "courses", courseId);
  await updateDoc(docRef, {
    currentLesson: lessonIndex,
    updatedAt: serverTimestamp(),
  });
}

// Mark a lesson as completed
export async function completeLesson(
    courseId: string,
    lessonIndex: number,
    currentCompleted: number[]
): Promise<void> {
  const updated = currentCompleted.includes(lessonIndex)
      ? currentCompleted
      : [...currentCompleted, lessonIndex];
  const docRef = doc(db, "courses", courseId);
  await updateDoc(docRef, {
    completedLessons: updated,
    updatedAt: serverTimestamp(),
  });
}

// Save quiz score for a lesson
export async function saveQuizScore(
    courseId: string,
    lessonId: string,
    score: number,
    currentScores: Record<string, number>
): Promise<void> {
  const docRef = doc(db, "courses", courseId);
  await updateDoc(docRef, {
    quizScores: { ...currentScores, [lessonId]: score },
    updatedAt: serverTimestamp(),
  });
}

// ---- Legacy functions kept for compatibility ----

export async function savePlan(
    userId: string,
    plan: LearningPlan
): Promise<string> {
  return saveCourse(userId, plan);
}

// export async function saveProgress(
//     userId: string,
//     skillName: string,
//     lessonIndex: number
// ): Promise<void> {
//   // No-op: progress is now tracked per course
// }
//
// export async function getProgress(
//     userId: string,
//     skillName: string
// ): Promise<number> {
//   return 0;
// }
