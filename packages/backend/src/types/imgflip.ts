export interface ImgflipResponse {
  success: boolean;
  data: {
    url: string;
    page_url: string;
  };
  error_message?: string;
}

export interface ImgflipTemplate {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
  captions?: number;
}

export interface ImgflipError {
  success: false;
  error_message: string;
} 