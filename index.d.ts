/// <reference types="react" />
import * as React from "React";
export declare class DVL<T> extends React.PureComponent<{
    onRender: (item: any, index: number) => JSX.Element;
    items: T[];
    calculateHeight?: (container: HTMLDivElement, item: any, index: number) => number | number;
    windowContainer?: boolean;
    buffer?: number;
    ref?: (ref: HTMLDivElement) => void;
    style?: React.CSSProperties;
    className?: string;
    doUpdate?: (calcVisible: (scrollTop?: number, height?: number) => void) => void;
    gridItemWidth?: number;
    onResizeStart?: () => void;
    onResizeFinish?: (columns: number) => void;
}, {
    loading: boolean;
    scrollHeight: number;
    topSpacer: number;
    batch: number;
    renderRange: number[];
    columns: number;
}> {
    private buffer;
    private ref;
    private itemHeight;
    private doResize;
    private batchCounter;
    private hasWin;
    private scrollDone;
    private ticking;
    private rowCache;
    private counter;
    private id;
    constructor(p: any);
    componentWillMount(): void;
    componentWillUnmount(): void;
    debounceResize(): void;
    reflowLayout(): void;
    reflowComplete(): void;
    scheduleVisibleUpdate(): void;
    calcVisible(scrollTop?: number, height?: number): void;
    addEventListener(): void;
    render(): JSX.Element;
}
