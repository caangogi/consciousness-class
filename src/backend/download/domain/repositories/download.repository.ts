import { DownloadEntity } from '../entities/download.entity';

export interface IDownloadRepository {
  save(download: DownloadEntity): Promise<void>;
  findById(id: string): Promise<DownloadEntity | null>;
  findAllByCreator(creatorUid: string): Promise<DownloadEntity[]>;
  delete(id: string): Promise<void>;
}
