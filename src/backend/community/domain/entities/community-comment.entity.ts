export interface CommunityCommentProperties {
  id: string;
  postId: string;
  communityId: string;
  authorUid: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  content: string;
  parentCommentId: string | null; // null = direct reply to post, string = reply to comment
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

export class CommunityCommentEntity {
  public id: string;
  public postId: string;
  public communityId: string;
  public authorUid: string;
  public authorDisplayName: string;
  public authorAvatarUrl: string | null;
  public content: string;
  public parentCommentId: string | null;
  public likes: string[];
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: CommunityCommentProperties) {
    this.id = props.id;
    this.postId = props.postId;
    this.communityId = props.communityId;
    this.authorUid = props.authorUid;
    this.authorDisplayName = props.authorDisplayName;
    this.authorAvatarUrl = props.authorAvatarUrl;
    this.content = props.content;
    this.parentCommentId = props.parentCommentId || null;
    this.likes = props.likes || [];
    this.createdAt = new Date(props.createdAt);
    this.updatedAt = new Date(props.updatedAt);
  }

  static create(input: Pick<CommunityCommentProperties,
    'postId' | 'communityId' | 'authorUid' | 'authorDisplayName' | 'authorAvatarUrl' | 'content'
  > & { parentCommentId?: string | null }): CommunityCommentEntity {
    const now = new Date();
    return new CommunityCommentEntity({
      id: crypto.randomUUID(),
      ...input,
      parentCommentId: input.parentCommentId || null,
      likes: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  toggleLike(uid: string): CommunityCommentEntity {
    const liked = this.likes.includes(uid);
    return new CommunityCommentEntity({
      ...this.toPlainObject(),
      likes: liked ? this.likes.filter(l => l !== uid) : [...this.likes, uid],
      updatedAt: new Date().toISOString(),
    });
  }

  toPlainObject(): CommunityCommentProperties {
    return {
      id: this.id,
      postId: this.postId,
      communityId: this.communityId,
      authorUid: this.authorUid,
      authorDisplayName: this.authorDisplayName,
      authorAvatarUrl: this.authorAvatarUrl,
      content: this.content,
      parentCommentId: this.parentCommentId,
      likes: this.likes,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
