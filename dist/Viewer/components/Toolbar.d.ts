import { ToolbarButtonConfig, ToolbarOptions } from '../../types/toolbar.types';
import WebViewer from './WebViewer';
declare class Toolbar {
    private container;
    private buttons;
    private toolbar;
    private toolbarClass;
    private toolbarConfig;
    private _viewer;
    constructor(containerId: string, toolbarConfig: ToolbarButtonConfig[], webViewer: WebViewer);
    setToolbar(options?: Partial<ToolbarOptions>): void;
    getToolbar(): ToolbarOptions;
    removeToolbar(): void;
    getToolbarData(): ToolbarButtonConfig[];
    private renderToolbar;
    private createToolbarButton;
    private parentWrapper;
    private addSeparator;
    private static renderPageNumberControls;
}
export default Toolbar;
