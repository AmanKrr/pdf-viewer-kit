import WebViewer from '../viewer/ui/WebViewer';

/**
 * Contract for a pluggable toolbar implementation.
 */
export interface IToolbar {
  /** Render toolbar UI into the given container element */
  render(container: HTMLElement): void;
  /** Tear down any DOM or event listeners created in render() */
  destroy(): void;
}

/**
 * Fine‑grain show/hide toggles and CSS namespace for default toolbar.
 */
export interface ToolbarOptions {
  /** Show “First Page” button */
  showFirstPage?: boolean;
  /** Show “Previous/Next Page” buttons */
  showPrevNext?: boolean;
  /** Show “Last Page” button */
  showLastPage?: boolean;
  /** Show “Page Number” control */
  showPageNumber?: boolean;
  /** Show “Zoom In/Out” buttons */
  showZoom?: boolean;
  /** Show “Search” button */
  showSearch?: boolean;
  /** Show “Thumbnail” toggle button */
  showThumbnail?: boolean;
  /** Show “Annotation” toggle button */
  showAnnotation?: boolean;
  /** Prefix for all toolbar CSS classes */
  classPrefix?: string;
  // showFitWidth?: boolean;
  // showFitPage?: boolean;
  showDownload?: boolean;
}

/**
 * Configuration for each button or custom element in the toolbar.
 */
export interface ToolbarButtonConfig {
  /** Unique key/id for this item (used in CSS classes) */
  id: string;
  /** CSS class(es) for icon; ignored if using `render` */
  iconClass?: string;
  /** Tooltip text (title attribute) */
  tooltip?: string;
  /** Standard click handler; ignored if using `render` */
  onClick?: (viewer: WebViewer) => void;
  /** Alternative: return your own element instead of button+icon */
  render?: (viewer: WebViewer) => HTMLElement;
  /** Insert a separator just before this item */
  isSeparatorBefore?: boolean;
  breakBefore?: boolean;
}
