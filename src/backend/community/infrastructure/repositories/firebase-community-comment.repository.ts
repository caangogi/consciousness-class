import { adminDb } from '@/lib/firebase/admin';
import { CommunityCommentEntity } from '@/backend/community/domain/entities/community-comment.entity';
import * as admin from 'firebase-admin';

export class FirebaseCommunityCommentRepository {
  private col(communityId: string, postId: string) {
    return adminDb
      .collection('communities')
      .doc(communityId)
      .collection('posts')
      .doc(postId)
      .collection('comments');
  }

  async getComments(communityId: string, postId: string): Promise<CommunityCommentEntity[]> {
    const snap = await this.col(communityId, postId)
      .orderBy('createdAt', 'asc')
      .get();
    return snap.docs.map(d => new CommunityCommentEntity(d.data() as any));
  }

  async create(communityId: string, postId: string, comment: CommunityCommentEntity): Promise<void> {
    await adminDb.runTransaction(async t => {
      const commentRef = this.col(communityId, postId).doc(comment.id);
      const postRef = adminDb
        .collection('communities').doc(communityId)
        .collection('posts').doc(postId);

      t.set(commentRef, comment.toPlainObject());
      t.update(postRef, {
        commentsCount: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  async toggleLike(communityId: string, postId: string, commentId: string, uid: string): Promise<void> {
    const ref = this.col(communityId, postId).doc(commentId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Comment not found');
    const comment = new CommunityCommentEntity(snap.data() as any).toggleLike(uid);
    await ref.set(comment.toPlainObject());
  }

  async delete(communityId: string, postId: string, commentId: string): Promise<void> {
    await adminDb.runTransaction(async t => {
      const commentRef = this.col(communityId, postId).doc(commentId);
      const postRef = adminDb
        .collection('communities').doc(communityId)
        .collection('posts').doc(postId);

      t.delete(commentRef);
      t.update(postRef, {
        commentsCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: new Date().toISOString(),
      });
    });
  }
}
