import { FileType } from "./file-storage.types";

export interface SavedFileResult {
    url: string;         // URL công khai của file đã lưu.  
    identifier: string;   // Đường dẫn tuyệt đối (local) hoặc object key (S3).
                        
    storageType: string;  // Loại lưu trữ (local, s3, ...).
    originalName: string; // Tên gốc của file (trước khi thay đổi).
}

export interface IStorageStrategy {
    /**
     * Lưu một hoặc nhiều file vào nơi lưu trữ
     * @param temporaryFiles Mảng file tạm từ Multer.
     * @param type Loại file (để xác định thư mục con/prefix).
     * @returns Promise chứa mảng kết quả SavedFileResult.
     */
    saveFiles(temporaryFiles: Express.Multer.File[], type: FileType): Promise<SavedFileResult[]>;

    /**
     * Xóa các file dựa trên định danh của chúng.
     * @param identifiers Mảng các định danh (đường dẫn tuyệt đối cho local, object key cho S3).
     * @returns Promise<void>.
     */
    deleteByIdentifiers(identifiers: string[]): Promise<void>;

     /**
      * Xóa các file dựa trên URL công khai của chúng.
      * Strategy cần biết cách phân tích URL để lấy định danh.
      * @param urls Mảng các URL công khai.
      * @returns Promise<void>.
      */
     deleteByUrls(urls: string[]): Promise<void>;

}

export const STORAGE_STRATEGY = 'STORAGE_STRATEGY';