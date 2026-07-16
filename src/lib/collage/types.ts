export interface CollageImage {
  id: string;
  file?: File;
  url?: string;
  thumbnail: string;
  order: number;
  width?: number;
  height?: number;
}

export interface CollageSettings {
  gridRows: number;
  gridCols: number;
  padding: number;
  effect: 'color' | 'bw' | 'gradient';
  gradientColors?: [string, string];
}

export interface CollageProject {
  id?: string;
  userId?: string;
  workspaceId?: string | null;
  name: string;
  shapeType: 'template' | 'custom';
  shapeName?: string;
  shapeSvgPath: string;
  images: CollageImage[];
  settings: CollageSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface CellPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShapeTemplate {
  name: string;
  displayName: string;
  svgPath: string;
  aspectRatio: number;
  previewUrl?: string;
}

export interface ExportOptions {
  dpi: number;
  format: 'png';
  quality?: number;
}

export interface RenderOptions {
  canvas: HTMLCanvasElement;
  images: CollageImage[];
  settings: CollageSettings;
  shapeSvgPath: string;
  dpi: number;
  onProgress?: (progress: number) => void;
}
