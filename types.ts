export interface Annotation {
  id: string;
  type: 'number' | 'text' | 'rect' | 'circle' | 'arrow';
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width?: number; // Percentage 0-100 (for shapes/text)
  height?: number; // Percentage 0-100 (for shapes)
  text?: string; // For number badge or text tool
  color?: string;
  style?: 'outline' | 'fill'; // For shapes
  fontSize?: number;
}

export interface DocStep {
  id: string;
  image: string; // Base64 data URI
  title: string;
  description: string;
  headingLevel: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  indentation: number; // 0 (root), 1 (child), 2 (grandchild)
  annotations: Annotation[];
  isProcessing?: boolean;
}

export interface ProjectMetadata {
  title: string;
  author: string;
  date: string;
}

export interface Guide {
  id: string;
  metadata: ProjectMetadata;
  steps: DocStep[];
  lastModified: number;
}

export interface Project {
  id: string;
  title: string;
  guideIds: string[];
  lastModified: number;
}