interface ToolbarButtonConfig {
  id: string;
  label: string;
  icon?: svg;
  class?: string; // Optional CSS class
  isSeparatorBefore?: boolean;
  type?: 'custom';
  onClick: (params: any) => void;
  render?: (params: any | null = null) => HTMLElement;
  hide: boolean;
}

interface ToolbarOptions {
  zoomIn: boolean;
  zoomOut: boolean;
  rotate: boolean;
  print: boolean;
  download: boolean;
  nextPage: boolean;
  previousPage: boolean;
  firstPage: boolean;
  lastPage: boolean;
  search: boolean;
  pageNumber: boolean;
  annotation: {
    signature: boolean;
    drawing: boolean;
    stamp: boolean;
    circle: boolean;
    rectangle: boolean;
    line: boolean;
    // Add more annotation options as needed
  };
  // Add more toolbar options as needed
}

interface ToolbarClass {
  zoomIn: string;
  zoomOut: string;
  rotate: string;
  print: string;
  download: string;
  nextPage: string;
  previousPage: string;
  firstPage: string;
  lastPage: string;
  search: string;
  pageNumber: string;
  annotation: {
    signature: string;
    drawing: string;
    stamp: string;
    circle: string;
    rectangle: string;
    line: string;
    // Add more annotation options as needed
  };
  // Add more toolbar options as needed
}
