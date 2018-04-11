import * as React from "React";

export class DVL<T> extends React.PureComponent<{
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

    private buffer = 5;
    private ref: HTMLDivElement;
    private itemHeight: number[] = [];
    private doResize: number;
    private batchCounter: number = 0;
    private hasWin: boolean;
    private scrollDone: number;
    private ticking: boolean;
    private rowCache: number[];
    private counter: number = 0;
    private id: number = Math.random();

    constructor(p) {
        super(p);
        this.reflowLayout = this.reflowLayout.bind(this);
        this.debounceResize = this.debounceResize.bind(this);
        this.calcVisible = this.calcVisible.bind(this);
        this.scheduleVisibleUpdate = this.scheduleVisibleUpdate.bind(this);
        this.rowCache = [];

        this.hasWin = typeof window !== "undefined";
        this.state = {
            loading: false,
            scrollHeight: 0,
            topSpacer: 0,
            batch: 0,
            renderRange: [],
            columns: 0
        };
    }

    public componentWillMount(): void {
        if (typeof this.props.buffer !== "undefined") {
            this.buffer = this.props.buffer;
        }

        if (this.props.doUpdate) {
            this.props.doUpdate(this.calcVisible);
        }

        this.reflowLayout();

        if (this.hasWin) {
            window.addEventListener("resize", this.debounceResize);
        }
        
    }

    public componentWillUnmount() {
        if (this.hasWin) {
            window.removeEventListener("resize", this.debounceResize);
        }
    }

    public debounceResize() {
        if (this.doResize) {
            clearTimeout(this.doResize);
        }
        this.doResize = setTimeout(this.reflowLayout, 250);
    }

    public reflowLayout(): void {

        this.props.onResizeStart ? this.props.onResizeStart() : null;
        // if any props are changed in response to the resize start event
        // 20ms is enough time for the UI to update to show "Loading" or something like that.

        this.counter = 0;
        setTimeout(() => {
            this.itemHeight = [];
            this.setState({ loading: true, scrollHeight: 0, topSpacer: 0, batch: 0 }, () => {
                const calcHeight = this.props.calculateHeight;
                if (calcHeight !== undefined) {
                    this.props.items.forEach((item, i) => {
                        if (typeof calcHeight === "number") {
                            this.itemHeight[i] = calcHeight;
                        } else {
                            this.itemHeight[i] = calcHeight(this.ref, item, i);
                        }
                    })
                    this.reflowComplete();
                }
            });
        }, this.props.onResizeStart ? 20: 0);


    }

    public reflowComplete() {
        let maxHeight = 0;
        const columns = Math.floor(this.ref.clientWidth / (this.props.gridItemWidth || 100));
        let rowHeights: number[] = [];
        let rowCounter: number = 0;
        const scrollHeight = this.itemHeight.reduce((p, c, i) => {
            if (this.props.gridItemWidth) {
                if (i % columns === 0) {
                    maxHeight = 0;
                }
                this.rowCache[i] = rowCounter;
                maxHeight = Math.max(maxHeight, this.itemHeight[i]);
                if (i % columns === (columns - 1)) { 
                    rowHeights[rowCounter] = maxHeight;
                    rowCounter++;
                    return p + maxHeight;
                }
                // very last row
                if (i === this.itemHeight.length - 1) {
                    rowHeights[rowCounter] = maxHeight;
                    return p + maxHeight;
                }
                return p;
            } else {
                return p + c;
            }
        }, 0);

        if (this.props.gridItemWidth) {
            this.itemHeight = rowHeights;
        }

        this.setState({ loading: false, scrollHeight: scrollHeight, columns: columns, batch: 0 }, () => {
            this.props.onResizeFinish ? this.props.onResizeFinish(columns) : null;
            this.scheduleVisibleUpdate();
        })
    }


    public scheduleVisibleUpdate() {
        if (!this.ticking) {
            this.ticking = true;
            window.requestAnimationFrame(() => {
                this.calcVisible();
                this.ticking = false;
            });
        }
    }

