export type PostType = 'text' | 'announcement' | 'free_content' | 'product_showcase' | 'question' | 'momento';
export type PostVisibility = 'public' | 'members_only';

export interface Attachment {
  type: 'image' | 'video' | 'momento' | 'pdf';
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  fileName?: string;
}

export interface CommunityPostProperties {
  id: string;
  communityId: string;
  authorUid: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  content: string;
  postType: PostType;
  visibility: PostVisibility;
  attachments: Attachment[];
  likes: string[];
  commentsCount: number;
  pinnedAt?: string | null;
  catalogItemRef?: string | null;
  isOfficialAnswer?: boolean;
  createdAt: string;
  updatedAt: string;
}

export class CommunityPostEntity {
  public id: string;
  public communityId: string;
  public authorUid: string;
  public authorDisplayName: string;
  public authorAvatarUrl: string | null;
  public content: string;
  public postType: PostType;
  public visibility: PostVisibility;
  public attachments: Attachment[];
  public likes: string[];
  public commentsCount: number;
  public pinnedAt: string | null;
  public catalogItemRef: string | null;
  public isOfficialAnswer: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: CommunityPostProperties) {
    this.id = props.id;
    this.communityId = props.communityId;
    this.authorUid = props.authorUid;
    this.authorDisplayName = props.authorDisplayName;
    this.authorAvatarUrl = props.authorAvatarUrl;
    this.content = props.content;
    this.postType = props.postType || 'text';
    this.visibility = props.visibility || 'members_only';
    this.attachments = props.attachments || [];
    this.likes = props.likes || [];
    this.commentsCount = props.commentsCount || 0;
    this.pinnedAt = props.pinnedAt || null;
    this.catalogItemRef = props.catalogItemRef || null;
    this.isOfficialAnswer = props.isOfficialAnswer || false;
    this.createdAt = new Date(props.createdAt);
    this.updatedAt = new Date(props.updatedAt);
  }

  static create(input: Pick<CommunityPostProperties,
    'communityId' | 'authorUid' | 'authorDisplayName' | 'authorAvatarUrl' |
    'content' | 'postType' | 'visibility' | 'attachments'
  > & { catalogItemRef?: string }): CommunityPostEntity {
    const now = new Date();
    return new CommunityPostEntity({
      id: crypto.randomUUID(),
      ...input,
      attachments: input.attachments || [],
      catalogItemRef: input.catalogItemRef || null,
      likes: [],
      commentsCount: 0,
      pinnedAt: null,
      isOfficialAnswer: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  toggleLike(uid: string): CommunityPostEntity {
    const liked = this.likes.includes(uid);
    return new CommunityPostEntity({
      ...this.toPlainObject(),
      likes: liked ? this.likes.filter(l => l !== uid) : [...this.likes, uid],
      updatedAt: new Date().toISOString(),
    });
  }

  pin(): CommunityPostEntity {
    return new CommunityPostEntity({
      ...this.toPlainObject(),
      pinnedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  unpin(): CommunityPostEntity {
    return new CommunityPostEntity({
      ...this.toPlainObject(),
      pinnedAt: null,
      updatedAt: new Date().toISOString(),
    });
  }

  toPlainObject(): CommunityPostProperties {
    return {
      id: this.id,
      communityId: this.communityId,
      authorUid: this.authorUid,
      authorDisplayName: this.authorDisplayName,
      authorAvatarUrl: this.authorAvatarUrl,
      content: this.content,
      postType: this.postType,
      visibility: this.visibility,
      attachments: this.attachments,
      likes: this.likes,
      commentsCount: this.commentsCount,
      pinnedAt: this.pinnedAt,
      catalogItemRef: this.catalogItemRef,
      isOfficialAnswer: this.isOfficialAnswer,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
