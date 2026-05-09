export type NotificationType =
  | 'new_post'
  | 'new_comment'
  | 'reply'
  | 'like'
  | 'new_member'
  | 'product_mention';

export type NotificationEntityType = 'post' | 'comment' | 'community';

export interface NotificationProperties {
  id: string;
  recipientUid: string;
  type: NotificationType;
  actorUid: string;
  actorDisplayName: string;
  actorAvatarUrl: string | null;
  entityType: NotificationEntityType;
  entityId: string;
  communityId: string;
  message: string;
  isRead: boolean;
  deepLink: string;
  createdAt: string;
}

export class NotificationEntity {
  public id: string;
  public recipientUid: string;
  public type: NotificationType;
  public actorUid: string;
  public actorDisplayName: string;
  public actorAvatarUrl: string | null;
  public entityType: NotificationEntityType;
  public entityId: string;
  public communityId: string;
  public message: string;
  public isRead: boolean;
  public deepLink: string;
  public createdAt: Date;

  constructor(props: NotificationProperties) {
    this.id = props.id;
    this.recipientUid = props.recipientUid;
    this.type = props.type;
    this.actorUid = props.actorUid;
    this.actorDisplayName = props.actorDisplayName;
    this.actorAvatarUrl = props.actorAvatarUrl;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.communityId = props.communityId;
    this.message = props.message;
    this.isRead = props.isRead;
    this.deepLink = props.deepLink;
    this.createdAt = new Date(props.createdAt);
  }

  static create(input: Omit<NotificationProperties, 'id' | 'isRead' | 'createdAt'>): NotificationEntity {
    return new NotificationEntity({
      id: crypto.randomUUID(),
      ...input,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  markAsRead(): NotificationEntity {
    return new NotificationEntity({ ...this.toPlainObject(), isRead: true });
  }

  toPlainObject(): NotificationProperties {
    return {
      id: this.id,
      recipientUid: this.recipientUid,
      type: this.type,
      actorUid: this.actorUid,
      actorDisplayName: this.actorDisplayName,
      actorAvatarUrl: this.actorAvatarUrl,
      entityType: this.entityType,
      entityId: this.entityId,
      communityId: this.communityId,
      message: this.message,
      isRead: this.isRead,
      deepLink: this.deepLink,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