    public calcVisible(scrollTop?: number, height?: number) {

        let sTop = scrollTop || this.ref.scrollTop;
        let ht = height || this.ref.clientHeight;
        let top = 0;
        if (this.props.windowContainer && this.hasWin) {
            let relTop = this.ref.getBoundingClientRect().top;
            const doc = document.documentElement;
            sTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
            const distanceFromTopOfDocument = relTop + sTop;
            ht = window.innerHeight;

            if (sTop > distanceFromTopOfDocument) {
                top += distanceFromTopOfDocument;
            } else {
                top += sTop;
                // ht -= sTop;
            }
        }
        

        let renderRange: number[] = [];
        let i = 0;
        while (i < this.itemHeight.length) {

            const start = renderRange[0] !== undefined;
            const end = renderRange[1] !== undefined;
            if (!start || !end) {
                if (!start && top >= sTop) {
                    renderRange[0] = i;
                }
                if (!end && start && (top + this.itemHeight[i]) > sTop + ht) {
                    renderRange[1] = i;
                }
                top += this.itemHeight[i];
                i++;
            } else {
                i = this.itemHeight.length;
            }
        }

        if (renderRange[1] === undefined) {
            renderRange[1] = this.itemHeight.length - 1;
        } else {
            renderRange[1] = Math.min(renderRange[1] + this.buffer, this.itemHeight.length - 1);
        }
        renderRange[0] = Math.max(0, renderRange[0] - this.buffer);

        let topHeight = 0;
        let j = 0;
        for (let j = 0; j < renderRange[0]; j++) {
            if (!this.itemHeight[j]) break;
            topHeight += this.itemHeight[j];
        }

        this.setState({ renderRange: renderRange, topSpacer: topHeight });

    }

    public addEventListener(): void {
        if (this.ref && !this.props.doUpdate && this.hasWin) {
            if (this.props.windowContainer) {
                window.addEventListener("scroll", this.scheduleVisibleUpdate);
            } else {
                this.ref.addEventListener("scroll", this.scheduleVisibleUpdate);
            }
        }
    }


    public render() {

        const perBatch = 500;
        const low = (this.state.batch * perBatch);
        const high = low + perBatch;
        let batchCtr: number = 0;

        return (
            <div className={this.props.className} style={this.props.style} ref={(ref) => {
                if (ref && ref !== this.ref) {
                    this.ref = ref;
                    this.addEventListener();
                    this.props.ref ? this.props.ref(ref) : null;
                }
            }}>
                <div style={{
                    height: this.state.scrollHeight > 0 ? this.state.scrollHeight - this.state.topSpacer : "unset",
                    paddingTop: this.state.topSpacer
                }}>
                    {this.state.loading ? (this.props.calculateHeight !== undefined ? null : <div>
                        {this.props.items.filter((v, i) => i >= low && i < high).map((item, i) => {
                            return (
                                <div key={i} ref={(ref) => {
                                    if (ref && !this.itemHeight[(i + low)]) {
                                        this.counter++;
                                        batchCtr++;
                                        this.itemHeight[(i + low)] = ref.clientHeight;
                                        if (this.counter === this.props.items.length) {
                                            this.reflowComplete();
                                        } else if (batchCtr === perBatch) {
                                            // break the stack so we dont freeze the UI
                                            setTimeout(() => {
                                                this.setState({ batch: this.state.batch + 1 });
                                            }, 0);
                                        }
                                    }
                                }}>
                                    {this.props.onRender(item, i)}
                                </div>
                            )
                        })}
                    </div>) : this.props.items.filter((v, i) => {
                        if (this.props.gridItemWidth) {
                            return this.rowCache[i] >= this.state.renderRange[0] && this.rowCache[i] <= this.state.renderRange[1];
                        } else {
                            return i >= this.state.renderRange[0] && i <= this.state.renderRange[1];
                        }
                    }).map((item, i) => this.props.onRender(item, this.state.renderRange[0] + i))}
                </div>
            </div>
        )
    }
}