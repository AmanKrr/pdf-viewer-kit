/**
 * Configuration for a single toolbar button.
 */
interface ToolbarButtonConfig {
  /** Unique identifier for the button. */
  id: string;

  /** Label text displayed for the button. */
  label: string;

  /** Optional icon represented as an SVG. */
  icon?: svg;

  /** Optional CSS class for styling the button. */
  class?: string;

  /** If `true`, a separator will be placed before this button in the toolbar. */
  isSeparatorBefore?: boolean;

  /** Indicates if the button is a custom toolbar item. */
  type?: 'custom';

  /** Function executed when the button is clicked. */
  onClick: (params: any) => void;

  /** Custom rendering function for the button (if applicable). */
  render?: (params: any | null) => HTMLElement;

  /** Determines whether the button should be hidden. */
  hide: boolean;

  /** Specifies which toolbar group this button belongs to (1 or 2). */
  group: 1 | 2;
}

/**
 * Defines the available toolbar options and their visibility state.
 */
interface ToolbarOptions {
  /** Enables/disables zoom-in functionality. */
  zoomIn: boolean;

  /** Enables/disables zoom-out functionality. */
  zoomOut: boolean;

  /** Enables/disables page rotation functionality. */
  rotate: boolean;

  /** Enables/disables the print button. */
  print: boolean;

  /** Enables/disables the download button. */
  download: boolean;

  /** Enables/disables the next-page navigation button. */
  nextPage: boolean;

  /** Enables/disables the previous-page navigation button. */
  previousPage: boolean;

  /** Enables/disables the first-page navigation button. */
  firstPage: boolean;

  /** Enables/disables the last-page navigation button. */
  lastPage: boolean;

  /** Enables/disables the search functionality. */
  search: boolean;

  /** Enables/disables the page-number display/input field. */
  pageNumber: boolean;

  /** Enables/disables the thumbnail viewer button. */
  thumbnail: boolean;

  /** Controls visibility of annotation tools. */
  annotation: {
    /** Enables/disables the signature annotation tool. */
    signature: boolean;

    /** Enables/disables the drawing annotation tool. */
    drawing: boolean;

    /** Enables/disables the stamp annotation tool. */
    stamp: boolean;

    /** Enables/disables the circle annotation tool. */
    circle: boolean;

    /** Enables/disables the rectangle annotation tool. */
    rectangle: boolean;

    /** Enables/disables the line annotation tool. */
    line: boolean;
  };
}

/**
 * Defines CSS class names for different toolbar buttons.
 */
interface ToolbarClass {
  /** CSS class for the zoom-in button. */
  zoomIn: string;

  /** CSS class for the zoom-out button. */
  zoomOut: string;

  /** CSS class for the rotate button. */
  rotate: string;

  /** CSS class for the print button. */
  print: string;

  /** CSS class for the download button. */
  download: string;

  /** CSS class for the next-page navigation button. */
  nextPage: string;

  /** CSS class for the previous-page navigation button. */
  previousPage: string;

  /** CSS class for the first-page navigation button. */
  firstPage: string;

  /** CSS class for the last-page navigation button. */
  lastPage: string;

  /** CSS class for the search button. */
  search: string;

  /** CSS class for the page-number display/input field. */
  pageNumber: string;

  /** CSS class for the thumbnail viewer button. */
  thumbnail: string;

  /** CSS class names for annotation tools. */
  annotation: {
    /** CSS class for the signature annotation tool. */
    signature: string;

    /** CSS class for the drawing annotation tool. */
    drawing: string;

    /** CSS class for the stamp annotation tool. */
    stamp: string;

    /** CSS class for the circle annotation tool. */
    circle: string;

    /** CSS class for the rectangle annotation tool. */
    rectangle: string;

    /** CSS class for the line annotation tool. */
    line: string;
  };
}
