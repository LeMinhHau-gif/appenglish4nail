import {
  db,
  auth,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { AdminUser, LearnerHistoryRecord, SubscriptionPlanId, SubscriptionRequest } from '../types/rbac';

export class FirestoreSyncService {
  /**
   * Sync or create user profile in Firestore
   */
  public static async syncUserProfile(user: Partial<AdminUser> & { id: string; email: string }): Promise<AdminUser> {
    const userRef = doc(db, 'users', user.id);
    const path = `users/${user.id}`;
    try {
      const snap = await getDoc(userRef);
      const isSuperAdminEmail =
        user.email === 'leminhhaukrb16@gmail.com' ||
        user.email === 'superadmin@nailspeak.pro' ||
        user.email === 'admin@nailspeak.pro';

      if (snap.exists()) {
        const existingData = snap.data() as AdminUser;
        const updates: Partial<AdminUser> = {
          lastLogin: new Date().toISOString(),
          avatarUrl: user.avatarUrl || existingData.avatarUrl,
        };
        // Auto grant admin if matches developer email and not already
        if (isSuperAdminEmail && existingData.role !== 'super_admin') {
          updates.role = 'super_admin';
        }
        await updateDoc(userRef, updates);
        return { ...existingData, ...updates };
      } else {
        const newUser: AdminUser = {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          email: user.email.toLowerCase(),
          role: isSuperAdminEmail ? 'super_admin' : (user.role || 'learner'),
          status: 'active',
          salonName: user.salonName || 'Nail Studio Member',
          salonLocation: user.salonLocation || 'Hoa Kỳ',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          totalXp: user.totalXp || 0,
          streakDays: user.streakDays || 1,
          completedLessonsCount: user.completedLessonsCount || 0,
          avgPronunciationScore: user.avgPronunciationScore || 80,
          avatarUrl: user.avatarUrl || '',
          authProvider: 'google',
          subscriptionStatus: 'none',
          subscriptionPlan: 'free',
        };
        await setDoc(userRef, newUser);
        return newUser;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  }

  /**
   * Record learner history in Firestore
   */
  public static async recordLearnerHistory(record: Omit<LearnerHistoryRecord, 'id' | 'timestamp'> & { id?: string }): Promise<LearnerHistoryRecord> {
    const id = record.id || `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const fullRecord: LearnerHistoryRecord = {
      ...record,
      id,
      timestamp: new Date().toISOString(),
    };
    const path = `learnerHistory/${id}`;
    try {
      await setDoc(doc(db, 'learnerHistory', id), fullRecord);
      return fullRecord;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  }

  /**
   * Save a subscription request to Firestore
   */
  public static async registerSubscription(
    user: AdminUser,
    planId: SubscriptionPlanId,
    priceUsd: number,
    planName: string,
    note?: string
  ): Promise<SubscriptionRequest> {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const request: SubscriptionRequest = {
      id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      salonName: user.salonName,
      salonLocation: user.salonLocation,
      planId,
      planName,
      priceUsd,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      note,
    };
    const path = `subscriptions/${id}`;
    try {
      await setDoc(doc(db, 'subscriptions', id), request);

      // Also update user document
      await updateDoc(doc(db, 'users', user.id), {
        subscriptionStatus: 'pending',
        subscriptionRequestedPlan: planId,
      });

      return request;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  }

  /**
   * Get all subscriptions for Admin
   */
  public static async getSubscriptions(): Promise<SubscriptionRequest[]> {
    const path = 'subscriptions';
    try {
      const snap = await getDocs(collection(db, path));
      const list: SubscriptionRequest[] = [];
      snap.forEach((d) => {
        list.push(d.data() as SubscriptionRequest);
      });
      return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  /**
   * Approve a subscription request in Firestore
   */
  public static async approveSubscription(requestId: string, adminName: string): Promise<void> {
    const subRef = doc(db, 'subscriptions', requestId);
    const path = `subscriptions/${requestId}`;
    try {
      const snap = await getDoc(subRef);
      if (!snap.exists()) throw new Error('Không tìm thấy yêu cầu đăng ký');
      const sub = snap.data() as SubscriptionRequest;

      await updateDoc(subRef, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminName,
      });

      // Update user
      const userRef = doc(db, 'users', sub.userId);
      await updateDoc(userRef, {
        subscriptionStatus: 'active',
        subscriptionPlan: sub.planId,
        subscriptionExpiresAt:
          sub.planId === 'lifetime'
            ? '2099-12-31T23:59:59Z'
            : new Date(Date.now() + 180 * 86400000).toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  }
}
