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
  StudentKokoRecord,
  KokoSubmissionItem,
  ForumPost,
  ForumComment,
  ForumReaction,
  StudentRosterItem,
  BroadcastNotice,
} from '../types.ts';
import { isWithin24Hours } from '../utils/dateUtils.ts';
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
  RESOURCES: 'pintar_resources_v5',
  SCHEDULES: 'pintar_schedules_ukm_2026_clean',
  DEADLINES: 'pintar_deadlines_v5',
  SUBMISSIONS: 'pintar_submissions_v5',
  PRIVATE_NOTES: 'pintar_private_notes_v3',
  GRADES: 'pintar_grades_v2',
  KOKO: 'pintar_koko_records_v2',
  KOKO_SUBMISSIONS: 'pintar_koko_submissions_v2',
  FORUM: 'pintar_forum_v5',
  STUDENTS: 'pintar_students_v2',
  BROADCASTS: 'pintar_broadcasts_v3_live',
};

const syncChannel =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('pintar_realtime_sync_v2')
    : null;

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
    if (syncChannel) {
      try {
        syncChannel.postMessage({ key, data });
      } catch (e) {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pintar_realtime_data_change', {
          detail: { key, data },
        })
      );
    }
  } catch (err) {
    console.warn('Failed to save to localStorage', err);
  }
}

function registerSyncListener<T>(targetKey: string, callback: (data: T) => void): () => void {
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.key === targetKey) {
      callback(event.data.data);
    }
  };

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail && custom.detail.key === targetKey) {
      callback(custom.detail.data);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === targetKey && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback(parsed);
      } catch {}
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleMessage);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('pintar_realtime_data_change', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
  }

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pintar_realtime_data_change', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}

class DataService {
  // --- RESOURCES ---
  public subscribeResources(callback: (resources: ResourceItem[]) => void): () => void {
    const deletedIds = new Set<string>(getLocal<string[]>('pintar_deleted_resource_ids', []));
    // Initial emission from local storage/fallback
    const localData = getLocal<ResourceItem[]>(KEYS.RESOURCES, INITIAL_RESOURCES).filter(
      (r) => !deletedIds.has(r.id)
    );
    callback(localData);

    const unsubSync = registerSyncListener<ResourceItem[]>(KEYS.RESOURCES, (items) => {
      const currentDeleted = new Set<string>(getLocal<string[]>('pintar_deleted_resource_ids', []));
      callback(items.filter((r) => !currentDeleted.has(r.id)));
    });

    try {
      const q = query(collection(db, 'resources'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const currentDeleted = new Set<string>(getLocal<string[]>('pintar_deleted_resource_ids', []));
          const items: ResourceItem[] = [];
          snapshot.forEach((docSnap) => {
            if (!currentDeleted.has(docSnap.id)) {
              items.push({ id: docSnap.id, ...(docSnap.data() as any) });
            }
          });
          saveLocal(KEYS.RESOURCES, items);
          callback(items);
        },
        (error) => {
          console.warn('Firestore resources listener fallback:', error.message);
        }
      );
      return () => {
        unsubSync();
        unsubscribe();
      };
    } catch {
      return unsubSync;
    }
  }

