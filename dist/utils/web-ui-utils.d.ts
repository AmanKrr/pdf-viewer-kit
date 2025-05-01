declare class WebUiUtils {
    static showLoading(): HTMLDivElement;
    static hideLoading(loadingElement: HTMLElement, containerId: string): void;
    /**
     * Helper function to parse query string (e.g. ?param1=value&param2=...).
     * @param {string} query
     * @returns {Map}
     */
    static parseQueryString(query: any): Map<any, any>;
}
export default WebUiUtils;
//# sourceMappingURL=web-ui-utils.d.ts.map