import * as React from "react";

const invisible = { opacity: 0, height: 0 };

export class DVL extends React.PureComponent<{
    onRender: (item: any, index: number, columns?: number) => JSX.Element;
    items: any[];
    calculateHeight?: (container: HTMLDivElement, item: any, index: number) => number | number;
    windowContainer?: boolean;
    buffer?: number;
    containerRef?: (ref: HTMLDivElement) => void;
    containerStyle?: React.CSSProperties;
    containerClass?: string;
    innerContainerClass?: string;
    innerContainerStyle?: React.CSSProperties;
    doUpdate?: (calcVisible: (scrollTop?: number, containerHeight?: number) => void) => void;
    gridItemWidth?: number;
    onResizeStart?: (doResize: () => void) => void;
    onResizeFinish?: (scrollHeight: number, columns: number) => void;
}, {
        _loading: boolean;
        _scrollHeight: number;
        _topSpacer: number;
        _renderRange: number[];
        _columns: number;
        _progress: number;
        _renderItems: any[];
        _ref: HTMLDivElement;
    }> {

    private _buffer = 5;
    private _itemHeight: number[] = [];
    private _itemRows: number[] = [];
    private _doResize: number;
    private _hasWin: boolean;
    private _scrollDone: number;
    private _ticking: boolean;
    private _rowCache: number[];
    private _counter: number = 0;
    private _firstRender: number;
    private _calcTimer: number;
    private _scrollContainer: any;
    private _oldScroll: number;
    private _progressCounter: number = 0;
    private _useWindow: boolean;

    constructor(p) {
        super(p);
        this._reflowLayout = this._reflowLayout.bind(this);
        this._debounceResize = this._debounceResize.bind(this);
        this._calcVisible = this._calcVisible.bind(this);
        this._doReflow = this._doReflow.bind(this);
        this._scheduleVisibleUpdate = this._scheduleVisibleUpdate.bind(this);
        this._rowCache = [];
        this._firstRender = 0;

        this._hasWin = typeof window !== "undefined";
        this.state = {
            _loading: false,
            _progress: 0,
            _scrollHeight: 0,
            _topSpacer: 0,
            _renderRange: [],
            _columns: 0,
            _renderItems: [],
            _ref: null
        };
    }

    public componentWillMount(): void {

        this._buffer = this.props.buffer !== undefined ? this.props.buffer : 5;

        this._useWindow = this.props.windowContainer;

        if (this.props.doUpdate) {
            this.props.doUpdate(this._calcVisible);
        }

        if (this._hasWin) {
            window.addEventListener("resize", this._debounceResize);
        }

    }

    public componentWillUnmount() {
        if (this._hasWin) {
            window.removeEventListener("resize", this._debounceResize);
        }
        if (this._scrollContainer) {
            this._scrollContainer.removeEventListener("scroll", this._scheduleVisibleUpdate);
        }
    }

    private _debounceResize() {
        if (this._doResize) {
            clearTimeout(this._doResize);
        }
        this._doResize = setTimeout(() => {
            this._reflowLayout();
        }, 250);
    }

    private _doReflow() {
        this._progressCounter = 0;
        this._itemHeight = [];
        this._itemRows = [];
        if (this._hasWin && !this._oldScroll && this._scrollContainer) {
            if (this._scrollContainer !== window) {
                this._oldScroll = this._scrollContainer.scrollTop;
                this._scrollContainer.scrollTop = 0;
            } else {
                const doc = document.documentElement;
                this._oldScroll = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
                this._scrollContainer.scrollTo(0, 0);
            }
        }

        setTimeout(() => {
            this.setState({ _loading: true }, () => {
                const calcHeight = this.props.calculateHeight;
                if (calcHeight !== undefined) {
                    this.props.items.forEach((item, i) => {
                        if (typeof calcHeight === "number") {
                            this._itemHeight[i] = calcHeight;
                        } else {
                            this._itemHeight[i] = calcHeight(this.state._ref, item, i);
                        }
                    })
                    this._reflowComplete(true);
                }
            });
        }, 0);

    }

    private _reflowLayout(): void {
        this.props.onResizeStart ? this.props.onResizeStart(this._doReflow) : this._doReflow();
    }

    private _reflowComplete(doFinalPass: boolean) {

        let maxHeight = 0;
        const columns = Math.floor(this.state._ref.clientWidth / (this.props.gridItemWidth || 100));
        let rowHeights: number[] = [];
        let rowCounter: number = 0;
        this._rowCache = [];
        const progress = this.state._progress;
        const fixedHeight = typeof this.props.calculateHeight === "number";
        if (fixedHeight) {
            maxHeight = this.props.calculateHeight as any;
        }

        const scrollHeight = this._itemHeight.reduce((p, c, i) => {
            if (!doFinalPass && progress && i > progress - 1) return p;
            if (this.props.gridItemWidth) {

                this._rowCache[i] = rowCounter;

                if (!fixedHeight) {
                    if (i % columns === 0) {
                        maxHeight = 0;
                    }
                    maxHeight = Math.max(maxHeight, this._itemHeight[i]);
                }

                // very last row
                if (i === this._itemHeight.length - 1) {
                    rowHeights[rowCounter] = maxHeight;
                    return p + maxHeight;
                }

                if (i % columns === (columns - 1)) {
                    rowHeights[rowCounter] = maxHeight;
                    rowCounter++;
                    return p + maxHeight;
                }

                return p;
            } else {
                return p + c;
            }
        }, 0);

        if (this.props.gridItemWidth) {
            this._itemRows = rowHeights;
        } else {
            this._itemRows = this._itemHeight;
        }

        if (doFinalPass) {
            this.setState({
                _loading: false,
                _columns: columns,
                _progress: 0
            }, () => {
                this.setState({ _scrollHeight: scrollHeight }, () => {
                    this._scheduleVisibleUpdate();
                })
                this.props.onResizeFinish ? this.props.onResizeFinish(scrollHeight, columns) : null;
            })
        } else {
            const avg = Math.round(scrollHeight / progress);
            const remainingHight = ((this.props.items.length - progress) * avg);
            /*const items = this._itemRows.length * (this.props.gridItemWidth && columns ? columns : 1);
            let remainingItems = Math.ceil((this.props.items.length - items) / (this.props.gridItemWidth && columns ? columns : 1));
            while(remainingItems--) {
                this._itemRows.push(avg);
            }*/
            this.setState({
                _scrollHeight: scrollHeight + remainingHight,
                _columns: columns
            }, () => {
                this._scheduleVisibleUpdate();
            })
        }
    }

    private _nextFrame(cb: () => void) {
        if (this._hasWin) {
            window.requestAnimationFrame(() => {
                cb();
            });
        } else {
            setTimeout(() => {
                cb();
            }, 16);
        }
    }

    private _scheduleVisibleUpdate() {
        if (!this._ticking) {
            this._ticking = true;
            this._nextFrame(this._calcVisible);
        }
    }

    private _calcVisible(scrollTopIn?: number, heightIn?: number) {

        let height = heightIn || this.state._ref.clientHeight;

        if (this._oldScroll && this._hasWin) {
            if (this._scrollContainer !== window) {
                this._scrollContainer.scrollTop = Math.min(this._oldScroll, this.state._scrollHeight - height);
            } else {
                this._scrollContainer.scrollTo(0, Math.min(this._oldScroll, this.state._scrollHeight));
            }
            this._oldScroll = undefined;
        }

        let topHeight = 0;
        let scrollTop = scrollTopIn || this.state._ref.scrollTop;

        let top = 0;
        if (this._useWindow && this._hasWin) {
            let relTop = this.state._ref.getBoundingClientRect().top;
            const doc = document.documentElement;
            scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
            const containerDistanceFromTopOfDoc = relTop + scrollTop;
            height = window.innerHeight;

            scrollTop -= containerDistanceFromTopOfDoc;

            // element is below visible window area
            if (scrollTop < 0 && scrollTop < height * -1) {
                this._ticking = false;
                return;
            }
        }

        let renderRange: number[] = [];
        let i = 0;
        while (i < this._itemRows.length) {

            const start = renderRange[0] !== undefined;
            const end = renderRange[1] !== undefined;
            if (!start || !end) {
                if (!start && (top + this._itemRows[i]) >= scrollTop) {
                    renderRange[0] = Math.max(0, i - this._buffer);
                    topHeight = top;
                    if (renderRange[0] !== i) {
                        let goUp = 1;
                        const diff = (i - renderRange[0]);
                        while (diff > 0 && goUp <= diff) {
                            topHeight -= this._itemRows[i - goUp];
                            goUp++;
                        }
                    }

                } else if (!end && start && top > scrollTop + height) {
                    renderRange[1] = Math.min(i + this._buffer, this._itemRows.length);
                }
                top += this._itemRows[i];
                i++;
            } else {
                i = this._itemRows.length;
            }
        }

        if (renderRange[1] === undefined) {
            renderRange[1] = this._itemRows.length;
        }

        this._ticking = false;

        // if (this.state._renderRange[0] !== renderRange[0] || this.state._renderRange[1] !== renderRange[1] || topHeight !== this.state._topSpacer) {
        this.setState({
            _renderRange: renderRange,
            _topSpacer: topHeight,
            _renderItems: (() => {

                if (this.props.calculateHeight !== undefined) {
                    const ranges = this.props.gridItemWidth ? renderRange.map(r => r * this.state._columns) : renderRange;
                    return this.props.items.slice.apply(this.props.items, ranges);
                }

                return this.props.items.filter((v, i) => {
                    if (this.state._progress && i > this.state._progress - 1) return false;
                    if (this.props.gridItemWidth) {
                        return this._rowCache[i] >= renderRange[0] && this._rowCache[i] <= renderRange[1];
                    } else {
                        return i >= renderRange[0] && i <= renderRange[1];
                    }
                });
            })()
        });
        // }
    }

    private _addEventListener(): void {

        if (this.state._ref && !this.props.doUpdate && this._hasWin) {
            if (this._useWindow) {
                this._scrollContainer = window;
            } else {
                this._scrollContainer = this.state._ref;
            }
            this._scrollContainer.addEventListener("scroll", this._scheduleVisibleUpdate);
        }
        this._reflowLayout();
    }

    public render() {

        const low = this.state._progress;
        const high = this.state._progress + 100;
        const startIdx = this.props.gridItemWidth ? this.state._renderRange[0] * this.state._columns : this.state._renderRange[0];

        // SSR
        if (typeof window === "undefined") {
            return (
                <div className={this.props.containerClass} style={{
                    marginBottom: "10px",
                    ...this.props.containerStyle,
                }}>
                    <div className={this.props.innerContainerClass || ""} style={this.props.innerContainerStyle || {}}>
                        {this.props.items.map((e, j) => this.props.onRender(e, j, 0))}
                    </div>
                </div>
            );
        }

        return (
            <div className={this.props.containerClass} style={{
                marginBottom: "10px",
                boxSizing: "content-box",
                ...this.props.containerStyle,
            }} ref={(ref) => {
                if (ref && ref !== this.state._ref) {
                    this.setState({ _ref: ref }, () => {
                        if (this._hasWin && window.getComputedStyle(ref).overflow !== "scroll" && window.getComputedStyle(ref).overflowY !== "scroll") {
                            this._useWindow = true;
                        }
                        this._addEventListener();
                        this.props.containerRef ? this.props.containerRef(ref) : null;
                    })
                }
            }}>
                {this.state._ref ? <div className={this.props.innerContainerClass || ""} style={{
                    height: this.state._scrollHeight > 0 ? this.state._scrollHeight - this.state._topSpacer : "unset",
                    paddingTop: this.state._topSpacer,
                    ...this.props.innerContainerStyle
                }}>
                    {(!this.state._loading || this.state._progress) ? this.state._renderItems.map((item, i) => this.props.onRender(item, startIdx + i, this.state._columns)) : null}
                </div> : null}
                {this.state._loading && this.props.calculateHeight === undefined && this.props.items && this.props.items.length ? <div style={invisible}>
                    {this.props.items.filter((v, i) => i >= low && i < high).map((e, j) => {
                        return this._itemHeight[(low + j)] ? null : <div key={j} ref={(ref) => {
                            if (ref && !this._itemHeight[(low + j)]) {
                                this._itemHeight[(low + j)] = ref.clientHeight;
                                this._progressCounter++;
                                if (this._progressCounter === this.props.items.length) {
                                    this._nextFrame(() => {
                                        this._reflowComplete(true);
                                    });
                                } else if (this._progressCounter > 0 && this._progressCounter % 100 === 0) {
                                    this._nextFrame(() => {
                                        this.setState({ _progress: this._progressCounter }, () => {
                                            this._reflowComplete(false);
                                        });
                                    });
                                }
                            }
                        }}>{this.props.onRender(e, low + j, 0)}</div>;
                    })}
                </div> : null}
            </div>
        )
    }
}