  public async addResource(resource: Omit<ResourceItem, 'id'>): Promise<ResourceItem> {
    const newItem: ResourceItem = {
      ...resource,
      id: `res-${Date.now()}`,
    };

    // Optimistic local update
    const deletedIds = new Set<string>(getLocal<string[]>('pintar_deleted_resource_ids', []));
    const current = getLocal<ResourceItem[]>(KEYS.RESOURCES, INITIAL_RESOURCES).filter(
      (item) => !deletedIds.has(item.id)
    );
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

  public async deleteResource(id: string): Promise<void> {
    // Record deleted ID permanently so fallback mock data never revives it
    const deletedIds = new Set<string>(getLocal<string[]>('pintar_deleted_resource_ids', []));
    deletedIds.add(id);
    saveLocal('pintar_deleted_resource_ids', Array.from(deletedIds));

    // Optimistic local update
    const current = getLocal<ResourceItem[]>(KEYS.RESOURCES, INITIAL_RESOURCES);
    const updated = current.filter((item) => item.id !== id && !deletedIds.has(item.id));
    saveLocal(KEYS.RESOURCES, updated);

    // Sync to Firestore
    try {
      await deleteDoc(doc(db, 'resources', id));
    } catch (err) {
      console.warn('Firestore deleteResource sync error:', err);
    }
  }

  // --- SCHEDULES & CLASS RESCHEDULE ---
  private mergeWithInitialSchedules(overrides: ClassScheduleItem[]): ClassScheduleItem[] {
    const map = new Map<string, ClassScheduleItem>();
    INITIAL_SCHEDULES.forEach((item) => map.set(item.id, { ...item }));
    if (Array.isArray(overrides)) {
      overrides.forEach((item) => {
        if (item && item.id) {
          const base = map.has(item.id) ? { ...map.get(item.id)!, ...item } : { ...item };
          // Sanitize: If reschedule notice doesn't exist or is expired (> 24h), reset to normal
          if (
            base.isRescheduled &&
            (!base.rescheduleNotice ||
              !base.rescheduleNotice.announcedAt ||
              !isWithin24Hours(base.rescheduleNotice.announcedAt))
          ) {
            base.isRescheduled = false;
            base.rescheduleNotice = undefined;
          }
          map.set(item.id, base);
        }
      });
    }
    return Array.from(map.values());
  }

  public subscribeSchedules(callback: (schedules: ClassScheduleItem[]) => void): () => void {
    const rawLocal = getLocal<ClassScheduleItem[]>(KEYS.SCHEDULES, INITIAL_SCHEDULES);
    const localData = this.mergeWithInitialSchedules(rawLocal);
    saveLocal(KEYS.SCHEDULES, localData);
    callback(localData);

    const unsubSync = registerSyncListener<ClassScheduleItem[]>(KEYS.SCHEDULES, (syncedData) => {
      const merged = this.mergeWithInitialSchedules(syncedData || []);
      callback(merged);
    });

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
            // Critical: merge snapshot with INITIAL_SCHEDULES so incomplete collection never wipes the schedule
            const merged = this.mergeWithInitialSchedules(items);
            saveLocal(KEYS.SCHEDULES, merged);
            callback(merged);
          } else {
            callback(localData);
          }
        },
        (error) => {
          console.warn('Firestore schedules listener fallback:', error.message);
        }
      );
      return () => {
        unsubSync();
        unsubscribe();
      };
    } catch {
      return unsubSync;
    }
  }

  public resetSchedulesToOfficial(): ClassScheduleItem[] {
    saveLocal(KEYS.SCHEDULES, INITIAL_SCHEDULES);
    return INITIAL_SCHEDULES;
  }

  public async cancelRescheduleClass(scheduleId: string): Promise<void> {
    const current = this.mergeWithInitialSchedules(
      getLocal<ClassScheduleItem[]>(KEYS.SCHEDULES, INITIAL_SCHEDULES)
    );
    const original = INITIAL_SCHEDULES.find((s) => s.id === scheduleId);
    const updated = current.map((sch) => {
      if (sch.id === scheduleId) {
        return original
          ? { ...original, isRescheduled: false, rescheduleNotice: undefined }
          : { ...sch, isRescheduled: false, rescheduleNotice: undefined };
      }
      return sch;
    });

    saveLocal(KEYS.SCHEDULES, updated);

    try {
      const target = updated.find((s) => s.id === scheduleId);
      if (target) {
        await setDoc(doc(db, 'schedules', scheduleId), target);
      }
    } catch (err) {
      console.warn('Firestore cancelRescheduleClass sync error:', err);
    }
  }

  public async rescheduleClass(
    scheduleId: string,
    newTime: string,
    newVenue: string,
    reason: string
  ): Promise<void> {
    const current = this.mergeWithInitialSchedules(
      getLocal<ClassScheduleItem[]>(KEYS.SCHEDULES, INITIAL_SCHEDULES)
    );
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

    const unsubSync = registerSyncListener<DeadlineItem[]>(KEYS.DEADLINES, callback);

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
      return () => {
        unsubSync();
        unsubscribe();
      };
    } catch {
      return unsubSync;
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

  public async deleteDeadline(id: string): Promise<void> {
    const current = getLocal<DeadlineItem[]>(KEYS.DEADLINES, INITIAL_DEADLINES);
    const updated = current.filter((d) => d.id !== id);
    saveLocal(KEYS.DEADLINES, updated);

    try {
      await deleteDoc(doc(db, 'deadlines', id));
    } catch (err) {
      console.warn('Firestore deleteDeadline sync error:', err);
    }
  }

  // --- SUBMISSIONS ---
  public subscribeSubmissions(callback: (submissions: SubmissionRecord[]) => void): () => void {
    const localData = getLocal<SubmissionRecord[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    callback(localData);

    const unsubSync = registerSyncListener<SubmissionRecord[]>(KEYS.SUBMISSIONS, callback);

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
      return () => {
        unsubSync();
        unsubscribe();
      };
    } catch {
      return unsubSync;
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
    note?: string,
    fileUrl?: string
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
      fileUrl,
      note,
    };

    const current = getLocal<SubmissionRecord[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    // Remove previous submission if any
    const filtered = current.filter(
      (s) => !(s.deadlineId === deadlineId && s.studentEmail.toLowerCase() === studentEmail.toLowerCase())
    );
    const updated = [submission, ...filtered];
    saveLocal(KEYS.SUBMISSIONS, updated);

    try {
      // Remove any prior duplicate documents from Firestore for this student and deadline
      const q = query(
        collection(db, 'submissions'),
        where('deadlineId', '==', deadlineId),
        where('studentEmail', '==', studentEmail)
      );
      const snaps = await getDocs(q);
      for (const d of snaps.docs) {
        if (d.id !== submission.id) {
          await deleteDoc(doc(db, 'submissions', d.id));
        }
      }
      await setDoc(doc(db, 'submissions', submission.id), submission);
    } catch (err) {
      console.warn('Firestore submitWork sync error:', err);
    }

    return submission;
  }

  public async deleteSubmission(id: string, deadlineId?: string, studentEmail?: string): Promise<void> {
    const current = getLocal<SubmissionRecord[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    const target = current.find((s) => s.id === id);
    const dlId = deadlineId || target?.deadlineId;
    const sEmail = (studentEmail || target?.studentEmail || '').toLowerCase();

    const updated = current.filter((s) => {
      if (s.id === id) return false;
      if (dlId && sEmail && s.deadlineId === dlId && s.studentEmail.toLowerCase() === sEmail) return false;
      return true;
    });
    saveLocal(KEYS.SUBMISSIONS, updated);

    try {
      await deleteDoc(doc(db, 'submissions', id));
    } catch (err) {
      console.warn('Firestore deleteSubmission error:', err);
    }

    if (dlId && sEmail) {
      try {
        const q = query(
          collection(db, 'submissions'),
          where('deadlineId', '==', dlId),
          where('studentEmail', '==', target?.studentEmail || studentEmail)
        );
        const snaps = await getDocs(q);
        for (const d of snaps.docs) {
          await deleteDoc(doc(db, 'submissions', d.id));
        }
      } catch (err) {
        // ignore
      }
    }
  }

  public async deleteSubmissionByDeadlineAndStudent(deadlineId: string, studentEmail: string): Promise<void> {
    return this.deleteSubmission('', deadlineId, studentEmail);
  }

  // --- PRIVATE STUDENT NOTES ---
  public getPrivateNotes(studentEmail: string): PersonalTimetableNote[] {
    const allNotes = getLocal<PersonalTimetableNote[]>(KEYS.PRIVATE_NOTES, INITIAL_PRIVATE_NOTES);
    const studentNotes = allNotes.filter((n) => n.studentEmail.toLowerCase() === studentEmail.toLowerCase());

    const priorityWeights: Record<string, number> = {
      high: 1,
      medium: 2,
      low: 3,
    };

    return studentNotes.sort((a, b) => {
      // Completed items go after active items
      if (a.isDone !== b.isDone) {
        return a.isDone ? 1 : -1;
      }
      const weightA = priorityWeights[a.priority || 'medium'] || 2;
      const weightB = priorityWeights[b.priority || 'medium'] || 2;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return (a.date || '').localeCompare(b.date || '');
    });
  }

  public addPrivateNote(note: Omit<PersonalTimetableNote, 'id' | 'createdAt'>): PersonalTimetableNote {
    const newNote: PersonalTimetableNote = {
      ...note,
      id: `pnote-${Date.now()}`,
      isDone: note.isDone ?? false,
      priority: note.priority || 'medium',
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

  public toggleNoteDone(noteId: string): void {
    const allNotes = getLocal<PersonalTimetableNote[]>(KEYS.PRIVATE_NOTES, INITIAL_PRIVATE_NOTES);
    const updated = allNotes.map((n) => {
      if (n.id === noteId) {
        return { ...n, isDone: !n.isDone };
      }
      return n;
    });
    saveLocal(KEYS.PRIVATE_NOTES, updated);

    try {
      const target = updated.find((n) => n.id === noteId);
      if (target) {
        setDoc(doc(db, 'privateNotes', noteId), target);
      }
    } catch (err) {
      console.warn('Firestore toggleNoteDone sync error:', err);
    }
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

    const unsubSync = registerSyncListener<StudentCourseGrade[]>(KEYS.GRADES, callback);

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
      return () => {
        unsubSync();
        unsubscribe();
      };
    } catch {
      return unsubSync;
    }
  }

  public async updateGrade(grade: StudentCourseGrade): Promise<void> {
    const current = getLocal<StudentCourseGrade[]>(KEYS.GRADES, INITIAL_STUDENT_GRADES);
    const index = current.findIndex(
      (g) =>
        g.studentEmail.toLowerCase() === grade.studentEmail.toLowerCase() &&
        g.courseCode === grade.courseCode
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

  public async resetStudentCourseGrade(studentEmail: string, courseCode: string): Promise<void> {
    const current = getLocal<StudentCourseGrade[]>(KEYS.GRADES, INITIAL_STUDENT_GRADES);
    const target = current.find(
      (g) =>
        g.studentEmail.toLowerCase() === studentEmail.toLowerCase() &&
        g.courseCode === courseCode
    );

    const updated = current.filter(
      (g) =>
        !(
          g.studentEmail.toLowerCase() === studentEmail.toLowerCase() &&
          g.courseCode === courseCode
        )
    );
    saveLocal(KEYS.GRADES, updated);

    if (target) {
      try {
        await deleteDoc(doc(db, 'grades', target.id));
      } catch (err) {
        console.warn('Firestore resetStudentCourseGrade error:', err);
      }
    }
  }

  public async resetAllCourseGrades(courseCode: string): Promise<void> {
    const current = getLocal<StudentCourseGrade[]>(KEYS.GRADES, INITIAL_STUDENT_GRADES);
    const deletedTargets = current.filter((g) => g.courseCode === courseCode);
    const updated = current.filter((g) => g.courseCode !== courseCode);
    saveLocal(KEYS.GRADES, updated);

    for (const item of deletedTargets) {
      try {
        await deleteDoc(doc(db, 'grades', item.id));
      } catch (err) {
        console.warn('Firestore resetAllCourseGrades error:', err);
      }
    }
  }

  public async resetStudentKoko(studentEmail: string): Promise<void> {
    const currentKoko = getLocal<StudentKokoRecord[]>(KEYS.KOKO, []);
    const updatedKoko = currentKoko.filter(
      (k) => k.studentEmail.toLowerCase() !== studentEmail.toLowerCase()
    );
    saveLocal(KEYS.KOKO, updatedKoko);

    const currentSubs = getLocal<KokoSubmissionItem[]>(KEYS.KOKO_SUBMISSIONS, []);
    const updatedSubs = currentSubs.filter(
      (s) => s.studentEmail.toLowerCase() !== studentEmail.toLowerCase()
    );
    saveLocal(KEYS.KOKO_SUBMISSIONS, updatedSubs);

    try {
      await deleteDoc(doc(db, 'kokoRecords', `koko-${studentEmail.toLowerCase()}`));
    } catch (err) {
      console.warn('Firestore resetStudentKoko error:', err);
    }
  }

  public async resetAllKokoRecords(): Promise<void> {
    saveLocal(KEYS.KOKO, []);
    saveLocal(KEYS.KOKO_SUBMISSIONS, []);
  }

  // --- KOKO RECORDS ---
  public subscribeKokoRecords(callback: (records: StudentKokoRecord[]) => void): () => void {
    const localData = getLocal<StudentKokoRecord[]>(KEYS.KOKO, []);
    callback(localData);

    const unsubSync = registerSyncListener<StudentKokoRecord[]>(KEYS.KOKO, callback);

    try {
      const q = query(collection(db, 'kokoRecords'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: StudentKokoRecord[] = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            saveLocal(KEYS.KOKO, items);
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore kokoRecords listener fallback:', error.message);
        }
      );
      return () => {
        unsubSync();
        unsubscribe();
      };
    } catch {
      return unsubSync;
    }
  }

  public async saveStudentKoko(record: StudentKokoRecord): Promise<void> {
    const current = getLocal<StudentKokoRecord[]>(KEYS.KOKO, []);
    const index = current.findIndex(
      (r) => r.studentEmail.toLowerCase() === record.studentEmail.toLowerCase()
    );

    let updated: StudentKokoRecord[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = record;
    } else {
      updated = [record, ...current];
    }
    saveLocal(KEYS.KOKO, updated);

    try {
      await setDoc(doc(db, 'kokoRecords', record.id), record);
    } catch (err) {
      console.warn('Firestore saveStudentKoko sync error:', err);
    }
  }

  public async saveKokoRecord(record: StudentKokoRecord): Promise<void> {
    return this.saveStudentKoko(record);
  }

  public subscribeToKoko(callback: (records: StudentKokoRecord[]) => void) {
    return this.subscribeKokoRecords(callback);
  }

  // --- STUDENT KOKO SUBMISSIONS (Workflow: Student Submit -> Lecturer Review & Award -> Student Receive) ---
  public subscribeKokoSubmissions(callback: (items: KokoSubmissionItem[]) => void): () => void {
    const localData = getLocal<KokoSubmissionItem[]>(KEYS.KOKO_SUBMISSIONS, []);
    callback(localData);

    const unsubSync = registerSyncListener<KokoSubmissionItem[]>(KEYS.KOKO_SUBMISSIONS, callback);

    try {
      const q = query(collection(db, 'kokoSubmissions'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: KokoSubmissionItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          items.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          saveLocal(KEYS.KOKO_SUBMISSIONS, items);
          callback(items);
        },
        (error) => {
          console.warn('Firestore kokoSubmissions listener fallback:', error.message);
        }
      );
      return () => {
        unsubSync();
        unsubscribe();
      };
    } catch {
      return unsubSync;
    }
  }

  public async submitKokoActivity(
    submission: Omit<KokoSubmissionItem, 'id' | 'status' | 'submittedAt'>
  ): Promise<KokoSubmissionItem> {
    const newItem: KokoSubmissionItem = {
      ...submission,
      id: `koko-sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    const current = getLocal<KokoSubmissionItem[]>(KEYS.KOKO_SUBMISSIONS, []);
    const updated = [newItem, ...current];
    saveLocal(KEYS.KOKO_SUBMISSIONS, updated);

    try {
      await setDoc(doc(db, 'kokoSubmissions', newItem.id), newItem);
    } catch (err) {
      console.warn('Firestore submitKokoActivity error:', err);
    }
    return newItem;
  }

  public async reviewKokoSubmission(
    submissionId: string,
    status: 'approved' | 'rejected',
    awardedScore: number,
    reviewerName: string,
    subCategory?: string,
    rejectionReason?: string
  ): Promise<void> {
    const current = getLocal<KokoSubmissionItem[]>(KEYS.KOKO_SUBMISSIONS, []);
    const target = current.find((s) => s.id === submissionId);
    if (!target) return;

    const updatedItem: KokoSubmissionItem = {
      ...target,
      status,
      awardedScore: status === 'rejected' ? 0 : awardedScore,
      subCategory: subCategory || target.subCategory,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      rejectionReason: status === 'rejected' ? (rejectionReason || 'Maklumat atau lampiran tidak memenuhi kriteria.') : undefined,
    };

    const updated = current.map((s) => (s.id === submissionId ? updatedItem : s));
    saveLocal(KEYS.KOKO_SUBMISSIONS, updated);

    try {
      await setDoc(doc(db, 'kokoSubmissions', submissionId), updatedItem);
    } catch (err) {
      console.warn('Firestore reviewKokoSubmission error:', err);
    }

    // Automatically recalculate student's published koko marks when approved
    if (status === 'approved') {
      const allStudentSubmissions = updated.filter(
        (s) =>
          s.studentEmail.toLowerCase() === target.studentEmail.toLowerCase() &&
          s.status === 'approved'
      );

      let partScore = 0;
      let achScore = 0;
      let posScore = 0;

      for (const item of allStudentSubmissions) {
        const sc = item.awardedScore || 0;
        if (item.category === 'A') partScore = Math.min(1.0, Math.round((partScore + sc) * 1000) / 1000);
        if (item.category === 'B') achScore = Math.min(1.0, Math.round((achScore + sc) * 1000) / 1000);
        if (item.category === 'C') posScore = Math.min(1.0, Math.round((posScore + sc) * 1000) / 1000);
      }

      const existingKokoList = getLocal<StudentKokoRecord[]>(KEYS.KOKO, []);
      const existingKoko = existingKokoList.find(
        (k) => k.studentEmail.toLowerCase() === target.studentEmail.toLowerCase()
      );
      const jatiDiriScore = existingKoko?.jatiDiriScore ?? 7.0;
      const kokoActivitiesTotal = Math.min(3.0, Math.round((partScore + achScore + posScore) * 1000) / 1000);
      const totalKoko10 = Math.min(10.0, Math.round((jatiDiriScore + kokoActivitiesTotal) * 1000) / 1000);

      const grade = totalKoko10 >= 8.0 ? 'A' : totalKoko10 >= 7.0 ? 'A-' : totalKoko10 >= 6.0 ? 'B+' : 'B';
      const band = totalKoko10 >= 8.0 ? 'Band 1' : totalKoko10 >= 6.0 ? 'Band 2' : 'Band 3';

      const newRecord: StudentKokoRecord = {
        id: existingKoko ? existingKoko.id : `koko-${Date.now()}-${target.matricNumber.toLowerCase()}`,
        studentEmail: target.studentEmail,
        studentName: target.studentName,
        matricNumber: target.matricNumber,
        setNumber: target.setNumber,
        jatiDiriScore,
        kokoParticipation: partScore,
        kokoAchievement: achScore,
        kokoPosition: posScore,
        kokoActivitiesTotal,
        totalKoko10,
        totalScore: Number((totalKoko10 * 10).toFixed(1)),
        grade,
        band,
        isPublished: true,
        updatedBy: reviewerName,
        updatedAt: new Date().toISOString(),
      };

      await this.saveStudentKoko(newRecord);
    }
  }

  public async deleteKokoSubmission(id: string): Promise<void> {
    const current = getLocal<KokoSubmissionItem[]>(KEYS.KOKO_SUBMISSIONS, []);
    const target = current.find((s) => s.id === id);
    const updated = current.filter((s) => s.id !== id);
    saveLocal(KEYS.KOKO_SUBMISSIONS, updated);
    try {
      await deleteDoc(doc(db, 'kokoSubmissions', id));
    } catch (err) {
      console.warn('Firestore deleteKokoSubmission error:', err);
    }

    if (target && target.status === 'approved') {
      const remainingApproved = updated.filter(
        (s) =>
          s.studentEmail.toLowerCase() === target.studentEmail.toLowerCase() &&
          s.status === 'approved'
      );

      let partScore = 0;
      let achScore = 0;
      let posScore = 0;

      for (const item of remainingApproved) {
        const sc = item.awardedScore || 0;
        if (item.category === 'A') partScore = Math.min(1.0, Math.round((partScore + sc) * 1000) / 1000);
        if (item.category === 'B') achScore = Math.min(1.0, Math.round((achScore + sc) * 1000) / 1000);
        if (item.category === 'C') posScore = Math.min(1.0, Math.round((posScore + sc) * 1000) / 1000);
      }

      const existingKokoList = getLocal<StudentKokoRecord[]>(KEYS.KOKO, []);
      const existingKoko = existingKokoList.find(
        (k) => k.studentEmail.toLowerCase() === target.studentEmail.toLowerCase()
      );
      if (existingKoko) {
        const jatiDiriScore = existingKoko.jatiDiriScore ?? 7.0;
        const kokoActivitiesTotal = Math.min(3.0, Math.round((partScore + achScore + posScore) * 1000) / 1000);
        const totalKoko10 = Math.min(10.0, Math.round((jatiDiriScore + kokoActivitiesTotal) * 1000) / 1000);

        const newRecord: StudentKokoRecord = {
          ...existingKoko,
          kokoParticipation: partScore,
          kokoAchievement: achScore,
          kokoPosition: posScore,
          kokoActivitiesTotal,
          totalKoko10,
          totalScore: Number((totalKoko10 * 10).toFixed(1)),
          grade: totalKoko10 >= 8.0 ? 'A' : totalKoko10 >= 7.0 ? 'A-' : totalKoko10 >= 6.0 ? 'B+' : 'B',
          band: totalKoko10 >= 8.0 ? 'Band 1' : 'Band 2',
          updatedAt: new Date().toISOString(),
        };
        await this.saveStudentKoko(newRecord);
      }
    }
  }

  public async resetJatiDiriScore(studentEmail: string, reviewerName: string = 'Pensyarah'): Promise<void> {
    const current = getLocal<StudentKokoRecord[]>(KEYS.KOKO, []);
    const target = current.find((k) => k.studentEmail.toLowerCase() === studentEmail.toLowerCase());
    if (!target) return;

    const part = target.kokoParticipation ?? 0;
    const ach = target.kokoAchievement ?? 0;
    const pos = target.kokoPosition ?? 0;
    const kokoActivitiesTotal = Math.min(3.0, Math.round((part + ach + pos) * 1000) / 1000);

    const updatedRecord: StudentKokoRecord = {
      ...target,
      jatiDiriScore: 0,
      totalKoko10: kokoActivitiesTotal,
      totalScore: Number((kokoActivitiesTotal * 10).toFixed(1)),
      grade: kokoActivitiesTotal >= 8.0 ? 'A' : kokoActivitiesTotal >= 7.0 ? 'A-' : kokoActivitiesTotal >= 6.0 ? 'B+' : 'B',
      band: kokoActivitiesTotal >= 8.0 ? 'Band 1' : 'Band 2',
      updatedBy: reviewerName,
      updatedAt: new Date().toISOString(),
    };

    await this.saveStudentKoko(updatedRecord);
  }

  public async resetAllJatiDiriScores(reviewerName: string = 'Pensyarah', setNumber?: number): Promise<void> {
    const current = getLocal<StudentKokoRecord[]>(KEYS.KOKO, []);
    for (const item of current) {
      if (!setNumber || item.setNumber === setNumber) {
        await this.resetJatiDiriScore(item.studentEmail, reviewerName);
      }
    }
  }

  // --- FORUM POSTS ---
  public subscribeForumPosts(callback: (posts: ForumPost[]) => void): () => void {
    const localData = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    callback(localData);

    const unsubSync = registerSyncListener<ForumPost[]>(KEYS.FORUM, callback);

    try {
      const q = query(collection(db, 'forumPosts'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: ForumPost[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as any;
            const comments = Array.isArray(data.comments) ? data.comments : Array.isArray(data.replies) ? data.replies : [];
            items.push({
              id: docSnap.id,
              ...data,
              comments,
              replies: comments,
            });
          });
          if (items.length > 0) {
            saveLocal(KEYS.FORUM, items);
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore forum listener fallback:', error.message);
        }
      );
      return () => {
        unsubSync();
        unsubscribe();
      };
    } catch {
      return unsubSync;
    }
  }

  public async addForumPost(
    post: Omit<ForumPost, 'id' | 'createdAt' | 'likes' | 'comments' | 'replies'>
  ): Promise<ForumPost> {
    const newPost: ForumPost = {
      ...post,
      id: `post-${Date.now()}`,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      replies: [],
      reactions: [],
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

  public async addForumComment(
    postId: string,
    comment: {
      authorName: string;
      authorEmail: string;
      authorRole: any;
      authorSet?: string;
      content: string;
      imageUrl?: string;
      fileName?: string;
      fileUrl?: string;
    }
  ): Promise<void> {
    const current = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    const newComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...comment,
      createdAt: new Date().toISOString(),
      likes: 0,
      reactions: [],
    };

    const updated = current.map((p) => {
      if (p.id === postId) {
        const existingComments = Array.isArray(p.comments)
          ? p.comments
          : Array.isArray(p.replies)
          ? p.replies
          : [];
        const nextComments = [...existingComments, newComment];
        return {
          ...p,
          comments: nextComments,
          replies: nextComments,
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

  public async updateForumComment(
    postId: string,
    commentId: string,
    newContent: string
  ): Promise<void> {
    const current = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    const updated = current.map((p) => {
      if (p.id === postId) {
        const comments = (p.comments || p.replies || []).map((c) => {
          if (c.id === commentId) {
            return { ...c, content: newContent };
          }
          return c;
        });
        return { ...p, comments, replies: comments };
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
      console.warn('Firestore updateForumComment error:', err);
    }
  }

  public async deleteForumComment(postId: string, commentId: string): Promise<void> {
    const current = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    const updated = current.map((p) => {
      if (p.id === postId) {
        const comments = (p.comments || p.replies || []).filter((c) => c.id !== commentId);
        return { ...p, comments, replies: comments };
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
      console.warn('Firestore deleteForumComment error:', err);
    }
  }

  public async deleteReplyFromPost(postId: string, commentId: string): Promise<void> {
    return this.deleteForumComment(postId, commentId);
  }

  public async updateReplyInPost(postId: string, commentId: string, newContent: string): Promise<void> {
    return this.updateForumComment(postId, commentId, newContent);
  }

  public async togglePostReaction(
    postId: string,
    emoji: string,
    user: { name: string; email: string }
  ): Promise<void> {
    const current = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    const updated = current.map((p) => {
      if (p.id === postId) {
        const reactions: ForumReaction[] = p.reactions ? [...p.reactions] : [];
        const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

        if (existingIdx >= 0) {
          const userIdx = reactions[existingIdx].users.findIndex(
            (u) => u.email.toLowerCase() === user.email.toLowerCase()
          );
          if (userIdx >= 0) {
            reactions[existingIdx].users.splice(userIdx, 1);
            if (reactions[existingIdx].users.length === 0) {
              reactions.splice(existingIdx, 1);
            }
          } else {
            reactions[existingIdx].users.push(user);
          }
        } else {
          reactions.push({
            emoji,
            users: [user],
          });
        }
        return { ...p, reactions };
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
      console.warn('Firestore togglePostReaction error:', err);
    }
  }

  public async updatePost(postId: string, title: string, content: string): Promise<void> {
    const current = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    const updated = current.map((p) => {
      if (p.id === postId) {
        return { ...p, title, content };
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
      console.warn('Firestore updatePost error:', err);
    }
  }

  public async deletePost(postId: string): Promise<void> {
    const current = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    const updated = current.filter((p) => p.id !== postId);
    saveLocal(KEYS.FORUM, updated);
    try {
      await deleteDoc(doc(db, 'forumPosts', postId));
    } catch (err) {
      console.warn('Firestore deletePost error:', err);
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
      imageUrl?: string;
      fileName?: string;
      fileUrl?: string;
    }
  ): Promise<void> {
    return this.addForumComment(postId, comment);
  }

  public async saveStudentGrade(grade: StudentCourseGrade): Promise<void> {
    return this.updateGrade(grade);
  }

  // --- LIVE BROADCAST DISPATCHES (Lecturer to Student real-time sync with 24h auto-expiry) ---
  public subscribeBroadcasts(callback: (broadcasts: BroadcastNotice[]) => void): () => void {
    const rawLocal = getLocal<BroadcastNotice[]>(KEYS.BROADCASTS, INITIAL_BROADCASTS);
    const activeLocal = rawLocal.filter((b) => isWithin24Hours(b.createdAt));
    callback(activeLocal);

    const unsubSync = registerSyncListener<BroadcastNotice[]>(KEYS.BROADCASTS, (data) => {
      const active = (data || []).filter((b) => isWithin24Hours(b.createdAt));
      callback(active);
    });

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
            // Auto-filter 24-hour expiration & sort newest first
            const activeItems = items
              .filter((b) => isWithin24Hours(b.createdAt))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            saveLocal(KEYS.BROADCASTS, activeItems);
            callback(activeItems);
          } else {
            callback([]);
          }
        },
        (error) => {
          console.warn('Firestore broadcasts listener fallback:', error.message);
        }
      );
      return () => {
        unsubSync();
        unsubscribe();
      };
    } catch {
      return unsubSync;
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
    const activeExisting = current.filter((b) => isWithin24Hours(b.createdAt));
    const updated = [newItem, ...activeExisting];
    saveLocal(KEYS.BROADCASTS, updated);

    try {
      await setDoc(doc(db, 'broadcastNotices', newItem.id), newItem);
    } catch (err) {
      console.warn('Firestore addBroadcast sync error:', err);
    }

    return newItem;
  }

  public async deleteBroadcast(broadcastId: string): Promise<void> {
    const current = getLocal<BroadcastNotice[]>(KEYS.BROADCASTS, INITIAL_BROADCASTS);
    const updated = current.filter((b) => b.id !== broadcastId);
    saveLocal(KEYS.BROADCASTS, updated);

    try {
      await deleteDoc(doc(db, 'broadcastNotices', broadcastId));
    } catch (err) {
      console.warn('Firestore deleteBroadcast sync error:', err);
    }
  }

  public async cancelBroadcast(broadcastId: string): Promise<void> {
    return this.deleteBroadcast(broadcastId);
  }
}

export const dataService = new DataService();
