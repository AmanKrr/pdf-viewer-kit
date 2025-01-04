import EventEmitter from "../event/EventUtils";

class PdfState extends EventEmitter {
  private static instance: PdfState;

  // Shared state
  public _scale: number = 1.5;
  public _pdfInstance: any = null;
  public _isLoading: boolean = true;
  public _currentPage: number = 1;

  // shared element
  public _uiLoading!: HTMLElement;

  private constructor() {
    super();
  }

  static getInstance(): PdfState {
    if (!PdfState.instance) {
      PdfState.instance = new PdfState();
    }
    return PdfState.instance;
  }

  // State accessors
  get scale(): number {
    return this._scale;
  }

  get pdfInstance(): any {
    return this._pdfInstance;
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  get currentPageNumber(): number {
    return this._currentPage;
  }

  get uiLoading(): HTMLElement {
    return this._uiLoading;
  }

  setScale(newScale: number): void {
    if (this._scale !== newScale) {
      this._scale = newScale;
      this.emit("scaleChange", newScale);
    }
  }

  setPdfInstance(instance: any): void {
    if (this._pdfInstance !== instance) {
      this._pdfInstance = instance;
      this.emit("pdfInstanceChange", instance);
    }
  }

  setLoading(isLoading: boolean, uiLoading: HTMLElement): void {
    if (this._isLoading !== isLoading) {
      this._isLoading = isLoading;
      this._uiLoading = uiLoading;
      this.emit("loadingChange", isLoading);
    }
  }

  setPageNumber(pageNumber: number): void {
    if (this._currentPage !== pageNumber) {
      this._currentPage = pageNumber;
      // this.emit('loadingChange', pageNumber);
    }
  }

  setUiLoading(uiLoading: HTMLElement): void {
    if (this._uiLoading !== uiLoading) {
      this._uiLoading = uiLoading;
    }
  }
}

export default PdfState;
