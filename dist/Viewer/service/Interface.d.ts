export interface IPDFLinkService {
    pagesCount: number;
    page: number;
    rotation: number;
    isInPresentationMode: boolean;
    externalLinkEnabled: boolean;
    goToDestination(dest: string | Array<any>): Promise<void>;
    goToPage(val: number | string): void;
    addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void;
    getDestinationHash(dest: any): string;
    getAnchorUrl(hash: string): string;
    setHash(hash: string): void;
    executeNamedAction(action: string): void;
    executeSetOCGState(action: object): void;
}
export interface IRenderableView {
    resume: (() => void) | null;
    renderingId: string;
    renderingState: any;
    draw(): Promise<void>;
}
export interface IDownloadManager {
    downloadData(data: Uint8Array, filename: string, contentType?: string): void;
    openOrDownloadData(data: Uint8Array, filename: string, dest?: string | null): boolean;
    download(data: Uint8Array, url: string, filename: string): void;
}
export interface IL10n {
    getLanguage(): string;
    getDirection(): string;
    get(ids: string | Array<string>, args?: Record<string, any>, fallback?: string): Promise<string>;
    translate(element: HTMLElement): Promise<void>;
    pause(): void;
    resume(): void;
}
export declare abstract class IPDFPrintServiceFactory {
    static initGlobals(): void;
    static get supportsPrinting(): boolean;
    static createPrintService(): never;
}
