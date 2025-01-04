import EventEmitter from "../event/EventUtils";
declare class PdfState extends EventEmitter {
    private static instance;
    _scale: number;
    _pdfInstance: any;
    _isLoading: boolean;
    _currentPage: number;
    _uiLoading: HTMLElement;
    private constructor();
    static getInstance(): PdfState;
    get scale(): number;
    get pdfInstance(): any;
    get isLoading(): boolean;
    get currentPageNumber(): number;
    get uiLoading(): HTMLElement;
    setScale(newScale: number): void;
    setPdfInstance(instance: any): void;
    setLoading(isLoading: boolean, uiLoading: HTMLElement): void;
    setPageNumber(pageNumber: number): void;
    setUiLoading(uiLoading: HTMLElement): void;
}
export default PdfState;
