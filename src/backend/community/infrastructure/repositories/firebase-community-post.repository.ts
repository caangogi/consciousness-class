import { adminDb } from '@/lib/firebase/admin';
import { CommunityPostEntity } from '@/backend/community/domain/entities/community-post.entity';

export class FirebaseCommunityPostRepository {
  private col(communityId: string) {
    return adminDb.collection('communities').doc(communityId).collection('posts');
  }

  async getPosts(communityId: string, includePrivate: boolean): Promise<CommunityPostEntity[]> {
    let query = this.col(communityId).orderBy('pinnedAt', 'desc').orderBy('createdAt', 'desc') as any;
    if (!includePrivate) {
      query = this.col(communityId)
        .where('visibility', '==', 'public')
        .orderBy('createdAt', 'desc');
    }
    const snap = await query.get();
    return snap.docs.map((d: any) => new CommunityPostEntity(d.data()));
  }

  async getById(communityId: string, postId: string): Promise<CommunityPostEntity | null> {
    const snap = await this.col(communityId).doc(postId).get();
    if (!snap.exists) return null;
    return new CommunityPostEntity(snap.data() as any);
  }

  async create(post: CommunityPostEntity): Promise<void> {
    await adminDb.runTransaction(async t => {
      const postRef = this.col(post.communityId).doc(post.id);
      t.set(postRef, post.toPlainObject());

      // Write to global feed index if public
      if (post.visibility === 'public') {
        const indexRef = adminDb.collection('community_feed_index').doc(post.id);
        t.set(indexRef, this.toFeedIndex(post));
      }
    });
  }

  async update(post: CommunityPostEntity): Promise<void> {
    await adminDb.runTransaction(async t => {
      const postRef = this.col(post.communityId).doc(post.id);
      t.set(postRef, post.toPlainObject());

      const indexRef = adminDb.collection('community_feed_index').doc(post.id);
      if (post.visibility === 'public') {
        t.set(indexRef, this.toFeedIndex(post), { merge: true });
      } else {
        t.delete(indexRef); // Remove from public feed if visibility changed
      }
    });
  }

  async delete(communityId: string, postId: string): Promise<void> {
    await adminDb.runTransaction(async t => {
      t.delete(this.col(communityId).doc(postId));
      t.delete(adminDb.collection('community_feed_index').doc(postId));
    });
  }

  async toggleLike(communityId: string, postId: string, uid: string): Promise<{ liked: boolean }> {
    const ref = this.col(communityId).doc(postId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Post not found');
    const post = new CommunityPostEntity(snap.data() as any).toggleLike(uid);
    await ref.set(post.toPlainObject());
    return { liked: post.likes.includes(uid) };
  }

  private toFeedIndex(post: CommunityPostEntity): object {
    return {
      id: post.id,
      communityId: post.communityId,
      postType: post.postType,
      visibility: post.visibility,
      authorUid: post.authorUid,
      authorDisplayName: post.authorDisplayName,
      authorAvatarUrl: post.authorAvatarUrl,
      contentSnapshot: post.content.slice(0, 280),
      attachments: post.attachments.slice(0, 1), // Only first attachment for preview
      catalogItemRef: post.catalogItemRef,
      likesCount: post.likes.length,
      commentsCount: post.commentsCount,
      pinnedAt: post.pinnedAt,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
