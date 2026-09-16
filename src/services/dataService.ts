import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from './firebase.ts';
import {
  ResourceItem,
  ClassScheduleItem,
  DeadlineItem,
  SubmissionRecord,
  PersonalTimetableNote,
  StudentCourseGrade,
  ForumPost,
  StudentRosterItem,
  BroadcastNotice,
} from '../types.ts';
import {
  INITIAL_RESOURCES,
  INITIAL_SCHEDULES,
  INITIAL_DEADLINES,
  INITIAL_SUBMISSIONS,
  INITIAL_PRIVATE_NOTES,
  INITIAL_STUDENT_GRADES,
  INITIAL_FORUM_POSTS,
  STUDENT_ROSTER,
  INITIAL_BROADCASTS,
} from '../data/mockData.ts';

// Local storage keys for offline / fallback persistence
const KEYS = {
  RESOURCES: 'pintar_resources_v2',
  SCHEDULES: 'pintar_schedules_v3',
  DEADLINES: 'pintar_deadlines_v2',
  SUBMISSIONS: 'pintar_submissions_v2',
  PRIVATE_NOTES: 'pintar_private_notes_v2',
  GRADES: 'pintar_grades_v2',
  FORUM: 'pintar_forum_v2',
  STUDENTS: 'pintar_students_v2',
  BROADCASTS: 'pintar_broadcasts_v2',
};

function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to localStorage', err);
  }
}

class DataService {
  // --- RESOURCES ---
  public subscribeResources(callback: (resources: ResourceItem[]) => void): () => void {
    // Initial emission from local storage/fallback
    const localData = getLocal<ResourceItem[]>(KEYS.RESOURCES, INITIAL_RESOURCES);
    callback(localData);

    try {
      const q = query(collection(db, 'resources'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: ResourceItem[] = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            saveLocal(KEYS.RESOURCES, items);
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore resources listener fallback:', error.message);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  public async addResource(resource: Omit<ResourceItem, 'id'>): Promise<ResourceItem> {
    const newItem: ResourceItem = {
      ...resource,
      id: `res-${Date.now()}`,
    };

    // Optimistic local update
    const current = getLocal<ResourceItem[]>(KEYS.RESOURCES, INITIAL_RESOURCES);
    const updated = [newItem, ...current];
    saveLocal(KEYS.RESOURCES, updated);

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'resources', newItem.id), newItem);
    } catch (err) {
      console.warn('Firestore addResource sync error:', err);
    }

    return newItem;
  }

