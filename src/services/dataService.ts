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
  AppNotification,
  UserProfile,
} from '../types.ts';
import { isWithin24Hours } from '../utils/dateUtils.ts';
import { getStudentSetNumber, isProgramCoordinator, isKokoCoordinator } from '../utils/studentUtils.ts';
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
  INITIAL_NOTIFICATIONS,
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
  NOTIFICATIONS: 'pintar_notifications_v1',
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

async function syncToServer(collectionKey: string, item: any) {
  try {
    await fetch(`/api/sync/${collectionKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
  } catch {}
}

async function fetchFromServer(collectionKey: string, callback: (items: any[]) => void) {
  try {
    const res = await fetch(`/api/sync/${collectionKey}`);
    const data = await res.json();
    if (data?.success && Array.isArray(data.items)) {
      callback(data.items);
    }
  } catch {}
}

function pollFromServer(collectionKey: string, callback: (items: any[]) => void): () => void {
  fetchFromServer(collectionKey, callback);
  const timer = setInterval(() => {
    fetchFromServer(collectionKey, callback);
  }, 2500);
  return () => clearInterval(timer);
}

function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj as any;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

function saveLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to localStorage, attempting lightweight fallback', err);
    try {
      if (Array.isArray(data)) {
        const lightweight = data.map((item: any) => {
          if (item && item.fileUrl && typeof item.fileUrl === 'string' && item.fileUrl.length > 200000) {
            return { ...item, fileUrl: item.externalUrl || '#' };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch {}
  }

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
  private mergeWithInitialResources(overrides: ResourceItem[]): ResourceItem[] {
    const deletedIds = new Set<string>(getLocal<string[]>('pintar_deleted_resource_ids', []));
    const map = new Map<string, ResourceItem>();

    INITIAL_RESOURCES.forEach((item) => {
      if (!deletedIds.has(item.id)) {
        map.set(item.id, { ...item });
      }
    });

    const currentLocal = getLocal<ResourceItem[]>(KEYS.RESOURCES, []);
    if (Array.isArray(currentLocal)) {
      currentLocal.forEach((item) => {
        if (item && item.id && !deletedIds.has(item.id)) {
          map.set(item.id, { ...map.get(item.id), ...item });
        }
      });
    }

    if (Array.isArray(overrides)) {
      overrides.forEach((item) => {
        if (item && item.id && !deletedIds.has(item.id)) {
          map.set(item.id, { ...map.get(item.id), ...item });
        }
      });
    }

    return Array.from(map.values());
  }

  public subscribeResources(callback: (resources: ResourceItem[]) => void): () => void {
    const rawLocal = getLocal<ResourceItem[]>(KEYS.RESOURCES, INITIAL_RESOURCES);
    const localData = this.mergeWithInitialResources(rawLocal);
    saveLocal(KEYS.RESOURCES, localData);
    callback(localData);

    const unsubSync = registerSyncListener<ResourceItem[]>(KEYS.RESOURCES, (items) => {
      const merged = this.mergeWithInitialResources(items || []);
      callback(merged);
    });

    try {
      const q = query(collection(db, 'resources'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: ResourceItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          const merged = this.mergeWithInitialResources(items);
          saveLocal(KEYS.RESOURCES, merged);
          callback(merged);
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
      (item) => item && item.id && !deletedIds.has(item.id)
    );
    const updated = [newItem, ...current];
    saveLocal(KEYS.RESOURCES, updated);

    // Prepare safe document for Firestore (prevent >1MB limit error on large Base64 dataUrls)
    let firestoreDoc = { ...newItem };
    if (firestoreDoc.fileUrl && firestoreDoc.fileUrl.length > 400000) {
      firestoreDoc = {
        ...firestoreDoc,
        fileUrl: firestoreDoc.externalUrl || '#',
      };
    }

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'resources', newItem.id), sanitizeForFirestore(firestoreDoc));
    } catch (err) {
      console.warn('Firestore addResource sync error:', err);
    }

    this.addNotification({
      recipientEmail: 'all',
      senderEmail: resource.uploaderEmail,
      targetSets: resource.targetSets,
      type: 'resource_uploaded',
      title: 'Nota & Bahan Pembelajaran Baharu',
      message: `${resource.uploadedBy} telah memuat naik bahan baharu: "${resource.title}" (${resource.subject}).`,
      linkTab: 'resources',
      senderName: resource.uploadedBy,
    });

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
      await setDoc(doc(db, 'deadlines', newItem.id), sanitizeForFirestore(newItem));
    } catch (err) {
      console.warn('Firestore addDeadline sync error:', err);
    }

    this.addNotification({
      recipientEmail: 'all',
      senderEmail: deadline.lecturerEmail,
      targetSets: deadline.targetSets,
      type: 'deadline_assigned',
      title: 'Tugasan & Tarikh Akhir Baharu',
      message: `${deadline.lecturerName} telah menugaskan "${deadline.title}" (${deadline.subject}) dengan tarikh akhir ${new Date(deadline.dueDate).toLocaleDateString('ms-MY')}.`,
      linkTab: 'timetable',
      senderName: deadline.lecturerName,
    });

    return newItem;
  }

  public async deleteDeadline(id: string): Promise<void> {
    const current = getLocal<DeadlineItem[]>(KEYS.DEADLINES, INITIAL_DEADLINES);
    const updated = current.filter((d) => d.id !== id);
    saveLocal(KEYS.DEADLINES, updated);

    // Automatically remove associated student submissions for this deadline
    const currentSubmissions = getLocal<SubmissionRecord[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    const updatedSubmissions = currentSubmissions.filter((s) => s.deadlineId !== id);
    saveLocal(KEYS.SUBMISSIONS, updatedSubmissions);

    try {
      await deleteDoc(doc(db, 'deadlines', id));
      const q = query(collection(db, 'submissions'), where('deadlineId', '==', id));
      const snaps = await getDocs(q);
      for (const d of snaps.docs) {
        await deleteDoc(doc(db, 'submissions', d.id));
      }
    } catch (err) {
      console.warn('Firestore deleteDeadline sync error:', err);
    }
  }

  // --- SUBMISSIONS ---
  public subscribeSubmissions(callback: (submissions: SubmissionRecord[]) => void): () => void {
    const localData = getLocal<SubmissionRecord[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS).map((sub) => ({
      ...sub,
      setNumber: getStudentSetNumber(sub),
    }));
    callback(localData);

    const stopPoll = pollFromServer('submissions', (serverItems) => {
      const mapped = serverItems.map((sub) => ({ ...sub, setNumber: getStudentSetNumber(sub) }));
      const current = getLocal<SubmissionRecord[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
      const map = new Map<string, SubmissionRecord>();
      mapped.forEach((item) => map.set(item.id, item));
      current.forEach((item) => {
        if (!map.has(item.id)) map.set(item.id, item);
      });
      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      saveLocal(KEYS.SUBMISSIONS, merged);
      callback(merged);
    });

    const unsubSync = registerSyncListener<SubmissionRecord[]>(KEYS.SUBMISSIONS, (data) => {
      callback((data || []).map((sub) => ({ ...sub, setNumber: getStudentSetNumber(sub) })));
    });

    try {
      const q = query(collection(db, 'submissions'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const remoteItems: SubmissionRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as any;
            remoteItems.push({
              id: docSnap.id,
              ...data,
              setNumber: getStudentSetNumber(data),
            });
          });

          remoteItems.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          saveLocal(KEYS.SUBMISSIONS, remoteItems);
          callback(remoteItems);
        },
        (error) => {
          console.warn('Firestore submissions listener fallback:', error.message);
        }
      );
      return () => {
        stopPoll();
        unsubSync();
        unsubscribe();
      };
    } catch {
      stopPoll();
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
    const resolvedSet = getStudentSetNumber({ setNumber, studentEmail, studentId, studentName });

    const submission: SubmissionRecord = {
      id: `sub-${Date.now()}`,
      deadlineId,
      studentId,
      studentName,
      studentEmail,
      setNumber: resolvedSet,
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
    syncToServer('submissions', submission);

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
      await setDoc(doc(db, 'submissions', submission.id), sanitizeForFirestore(submission));
    } catch (err) {
      console.warn('Firestore submitWork sync error:', err);
    }

    const deadlinesList = getLocal<DeadlineItem[]>(KEYS.DEADLINES, []);
    const matchingDeadline = deadlinesList.find((d) => d.id === deadlineId);

    // Notify the lecturer who assigned the deadline (plus Hub Admin)
    this.addNotification({
      recipientEmail: matchingDeadline?.lecturerEmail || 'all',
      targetLecturerEmail: matchingDeadline?.lecturerEmail,
      senderEmail: studentEmail,
      type: 'assignment_submitted',
      title: 'Tugasan Pelajar Dihantar',
      message: `${studentName} (Set ${resolvedSet}) telah menghantar tugasan untuk "${matchingDeadline ? matchingDeadline.title : 'Tugasan'}": ${fileName}.`,
      linkTab: 'timetable',
      senderName: studentName,
    });

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
      await setDoc(doc(db, 'grades', grade.id), sanitizeForFirestore(grade));
    } catch (err) {
      console.warn('Firestore updateGrade sync error:', err);
    }

    if (grade.isPublished) {
      this.addNotification({
        recipientEmail: grade.studentEmail,
        type: 'grade_published',
        title: 'Keputusan Gred Akademik Diterbitkan',
        message: `Markah dan gred untuk kursus ${grade.courseName} (${grade.courseCode}) telah dikemas kini oleh ${grade.updatedBy}.`,
        linkTab: 'gpa',
        senderName: grade.updatedBy,
      });
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
          const remoteItems: StudentKokoRecord[] = [];
          if (!snapshot.empty) {
            snapshot.forEach((docSnap) => {
              remoteItems.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
          }

          const currentLocal = getLocal<StudentKokoRecord[]>(KEYS.KOKO, []);
          const map = new Map<string, StudentKokoRecord>();
          remoteItems.forEach((item) => {
            const key = (item.studentEmail || item.matricNumber || item.id).toLowerCase();
            map.set(key, item);
          });
          currentLocal.forEach((item) => {
            const key = (item.studentEmail || item.matricNumber || item.id).toLowerCase();
            if (!map.has(key)) map.set(key, item);
          });

          const merged = Array.from(map.values());
          saveLocal(KEYS.KOKO, merged);
          callback(merged);
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
    const cleanEmail = (record.studentEmail || '').trim().toLowerCase();
    const cleanMatric = (record.matricNumber || cleanEmail.split('@')[0] || '').trim().toUpperCase();

    const normalizedRecord: StudentKokoRecord = {
      ...record,
      studentEmail: cleanEmail,
      matricNumber: cleanMatric,
      id: record.id || `koko-rec-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    };

    const current = getLocal<StudentKokoRecord[]>(KEYS.KOKO, []);
    const index = current.findIndex((r) => {
      const rEmail = (r.studentEmail || '').trim().toLowerCase();
      const rMatric = (r.matricNumber || '').trim().toUpperCase();
      return (cleanEmail && rEmail === cleanEmail) || (cleanMatric && rMatric === cleanMatric);
    });

    let updated: StudentKokoRecord[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = normalizedRecord;
    } else {
      updated = [normalizedRecord, ...current];
    }
    saveLocal(KEYS.KOKO, updated);

    try {
      await setDoc(doc(db, 'kokoRecords', normalizedRecord.id), sanitizeForFirestore(normalizedRecord));
    } catch (err) {
      console.warn('Firestore saveStudentKoko sync error:', err);
    }

    if (normalizedRecord.isPublished) {
      this.addNotification({
        recipientEmail: cleanEmail,
        type: 'koko_reviewed',
        title: 'Markah Kokurikulum & Jati Diri Diterbitkan',
        message: `Markah Kokurikulum & Jati Diri UKM anda (Jumlah: ${normalizedRecord.totalKoko10 ?? normalizedRecord.totalScore}%) telah dikemas kini oleh ${normalizedRecord.updatedBy}.`,
        linkTab: 'koko',
        senderName: normalizedRecord.updatedBy,
      });
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
    const localData = getLocal<KokoSubmissionItem[]>(KEYS.KOKO_SUBMISSIONS, []).map((sub) => ({
      ...sub,
      setNumber: getStudentSetNumber(sub),
    }));
    callback(localData);

    const stopPoll = pollFromServer('kokoSubmissions', (serverItems) => {
      const mapped = serverItems.map((sub) => ({ ...sub, setNumber: getStudentSetNumber(sub) }));
      const current = getLocal<KokoSubmissionItem[]>(KEYS.KOKO_SUBMISSIONS, []);
      const map = new Map<string, KokoSubmissionItem>();
      mapped.forEach((item) => map.set(item.id, item));
      current.forEach((item) => {
        if (!map.has(item.id)) map.set(item.id, item);
      });
      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      saveLocal(KEYS.KOKO_SUBMISSIONS, merged);
      callback(merged);
    });

    const unsubSync = registerSyncListener<KokoSubmissionItem[]>(KEYS.KOKO_SUBMISSIONS, (data) => {
      callback((data || []).map((sub) => ({ ...sub, setNumber: getStudentSetNumber(sub) })));
    });

    try {
      const q = query(collection(db, 'kokoSubmissions'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const remoteItems: KokoSubmissionItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as any;
            remoteItems.push({
              id: docSnap.id,
              ...data,
              setNumber: getStudentSetNumber(data),
            });
          });

          const currentLocal = getLocal<KokoSubmissionItem[]>(KEYS.KOKO_SUBMISSIONS, []);
          const map = new Map<string, KokoSubmissionItem>();
          remoteItems.forEach((item) => map.set(item.id, item));
          currentLocal.forEach((item) => {
            if (!map.has(item.id)) map.set(item.id, item);
          });

          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          saveLocal(KEYS.KOKO_SUBMISSIONS, merged);
          callback(merged);
        },
        (error) => {
          console.warn('Firestore kokoSubmissions listener fallback:', error.message);
        }
      );
      return () => {
        stopPoll();
        unsubSync();
        unsubscribe();
      };
    } catch {
      stopPoll();
      return unsubSync;
    }
  }

  public async submitKokoActivity(
    submission: Omit<KokoSubmissionItem, 'id' | 'status' | 'submittedAt'>
  ): Promise<KokoSubmissionItem> {
    const resolvedSet = getStudentSetNumber({
      setNumber: submission.setNumber,
      matricNumber: submission.matricNumber,
      studentEmail: submission.studentEmail,
      studentName: submission.studentName,
    });

    const newItem: KokoSubmissionItem = {
      ...submission,
      setNumber: resolvedSet,
      id: `koko-sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    const current = getLocal<KokoSubmissionItem[]>(KEYS.KOKO_SUBMISSIONS, []);
    const updated = [newItem, ...current];
    saveLocal(KEYS.KOKO_SUBMISSIONS, updated);
    syncToServer('kokoSubmissions', newItem);

    // Prepare bounded copy for remote Firestore to guarantee setDoc success (<1MB limit)
    const firestoreDoc = { ...newItem };
    if (firestoreDoc.certificateFileUrl && firestoreDoc.certificateFileUrl.length > 600000) {
      firestoreDoc.certificateFileUrl = firestoreDoc.certificateFileUrl.substring(0, 600000);
    }

    try {
      await setDoc(doc(db, 'kokoSubmissions', newItem.id), sanitizeForFirestore(firestoreDoc));
    } catch (err) {
      console.warn('Firestore submitKokoActivity error:', err);
    }

    this.addNotification({
      recipientEmail: 'all',
      senderEmail: submission.studentEmail,
      type: 'koko_submitted',
      title: 'Permohonan Aktiviti KOKO Baharu',
      message: `${submission.studentName} (${submission.studentEmail}) telah menghantar permohonan pengiktirafan aktiviti "${submission.activityName}".`,
      linkTab: 'koko',
      senderName: submission.studentName,
    });

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
      await setDoc(doc(db, 'kokoSubmissions', submissionId), sanitizeForFirestore(updatedItem));
    } catch (err) {
      console.warn('Firestore reviewKokoSubmission error:', err);
    }

    this.addNotification({
      recipientEmail: target.studentEmail,
      type: 'koko_reviewed',
      title: `Permohonan KOKO ${status === 'approved' ? 'Diluluskan' : 'Ditolak'}`,
      message: `Permohonan aktiviti "${target.activityName}" anda telah ${status === 'approved' ? `diluluskan (Markah: +${awardedScore})` : 'ditolak'} oleh ${reviewerName}.`,
      linkTab: 'koko',
      senderName: reviewerName,
    });

    // Automatically recalculate student's published koko marks when approved
    if (status === 'approved') {
      const targetEmail = (target.studentEmail || '').trim().toLowerCase();
      const targetMatric = (target.matricNumber || '').trim().toUpperCase();

      const allStudentSubmissions = updated.filter((s) => {
        if (s.status !== 'approved') return false;
        const sEmail = (s.studentEmail || '').trim().toLowerCase();
        const sMatric = (s.matricNumber || '').trim().toUpperCase();
        return (targetEmail && sEmail === targetEmail) || (targetMatric && sMatric === targetMatric);
      });

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
      const existingKoko = existingKokoList.find((k) => {
        const kEmail = (k.studentEmail || '').trim().toLowerCase();
        const kMatric = (k.matricNumber || '').trim().toUpperCase();
        return (targetEmail && kEmail === targetEmail) || (targetMatric && kMatric === targetMatric);
      });
      const jatiDiriScore = existingKoko?.jatiDiriScore ?? null;
      const kokoActivitiesTotal = Math.min(3.0, Math.round((partScore + achScore + posScore) * 1000) / 1000);
      const hasJatiDiri = jatiDiriScore !== null && jatiDiriScore !== undefined && Number(jatiDiriScore) > 0;
      const totalKoko10 = hasJatiDiri || kokoActivitiesTotal > 0
        ? Math.min(10.0, Math.round(((hasJatiDiri ? Number(jatiDiriScore) : 0) + kokoActivitiesTotal) * 1000) / 1000)
        : (null as any);

      const grade = totalKoko10 !== null
        ? (totalKoko10 >= 8.0 ? 'A' : totalKoko10 >= 7.0 ? 'A-' : totalKoko10 >= 6.0 ? 'B+' : 'B')
        : (null as any);
      const band = totalKoko10 !== null
        ? (totalKoko10 >= 8.0 ? 'Band 1' : totalKoko10 >= 6.0 ? 'Band 2' : 'Band 3')
        : (null as any);

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
        const jatiDiriScore = existingKoko.jatiDiriScore ?? null;
        const kokoActivitiesTotal = Math.min(3.0, Math.round((partScore + achScore + posScore) * 1000) / 1000);
        const hasJatiDiri = jatiDiriScore !== null && jatiDiriScore !== undefined && Number(jatiDiriScore) > 0;
        const totalKoko10 = hasJatiDiri || kokoActivitiesTotal > 0
          ? Math.min(10.0, Math.round(((hasJatiDiri ? Number(jatiDiriScore) : 0) + kokoActivitiesTotal) * 1000) / 1000)
          : (null as any);

        const newRecord: StudentKokoRecord = {
          ...existingKoko,
          jatiDiriScore,
          kokoParticipation: partScore,
          kokoAchievement: achScore,
          kokoPosition: posScore,
          kokoActivitiesTotal,
          totalKoko10,
          totalScore: totalKoko10 !== null ? Number((totalKoko10 * 10).toFixed(1)) : (null as any),
          grade: totalKoko10 !== null ? (totalKoko10 >= 8.0 ? 'A' : totalKoko10 >= 7.0 ? 'A-' : totalKoko10 >= 6.0 ? 'B+' : 'B') : (null as any),
          band: totalKoko10 !== null ? (totalKoko10 >= 8.0 ? 'Band 1' : 'Band 2') : (null as any),
          updatedAt: new Date().toISOString(),
        };
        await this.saveStudentKoko(newRecord);
      }
    }
  }

  public async resetJatiDiriScore(studentEmail: string, reviewerName: string = 'Pensyarah'): Promise<void> {
    const current = getLocal<StudentKokoRecord[]>(KEYS.KOKO, []);
    const target = current.find((k) => k.studentEmail.toLowerCase() === studentEmail.toLowerCase());

    const studentInfo = target || this.findStudentByEmail(studentEmail);
    const setNumber = target?.setNumber || (studentInfo as any)?.setNumber || 3;
    const studentName = target?.studentName || (studentInfo as any)?.name || 'Pelajar';
    const matricNumber = target?.matricNumber || (studentInfo as any)?.matricNumber || '';

    const part = target?.kokoParticipation ?? 0;
    const ach = target?.kokoAchievement ?? 0;
    const pos = target?.kokoPosition ?? 0;
    const kokoActivitiesTotal = Math.min(3.0, Math.round((part + ach + pos) * 1000) / 1000);

    const updatedRecord: StudentKokoRecord = {
      id: target?.id || `koko-rec-${studentEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      studentEmail: studentEmail.toLowerCase(),
      studentName: studentName,
      matricNumber: matricNumber,
      setNumber: setNumber,
      kokoParticipation: part,
      kokoAchievement: ach,
      kokoPosition: pos,
      kokoActivitiesTotal: kokoActivitiesTotal,
      jatiDiriScore: null as any,
      totalKoko10: kokoActivitiesTotal > 0 ? kokoActivitiesTotal : (null as any),
      totalScore: kokoActivitiesTotal > 0 ? Number((kokoActivitiesTotal * 10).toFixed(1)) : (null as any),
      grade: kokoActivitiesTotal >= 8.0 ? 'A' : kokoActivitiesTotal >= 7.0 ? 'A-' : kokoActivitiesTotal >= 6.0 ? 'B+' : (null as any),
      band: kokoActivitiesTotal >= 8.0 ? 'Band 1' : (null as any),
      isPublished: true,
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
    const deletedIds = new Set<string>(getLocal<string[]>('pintar_deleted_post_ids', []));
    const localData = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS).filter(
      (p) => !deletedIds.has(p.id)
    );
    callback(localData);

    const unsubSync = registerSyncListener<ForumPost[]>(KEYS.FORUM, (data) => {
      const currentDeleted = new Set<string>(getLocal<string[]>('pintar_deleted_post_ids', []));
      callback((data || []).filter((p) => !currentDeleted.has(p.id)));
    });

    try {
      const q = query(collection(db, 'forumPosts'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const currentDeleted = new Set<string>(getLocal<string[]>('pintar_deleted_post_ids', []));
          const remoteItems: ForumPost[] = [];
          snapshot.forEach((docSnap) => {
            if (!currentDeleted.has(docSnap.id)) {
              const data = docSnap.data() as any;
              const comments = Array.isArray(data.comments)
                ? data.comments
                : Array.isArray(data.replies)
                ? data.replies
                : [];
              remoteItems.push({
                id: docSnap.id,
                ...data,
                comments,
                replies: comments,
              });
            }
          });

          remoteItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          saveLocal(KEYS.FORUM, remoteItems);
          callback(remoteItems);
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
      await setDoc(doc(db, 'forumPosts', newPost.id), sanitizeForFirestore(newPost));
    } catch (err) {
      console.warn('Firestore addForumPost sync error:', err);
    }

    this.addNotification({
      recipientEmail: 'all',
      type: 'community_reply',
      title: 'Topik Perbincangan Komuniti Baharu',
      message: `${newPost.authorName} memulakan perbincangan baharu: "${newPost.title}".`,
      linkTab: 'community',
      senderName: newPost.authorName,
    });

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
        await setDoc(doc(db, 'forumPosts', postId), sanitizeForFirestore(target));
        this.addNotification({
          recipientEmail: target.authorEmail,
          type: 'community_reply',
          title: 'Balasan Baharu di Perbincangan Anda',
          message: `${comment.authorName} telah membalas topik anda "${target.title}": "${comment.content.slice(0, 50)}..."`,
          linkTab: 'community',
          senderName: comment.authorName,
        });
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
        await setDoc(doc(db, 'forumPosts', postId), sanitizeForFirestore(target));
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
        await setDoc(doc(db, 'forumPosts', postId), sanitizeForFirestore(target));
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
        await setDoc(doc(db, 'forumPosts', postId), sanitizeForFirestore(target));
        if (target.authorEmail.toLowerCase() !== user.email.toLowerCase()) {
          this.addNotification({
            recipientEmail: target.authorEmail,
            type: 'community_reaction',
            title: 'Reaksi Emoji Baharu',
            message: `${user.name} memberikan reaksi ${emoji} pada perbincangan anda "${target.title}".`,
            linkTab: 'community',
            senderName: user.name,
          });
        }
      }
    } catch (err) {
      console.warn('Firestore togglePostReaction error:', err);
    }
  }

  public async toggleCommentReaction(
    postId: string,
    commentId: string,
    emoji: string,
    user: { name: string; email: string }
  ): Promise<void> {
    const current = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    let targetCommentAuthorEmail = '';

    const updated = current.map((p) => {
      if (p.id === postId) {
        const comments = (p.comments || p.replies || []).map((c) => {
          if (c.id === commentId) {
            targetCommentAuthorEmail = c.authorEmail;
            const reactions: ForumReaction[] = c.reactions ? [...c.reactions] : [];
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
              reactions.push({ emoji, users: [user] });
            }
            return { ...c, reactions };
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
        await setDoc(doc(db, 'forumPosts', postId), sanitizeForFirestore(target));
        if (targetCommentAuthorEmail && targetCommentAuthorEmail.toLowerCase() !== user.email.toLowerCase()) {
          this.addNotification({
            recipientEmail: targetCommentAuthorEmail,
            type: 'community_reaction',
            title: 'Reaksi Emoji pada Komen Anda',
            message: `${user.name} memberikan reaksi ${emoji} pada balasan anda di topik "${target.title}".`,
            linkTab: 'community',
            senderName: user.name,
          });
        }
      }
    } catch (err) {
      console.warn('Firestore toggleCommentReaction error:', err);
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
        await setDoc(doc(db, 'forumPosts', postId), sanitizeForFirestore(target));
      }
    } catch (err) {
      console.warn('Firestore updatePost error:', err);
    }
  }

  public async deletePost(postId: string): Promise<void> {
    const deletedIds = new Set<string>(getLocal<string[]>('pintar_deleted_post_ids', []));
    deletedIds.add(postId);
    saveLocal('pintar_deleted_post_ids', Array.from(deletedIds));

    const current = getLocal<ForumPost[]>(KEYS.FORUM, INITIAL_FORUM_POSTS);
    const updated = current.filter((p) => p.id !== postId && !deletedIds.has(p.id));
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
  private broadcastListeners = new Set<(broadcasts: BroadcastNotice[]) => void>();

  private filterValidBroadcasts(list: BroadcastNotice[]): BroadcastNotice[] {
    const cancelledIds = new Set(getLocal<string[]>('pintar_cancelled_broadcast_ids', []));
    return (list || [])
      .filter((b) => !cancelledIds.has(b.id) && isWithin24Hours(b.createdAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private notifyBroadcastListeners(broadcasts: BroadcastNotice[]) {
    this.broadcastListeners.forEach((cb) => {
      try {
        cb(broadcasts);
      } catch (e) {
        console.error('Error notifying broadcast listener', e);
      }
    });
  }

  public subscribeBroadcasts(callback: (broadcasts: BroadcastNotice[]) => void): () => void {
    this.broadcastListeners.add(callback);

    const rawLocal = getLocal<BroadcastNotice[]>(KEYS.BROADCASTS, INITIAL_BROADCASTS);
    callback(this.filterValidBroadcasts(rawLocal));

    const unsubSync = registerSyncListener<BroadcastNotice[]>(KEYS.BROADCASTS, (data) => {
      callback(this.filterValidBroadcasts(data));
    });

    const unsubCancelled = registerSyncListener<string[]>('pintar_cancelled_broadcast_ids', () => {
      const curr = getLocal<BroadcastNotice[]>(KEYS.BROADCASTS, INITIAL_BROADCASTS);
      callback(this.filterValidBroadcasts(curr));
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
            const activeItems = this.filterValidBroadcasts(items);
            saveLocal(KEYS.BROADCASTS, activeItems);
            callback(activeItems);
          }
        },
        (error) => {
          console.warn('Firestore broadcasts listener fallback:', error.message);
        }
      );
      return () => {
        this.broadcastListeners.delete(callback);
        unsubSync();
        unsubCancelled();
        unsubscribe();
      };
    } catch {
      return () => {
        this.broadcastListeners.delete(callback);
        unsubSync();
        unsubCancelled();
      };
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
    this.notifyBroadcastListeners(this.filterValidBroadcasts(updated));

    try {
      await setDoc(doc(db, 'broadcastNotices', newItem.id), newItem);
    } catch (err) {
      console.warn('Firestore addBroadcast sync error:', err);
    }

    this.addNotification({
      recipientEmail: 'all',
      type: 'broadcast',
      title: `Pengumuman Siren: ${newItem.title}`,
      message: `${newItem.senderName}: ${newItem.message}`,
      linkTab: 'dashboard',
      senderName: newItem.senderName,
    });

    return newItem;
  }

  public async deleteBroadcast(broadcastId: string): Promise<void> {
    const cancelledIds = getLocal<string[]>('pintar_cancelled_broadcast_ids', []);
    if (!cancelledIds.includes(broadcastId)) {
      cancelledIds.push(broadcastId);
      saveLocal('pintar_cancelled_broadcast_ids', cancelledIds);
    }

    const current = getLocal<BroadcastNotice[]>(KEYS.BROADCASTS, INITIAL_BROADCASTS);
    const updated = current.filter((b) => b.id !== broadcastId && !cancelledIds.includes(b.id));
    saveLocal(KEYS.BROADCASTS, updated);

    // Immediately notify all active listeners
    this.notifyBroadcastListeners(this.filterValidBroadcasts(updated));

    try {
      await deleteDoc(doc(db, 'broadcastNotices', broadcastId));
    } catch (err) {
      console.warn('Firestore deleteBroadcast sync error:', err);
    }
  }

  public async cancelBroadcast(broadcastId: string): Promise<void> {
    return this.deleteBroadcast(broadcastId);
  }

  // --- REAL-TIME IN-APP & EMAIL NOTIFICATIONS ---
  public subscribeNotifications(
    targetUser: string | UserProfile,
    callback: (notifications: AppNotification[]) => void
  ): () => void {
    const cleanUserEmail = (typeof targetUser === 'string' ? targetUser : targetUser.email || '').toLowerCase();
    const isStudentByEmail = cleanUserEmail.endsWith('@siswa.ukm.edu.my');
    const userRole = typeof targetUser === 'string' ? (isStudentByEmail ? 'student' : 'lecturer') : targetUser.role;
    const isStudentRole = userRole === 'student' || isStudentByEmail;
    const isLecturerRole = userRole === 'lecturer' && !isStudentByEmail;
    const isPusatHubAdmin = cleanUserEmail === 'asasipintarhub@gmail.com' || isProgramCoordinator(cleanUserEmail);
    const studentSet = getStudentSetNumber(typeof targetUser === 'string' ? cleanUserEmail : targetUser);

    const deletedIds = new Set<string>(getLocal<string[]>('pintar_deleted_notif_ids', []));
    const rawLocal = getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);

    const filterUserNotifs = (list: AppNotification[]) =>
      (list || []).filter((n) => {
        if (deletedIds.has(n.id)) return false;

        // Do NOT show notification to the user who created it (e.g. Lecturer uploading material / assignment)
        if (n.senderEmail && n.senderEmail.toLowerCase() === cleanUserEmail) {
          return false;
        }

        // Check explicit recipient email
        if (n.recipientEmail && n.recipientEmail !== 'all' && n.recipientEmail.toLowerCase() !== cleanUserEmail) {
          return false;
        }

        // Student Set Filtering:
        if (isStudentRole && n.targetSets && n.targetSets.length > 0) {
          const isTargeted = n.targetSets.some((ts) => {
            const lowerTs = ts.toLowerCase().trim();
            if (lowerTs === 'all' || lowerTs === 'set all') return true;
            const match = lowerTs.match(/\d+/);
            if (match) {
              return Number(match[0]) === studentSet;
            }
            return lowerTs === String(studentSet) || lowerTs === `set ${studentSet}`;
          });
          if (!isTargeted) return false;
        }

        // Lecturer Submission Filtering:
        if (isLecturerRole) {
          if (n.type === 'assignment_submitted') {
            if (isPusatHubAdmin) return true;
            if (
              n.targetLecturerEmail &&
              n.targetLecturerEmail.toLowerCase() !== cleanUserEmail &&
              n.recipientEmail.toLowerCase() !== cleanUserEmail
            ) {
              return false;
            }
          }
          if (n.type === 'koko_submitted') {
            if (isPusatHubAdmin || isKokoCoordinator(cleanUserEmail)) return true;
            return false;
          }
        }

        return true;
      });

    callback(filterUserNotifs(rawLocal));

    const stopPoll = pollFromServer('notifications', (serverItems) => {
      const activeDeleted = new Set<string>(getLocal<string[]>('pintar_deleted_notif_ids', []));
      const currentLocal = getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
      const map = new Map<string, AppNotification>();
      serverItems.forEach((item) => {
        if (!activeDeleted.has(item.id)) map.set(item.id, item);
      });
      currentLocal.forEach((item) => {
        if (!map.has(item.id) && !activeDeleted.has(item.id)) {
          map.set(item.id, item);
        }
      });
      const merged = Array.from(map.values()).filter((n) => !activeDeleted.has(n.id));
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveLocal(KEYS.NOTIFICATIONS, merged);
      callback(filterUserNotifs(merged));
    });

    const unsubSync = registerSyncListener<AppNotification[]>(KEYS.NOTIFICATIONS, (data) => {
      const activeDeleted = new Set<string>(getLocal<string[]>('pintar_deleted_notif_ids', []));
      const filtered = (data || []).filter((n) => !activeDeleted.has(n.id));
      callback(filterUserNotifs(filtered));
    });

    try {
      const q = query(collection(db, 'notifications'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const activeDeleted = new Set<string>(getLocal<string[]>('pintar_deleted_notif_ids', []));
          const remoteItems: AppNotification[] = [];
          snapshot.forEach((docSnap) => {
            if (!activeDeleted.has(docSnap.id)) {
              remoteItems.push({ id: docSnap.id, ...(docSnap.data() as any) });
            }
          });

          const currentLocal = getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
          const map = new Map<string, AppNotification>();
          remoteItems.forEach((item) => map.set(item.id, item));
          currentLocal.forEach((item) => {
            if (!map.has(item.id) && !activeDeleted.has(item.id)) {
              map.set(item.id, item);
            }
          });

          const merged = Array.from(map.values()).filter((n) => !activeDeleted.has(n.id));
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          saveLocal(KEYS.NOTIFICATIONS, merged);
          callback(filterUserNotifs(merged));
        },
        (error) => {
          console.warn('Firestore notifications listener fallback:', error.message);
        }
      );
      return () => {
        stopPoll();
        unsubSync();
        unsubscribe();
      };
    } catch {
      stopPoll();
      return unsubSync;
    }
  }

  public async addNotification(
    notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>
  ): Promise<AppNotification> {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    const current = getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = [newNotif, ...current];
    saveLocal(KEYS.NOTIFICATIONS, updated);
    syncToServer('notifications', newNotif);

    try {
      await setDoc(doc(db, 'notifications', newNotif.id), sanitizeForFirestore(newNotif));
    } catch (err) {
      console.warn('Firestore addNotification sync error:', err);
    }

    return newNotif;
  }

  public async markNotificationRead(id: string): Promise<void> {
    const current = getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveLocal(KEYS.NOTIFICATIONS, updated);

    try {
      const target = updated.find((n) => n.id === id);
      if (target) {
        await setDoc(doc(db, 'notifications', id), sanitizeForFirestore(target));
      }
    } catch (err) {
      console.warn('Firestore markNotificationRead error:', err);
    }
  }

  public async markAllNotificationsRead(userEmail: string): Promise<void> {
    const current = getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = current.map((n) => {
      if (
        !n.recipientEmail ||
        n.recipientEmail === 'all' ||
        n.recipientEmail.toLowerCase() === (userEmail || '').toLowerCase()
      ) {
        return { ...n, isRead: true };
      }
      return n;
    });
    saveLocal(KEYS.NOTIFICATIONS, updated);
  }

  public async deleteNotification(id: string): Promise<void> {
    const deletedIds = new Set<string>(getLocal<string[]>('pintar_deleted_notif_ids', []));
    deletedIds.add(id);
    saveLocal('pintar_deleted_notif_ids', Array.from(deletedIds));

    const current = getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = current.filter((n) => n.id !== id);
    saveLocal(KEYS.NOTIFICATIONS, updated);

    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.warn('Firestore deleteNotification error:', err);
    }
  }

  public async clearAllNotifications(userEmail: string): Promise<void> {
    const current = getLocal<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const userNotifs = current.filter(
      (n) =>
        !n.recipientEmail ||
        n.recipientEmail === 'all' ||
        n.recipientEmail.toLowerCase() === (userEmail || '').toLowerCase()
    );

    const deletedIds = new Set<string>(getLocal<string[]>('pintar_deleted_notif_ids', []));
    userNotifs.forEach((n) => deletedIds.add(n.id));
    saveLocal('pintar_deleted_notif_ids', Array.from(deletedIds));

    const updated = current.filter((n) => !deletedIds.has(n.id));
    saveLocal(KEYS.NOTIFICATIONS, updated);

    for (const notif of userNotifs) {
      try {
        await deleteDoc(doc(db, 'notifications', notif.id));
      } catch {}
    }
  }

  public subscribeToNotifications(targetUser: string | UserProfile, cb: (n: AppNotification[]) => void) {
    return this.subscribeNotifications(targetUser, cb);
  }
}

export const dataService = new DataService();
