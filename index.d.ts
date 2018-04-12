/// <reference types="react" />
import * as React from "React";
export declare class DVL extends React.PureComponent<{
    onRender: (item: any, index: number, columns?: number) => JSX.Element;
    items: any[];
    calculateHeight?: (container: HTMLDivElement, item: any, index: number) => number | number;
    windowContainer?: boolean;
    buffer?: number;
    containerRef?: (ref: HTMLDivElement) => void;
    containerStyle?: React.CSSProperties;
    containerClass?: string;
    innerContainerStyle?: React.CSSProperties;
    doUpdate?: (calcVisible: (scrollTop?: number, containerHeight?: number) => void) => void;
    gridItemWidth?: number;
    onResizeStart?: (doResize: () => void) => void;
    onResizeFinish?: (scrollHeight: number, columns: number) => void;
}, {
    _loading: boolean;
    _progress: number;
    _scrollHeight: number;
    _topSpacer: number;
    _batch: number;
    _renderRange: number[];
    _columns: number;
    _renderItems: any[];
    _ref: HTMLDivElement;
}> {
    private _buffer;
    private _itemHeight;
    private _itemRows;
    private _doResize;
    private _batchCounter;
    private _hasWin;
    private _scrollDone;
    private _ticking;
    private _rowCache;
    private _counter;
    private _firstRender;
    private _calcTimer;
    private _scrollContainer;
    private _oldScroll;
    constructor(p: any);
    componentWillMount(): void;
    componentWillUnmount(): void;
    private _debounceResize();
    private _doReflow();
    private _reflowLayout();
    private _reflowComplete(doFinalPass);
    private _scheduleVisibleUpdate();
    private _calcVisible(scrollTopIn?, heightIn?);
    private _addEventListener();
    render(): JSX.Element;
}