  // --- SCHEDULES & CLASS RESCHEDULE ---
  public subscribeSchedules(callback: (schedules: ClassScheduleItem[]) => void): () => void {
    const localData = getLocal<ClassScheduleItem[]>(KEYS.SCHEDULES, INITIAL_SCHEDULES);
    callback(localData);

    try {
      const q = query(collection(db, 'schedules'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: ClassScheduleItem[] = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            saveLocal(KEYS.SCHEDULES, items);
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore schedules listener fallback:', error.message);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  public async rescheduleClass(
    scheduleId: string,
    newTime: string,
    newVenue: string,
    reason: string
  ): Promise<void> {
    const current = getLocal<ClassScheduleItem[]>(KEYS.SCHEDULES, INITIAL_SCHEDULES);
    const updated = current.map((sch) => {
      if (sch.id === scheduleId) {
        return {
          ...sch,
          isRescheduled: true,
          rescheduleNotice: {
            originalTime: `${sch.day} ${sch.startTime} - ${sch.endTime}`,
            originalVenue: sch.venue,
            newTime,
            newVenue,
            reason,
            announcedAt: new Date().toISOString(),
          },
        };
      }
      return sch;
    });

    saveLocal(KEYS.SCHEDULES, updated);

    try {
      const targetDoc = updated.find((s) => s.id === scheduleId);
      if (targetDoc) {
        await setDoc(doc(db, 'schedules', scheduleId), targetDoc);
      }
    } catch (err) {
      console.warn('Firestore rescheduleClass sync error:', err);
    }
  }

  // --- DEADLINES ---
  public subscribeDeadlines(callback: (deadlines: DeadlineItem[]) => void): () => void {
    const localData = getLocal<DeadlineItem[]>(KEYS.DEADLINES, INITIAL_DEADLINES);
    callback(localData);

    try {
      const q = query(collection(db, 'deadlines'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: DeadlineItem[] = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            saveLocal(KEYS.DEADLINES, items);
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore deadlines listener fallback:', error.message);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  public async addDeadline(deadline: Omit<DeadlineItem, 'id' | 'createdAt'>): Promise<DeadlineItem> {
    const newItem: DeadlineItem = {
      ...deadline,
      id: `dl-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const current = getLocal<DeadlineItem[]>(KEYS.DEADLINES, INITIAL_DEADLINES);
    const updated = [newItem, ...current];
    saveLocal(KEYS.DEADLINES, updated);

    try {
      await setDoc(doc(db, 'deadlines', newItem.id), newItem);
    } catch (err) {
      console.warn('Firestore addDeadline sync error:', err);
    }

    return newItem;
  }

  // --- SUBMISSIONS ---
  public subscribeSubmissions(callback: (submissions: SubmissionRecord[]) => void): () => void {
    const localData = getLocal<SubmissionRecord[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    callback(localData);

    try {
      const q = query(collection(db, 'submissions'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: SubmissionRecord[] = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            saveLocal(KEYS.SUBMISSIONS, items);
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore submissions listener fallback:', error.message);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  public async submitWork(
    deadlineId: string,
    studentId: string,
    studentName: string,
    studentEmail: string,
    setNumber: number,
    dueDate: string,
    fileName: string,
    note?: string
  ): Promise<SubmissionRecord> {
    const now = new Date();
    const isLate = now > new Date(dueDate);

    const submission: SubmissionRecord = {
      id: `sub-${Date.now()}`,
      deadlineId,
      studentId,
      studentName,
      studentEmail,
      setNumber,
      submittedAt: now.toISOString(),
      status: isLate ? 'Late' : 'Submitted',
      fileName,
      note,
    };

    const current = getLocal<SubmissionRecord[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    // Remove previous submission if any
    const filtered = current.filter(
      (s) => !(s.deadlineId === deadlineId && s.studentEmail === studentEmail)
    );
    const updated = [submission, ...filtered];
    saveLocal(KEYS.SUBMISSIONS, updated);

    try {
      await setDoc(doc(db, 'submissions', submission.id), submission);
    } catch (err) {
      console.warn('Firestore submitWork sync error:', err);
    }

    return submission;
  }

  // --- PRIVATE STUDENT NOTES ---
  public getPrivateNotes(studentEmail: string): PersonalTimetableNote[] {
    const allNotes = getLocal<PersonalTimetableNote[]>(KEYS.PRIVATE_NOTES, INITIAL_PRIVATE_NOTES);
    return allNotes.filter((n) => n.studentEmail.toLowerCase() === studentEmail.toLowerCase());
  }

  public addPrivateNote(note: Omit<PersonalTimetableNote, 'id' | 'createdAt'>): PersonalTimetableNote {
    const newNote: PersonalTimetableNote = {
      ...note,
      id: `pnote-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const allNotes = getLocal<PersonalTimetableNote[]>(KEYS.PRIVATE_NOTES, INITIAL_PRIVATE_NOTES);
    const updated = [newNote, ...allNotes];
    saveLocal(KEYS.PRIVATE_NOTES, updated);

    try {
      setDoc(doc(db, 'privateNotes', newNote.id), newNote);
    } catch (err) {
      console.warn('Firestore privateNote sync error:', err);
    }

    return newNote;
  }

  public deletePrivateNote(noteId: string): void {
    const allNotes = getLocal<PersonalTimetableNote[]>(KEYS.PRIVATE_NOTES, INITIAL_PRIVATE_NOTES);
    const updated = allNotes.filter((n) => n.id !== noteId);
    saveLocal(KEYS.PRIVATE_NOTES, updated);

    try {
      deleteDoc(doc(db, 'privateNotes', noteId));
    } catch (err) {
      console.warn('Firestore deletePrivateNote sync error:', err);
    }
  }

  // --- STUDENT GRADES ---
  public subscribeGrades(callback: (grades: StudentCourseGrade[]) => void): () => void {
    const localData = getLocal<StudentCourseGrade[]>(KEYS.GRADES, INITIAL_STUDENT_GRADES);
    callback(localData);

    try {
      const q = query(collection(db, 'grades'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: StudentCourseGrade[] = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            saveLocal(KEYS.GRADES, items);
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore grades listener fallback:', error.message);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  public async updateGrade(grade: StudentCourseGrade): Promise<void> {
    const current = getLocal<StudentCourseGrade[]>(KEYS.GRADES, INITIAL_STUDENT_GRADES);
    const index = current.findIndex(
      (g) => g.studentEmail === grade.studentEmail && g.courseCode === grade.courseCode
    );

    let updated: StudentCourseGrade[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = grade;
    } else {
      updated = [grade, ...current];
    }
    saveLocal(KEYS.GRADES, updated);

    try {
      await setDoc(doc(db, 'grades', grade.id), grade);
    } catch (err) {
      console.warn('Firestore updateGrade sync error:', err);
    }
  }

  // --- FORUM POSTS ---
  public subscribeForumPosts(callback: (posts: ForumPost[]) => void): () => void {
    const localData = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    callback(localData);

    try {
      const q = query(collection(db, 'forumPosts'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: ForumPost[] = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            saveLocal(KEYS.FORUM, items);
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore forum listener fallback:', error.message);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  public async addForumPost(post: Omit<ForumPost, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<ForumPost> {
    const newPost: ForumPost = {
      ...post,
      id: `post-${Date.now()}`,
      createdAt: 'Just now',
      likes: 0,
      comments: [],
    };

    const current = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    const updated = [newPost, ...current];
    saveLocal(KEYS.FORUM, updated);

    try {
      await setDoc(doc(db, 'forumPosts', newPost.id), newPost);
    } catch (err) {
      console.warn('Firestore addForumPost sync error:', err);
    }

    return newPost;
  }

  public async addForumComment(postId: string, comment: {
    authorName: string;
    authorEmail: string;
    authorRole: any;
    authorSet?: string;
    content: string;
  }): Promise<void> {
    const current = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    const updated = current.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `comm-${Date.now()}`,
              ...comment,
              createdAt: 'Just now',
              likes: 0,
            },
          ],
        };
      }
      return p;
    });

    saveLocal(KEYS.FORUM, updated);

    try {
      const target = updated.find((p) => p.id === postId);
      if (target) {
        await setDoc(doc(db, 'forumPosts', postId), target);
      }
    } catch (err) {
      console.warn('Firestore addForumComment sync error:', err);
    }
  }

  // --- STUDENT ROSTER (300 STUDENTS ACROSS 11 SETS) ---
  public getStudentRoster(): StudentRosterItem[] {
    return getLocal<StudentRosterItem[]>(KEYS.STUDENTS, STUDENT_ROSTER);
  }

  public findStudentByEmail(email: string): StudentRosterItem | undefined {
    const roster = this.getStudentRoster();
    return roster.find((s) => s.email.toLowerCase() === email.toLowerCase());
  }

  // --- Convenience aliases & Forum helpers ---
  public subscribeToResources(cb: (r: ResourceItem[]) => void) {
    return this.subscribeResources(cb);
  }

  public subscribeToSchedules(cb: (s: ClassScheduleItem[]) => void) {
    return this.subscribeSchedules(cb);
  }

  public subscribeToDeadlines(cb: (d: DeadlineItem[]) => void) {
    return this.subscribeDeadlines(cb);
  }

  public subscribeToSubmissions(cb: (s: SubmissionRecord[]) => void) {
    return this.subscribeSubmissions(cb);
  }

  public subscribeToGrades(cb: (g: StudentCourseGrade[]) => void) {
    return this.subscribeGrades(cb);
  }

  public subscribeToPosts(cb: (p: ForumPost[]) => void) {
    return this.subscribeForumPosts(cb);
  }

  public subscribeToBroadcasts(cb: (b: BroadcastNotice[]) => void) {
    return this.subscribeBroadcasts(cb);
  }

  public async createPost(post: Omit<ForumPost, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<ForumPost> {
    return this.addForumPost(post);
  }

  public async likePost(postId: string): Promise<void> {
    const current = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    const updated = current.map((p) => {
      if (p.id === postId) {
        return { ...p, likes: (p.likes || 0) + 1 };
      }
      return p;
    });
    saveLocal(KEYS.FORUM, updated);
    try {
      const target = updated.find((p) => p.id === postId);
      if (target) {
        await setDoc(doc(db, 'forumPosts', postId), target);
      }
    } catch (err) {
      console.warn('Firestore likePost sync error:', err);
    }
  }

  public async addReplyToPost(
    postId: string,
    comment: {
      authorName: string;
      authorEmail: string;
      authorRole: any;
      authorSet?: string;
      content: string;
    }
  ): Promise<void> {
    return this.addForumComment(postId, comment);
  }

  public async saveStudentGrade(grade: StudentCourseGrade): Promise<void> {
    return this.updateGrade(grade);
  }

  // --- LIVE BROADCAST DISPATCHES (Lecturer to Student real-time sync) ---
  public subscribeBroadcasts(callback: (broadcasts: BroadcastNotice[]) => void): () => void {
    const localData = getLocal<BroadcastNotice[]>(KEYS.BROADCASTS, INITIAL_BROADCASTS);
    callback(localData);

    try {
      const q = query(collection(db, 'broadcastNotices'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: BroadcastNotice[] = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            // Sort by newest first
            items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            saveLocal(KEYS.BROADCASTS, items);
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore broadcasts listener fallback:', error.message);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  public async addBroadcast(
    notice: Omit<BroadcastNotice, 'id' | 'createdAt'>
  ): Promise<BroadcastNotice> {
    const newItem: BroadcastNotice = {
      ...notice,
      id: `bc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const current = getLocal<BroadcastNotice[]>(KEYS.BROADCASTS, INITIAL_BROADCASTS);
    const updated = [newItem, ...current];
    saveLocal(KEYS.BROADCASTS, updated);

    try {
      await setDoc(doc(db, 'broadcastNotices', newItem.id), newItem);
    } catch (err) {
      console.warn('Firestore addBroadcast sync error:', err);
    }

    return newItem;
  }
}

export const dataService = new DataService();
