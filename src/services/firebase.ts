import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { LearningPlan } from "../types/skill";

// Сохранить учебный план в Firestore
export async function savePlan(
  userId: string,
  plan: LearningPlan
): Promise<string> {
  const docRef = doc(collection(db, "plans"));
  await setDoc(docRef, {
    userId,
    ...plan,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Загрузить все планы пользователя
export async function getUserPlans(userId: string): Promise<LearningPlan[]> {
  const q = query(collection(db, "plans"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as LearningPlan);
}

// Сохранить прогресс по уроку
export async function saveProgress(
  userId: string,
  skillName: string,
  lessonIndex: number
): Promise<void> {
  const docRef = doc(db, "progress", `${userId}_${skillName}`);
  await setDoc(
    docRef,
    {
      userId,
      skillName,
      currentLesson: lessonIndex,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Загрузить прогресс
export async function getProgress(
  userId: string,
  skillName: string
): Promise<number> {
  const docRef = doc(db, "progress", `${userId}_${skillName}`);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data().currentLesson || 0;
  }
  return 0;
}
