"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var invisible = { opacity: 0, height: 0 };
var DVL = (function (_super) {
    __extends(DVL, _super);
    function DVL(p) {
        var _this = _super.call(this, p) || this;
        _this.buffer = 5;
        _this.itemHeight = [];
        _this.itemRows = [];
        _this.batchCounter = 0;
        _this.counter = 0;
        _this.id = Math.random();
        _this.reflowLayout = _this.reflowLayout.bind(_this);
        _this.debounceResize = _this.debounceResize.bind(_this);
        _this.calcVisible = _this.calcVisible.bind(_this);
        _this.scheduleVisibleUpdate = _this.scheduleVisibleUpdate.bind(_this);
        _this.rowCache = [];
        _this.firstRender = 0;
        _this.hasWin = typeof window !== "undefined";
        _this.state = {
            loading: false,
            progress: 0,
            scrollHeight: 0,
            topSpacer: 0,
            batch: 0,
            renderRange: [],
            columns: 0
        };
        return _this;
    }
    DVL.prototype.componentWillMount = function () {
        if (typeof this.props.buffer !== "undefined") {
            this.buffer = this.props.buffer;
        }
        if (this.props.doUpdate) {
            this.props.doUpdate(this.calcVisible);
        }
        this.reflowLayout();
        if (this.hasWin && typeof this.props.calculateHeight !== "number") {
            window.addEventListener("resize", this.debounceResize);
        }
    };
    DVL.prototype.componentWillUnmount = function () {
        if (this.hasWin && typeof this.props.calculateHeight !== "number") {
            window.removeEventListener("resize", this.debounceResize);
        }
    };
    DVL.prototype.debounceResize = function () {
        if (this.doResize) {
            clearTimeout(this.doResize);
        }
        this.doResize = setTimeout(this.reflowLayout, 250);
    };
    DVL.prototype.reflowLayout = function () {
        var _this = this;
        this.props.onResizeStart ? this.props.onResizeStart() : null;
        this.counter = 0;
        setTimeout(function () {
            _this.itemHeight = [];
            _this.itemRows = [];
            _this.setState({ loading: true, scrollHeight: 0, topSpacer: 0, batch: 0 }, function () {
                var calcHeight = _this.props.calculateHeight;
                if (calcHeight !== undefined) {
                    _this.props.items.forEach(function (item, i) {
                        if (typeof calcHeight === "number") {
                            _this.itemHeight[i] = calcHeight;
                        }
                        else {
                            _this.itemHeight[i] = calcHeight(_this.ref, item, i);
                        }
                    });
                    _this.reflowComplete(true);
                }
            });
        }, this.props.onResizeStart ? 20 : 0);
    };
    DVL.prototype.reflowComplete = function (doFinalPass) {
        var _this = this;
        var maxHeight = 0;
        var columns = Math.floor(this.ref.clientWidth / (this.props.gridItemWidth || 100));
        var rowHeights = [];
        var rowCounter = 0;
        var progress = this.state.progress;
        var scrollHeight = this.itemHeight.reduce(function (p, c, i) {
            if (progress && i > progress - 1)
                return p;
            if (_this.props.gridItemWidth) {
                if (i % columns === 0) {
                    maxHeight = 0;
                }
                _this.rowCache[i] = rowCounter;
                maxHeight = Math.max(maxHeight, _this.itemHeight[i]);
                if (i % columns === (columns - 1)) {
                    rowHeights[rowCounter] = maxHeight;
                    rowCounter++;
                    return p + maxHeight;
                }
                if (i === _this.itemHeight.length - 1) {
                    rowHeights[rowCounter] = maxHeight;
                    return p + maxHeight;
                }
                return p;
            }
            else {
                return p + c;
            }
        }, 0);
        if (this.props.gridItemWidth) {
            this.itemRows = rowHeights;
        }
        else {
            this.itemRows = this.itemHeight;
        }
        if (doFinalPass) {
            this.setState({
                loading: false,
                columns: columns,
                batch: 0,
                progress: 0
            }, function () {
                _this.setState({ scrollHeight: scrollHeight });
                _this.props.onResizeFinish ? _this.props.onResizeFinish(scrollHeight, columns) : null;
                _this.scheduleVisibleUpdate();
            });
        }
        else {
            var avg = Math.round(scrollHeight / progress);
            this.setState({
                scrollHeight: scrollHeight + ((this.props.items.length - progress) * avg),
                columns: columns
            }, function () {
                _this.scheduleVisibleUpdate();
            });
        }
    };
    DVL.prototype.scheduleVisibleUpdate = function () {
        var _this = this;
        if (!this.ticking) {
            this.ticking = true;
            window.requestAnimationFrame(function () {
                _this.calcVisible();
                _this.ticking = false;
            });
        }
    };
    DVL.prototype.calcVisible = function (scrollTop, height) {
        var sTop = scrollTop || this.ref.scrollTop;
        var ht = height || this.ref.clientHeight;
        var top = 0;
        if (this.props.windowContainer && this.hasWin) {
            var relTop = this.ref.getBoundingClientRect().top;
            var doc = document.documentElement;
            sTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
            var distanceFromTopOfDocument = relTop + sTop;
            ht = window.innerHeight;
            if (sTop > distanceFromTopOfDocument) {
                top += distanceFromTopOfDocument;
            }
            else {
                top += sTop;
            }
        }
        var renderRange = [];
        var i = 0;
        while (i < this.itemRows.length) {
            var start = renderRange[0] !== undefined;
            var end = renderRange[1] !== undefined;
            if (!start || !end) {
                if (!start && top >= sTop) {
                    renderRange[0] = i;
                }
                if (!end && start && (top + this.itemRows[i]) > sTop + ht) {
                    renderRange[1] = i;
                }
                top += this.itemRows[i];
                i++;
            }
            else {
                i = this.itemRows.length;
            }
        }
        if (renderRange[1] === undefined) {
            renderRange[1] = this.itemRows.length - 1;
        }
        else {
            renderRange[1] = Math.min(renderRange[1] + this.buffer, this.itemRows.length - 1);
        }
        renderRange[0] = Math.max(0, renderRange[0] - this.buffer);
        var topHeight = 0;
        var j = 0;
        for (var j_1 = 0; j_1 < renderRange[0]; j_1++) {
            if (!this.itemRows[j_1])
                break;
            topHeight += this.itemRows[j_1];
        }
        this.setState({ renderRange: renderRange, topSpacer: topHeight });
    };
    DVL.prototype.addEventListener = function () {
        if (this.ref && !this.props.doUpdate && this.hasWin) {
            if (this.props.windowContainer) {
                window.addEventListener("scroll", this.scheduleVisibleUpdate);
            }
            else {
                this.ref.addEventListener("scroll", this.scheduleVisibleUpdate);
            }
        }
    };
    DVL.prototype.render = function () {
        var _this = this;
        var perBatch = 100;
        var low = (this.state.batch * perBatch);
        var high = low + perBatch;
        var batchCtr = 0;
        return (React.createElement("div", { className: this.props.containerClass, style: this.props.containerStyle, ref: function (ref) {
                if (ref && ref !== _this.ref) {
                    _this.ref = ref;
                    _this.addEventListener();
                    _this.props.containerRef ? _this.props.containerRef(ref) : null;
                }
            } },
            React.createElement("div", { style: {
                    height: this.state.scrollHeight > 0 ? this.state.scrollHeight - this.state.topSpacer : "unset",
                    paddingTop: this.state.topSpacer
                } }, !this.state.loading || this.state.progress ? this.props.items.filter(function (v, i) {
                if (_this.state.progress && i > _this.state.progress - 1)
                    return false;
                if (_this.props.gridItemWidth) {
                    return _this.rowCache[i] >= _this.state.renderRange[0] && _this.rowCache[i] <= _this.state.renderRange[1];
                }
                else {
                    return i >= _this.state.renderRange[0] && i <= _this.state.renderRange[1];
                }
            }).map(function (item, i) { return _this.props.onRender(item, _this.state.renderRange[0] + i, _this.state.columns); }) : null),
            React.createElement("div", { style: invisible }, this.state.loading ? (this.props.calculateHeight !== undefined ? null : React.createElement("div", null, this.props.items.filter(function (v, i) { return i >= low && i < high; }).map(function (item, i) {
                return (React.createElement("div", { key: i, ref: function (ref) {
                        if (ref && !_this.itemHeight[(i + low)]) {
                            _this.counter++;
                            batchCtr++;
                            _this.itemHeight[(i + low)] = ref.clientHeight;
                            if (_this.counter === _this.props.items.length) {
                                _this.reflowComplete(true);
                            }
                            else if (batchCtr === perBatch) {
                                setTimeout(function () {
                                    _this.setState({ batch: _this.state.batch + 1, progress: (_this.state.batch + 1) * perBatch }, function () {
                                        if (_this.state.loading)
                                            _this.reflowComplete(false);
                                    });
                                }, 0);
                            }
                        }
                    } }, _this.props.onRender(item, i)));
            }))) : null)));
    };
    return DVL;
}(React.Component));
exports.DVL = DVL;
