export interface CreateDownloadDto {
  title: string;
  shortDescription: string;
  price: number;
  coverUrl?: string | null;
  fileUrl: string;
  fileSizeKB: number;
}
