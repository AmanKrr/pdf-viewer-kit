declare class WebUiUtils {
    static showLoading(): HTMLDivElement;
    static hideLoading(loadingElement: HTMLElement): void;
    static Observer(callback: (pageNumber: number) => void): void;
    /**
     * Helper function to parse query string (e.g. ?param1=value&param2=...).
     * @param {string} query
     * @returns {Map}
     */
    static parseQueryString(query: any): Map<any, any>;
    static getVisiblePages(pdfInstance: any): number[];
    static renderPage(pdfInstance: any, pageIndex: number, scale: number, devicePixelRatio: number): Promise<void>;
}
export default WebUiUtils;
