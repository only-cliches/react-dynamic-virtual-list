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
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var invisible = { opacity: 0, height: 0 };
var DVL = (function (_super) {
    __extends(DVL, _super);
    function DVL(p) {
        var _this = _super.call(this, p) || this;
        _this._buffer = 5;
        _this._itemHeight = [];
        _this._itemRows = [];
        _this._counter = 0;
        _this._progressCounter = 0;
        _this._reflowLayout = _this._reflowLayout.bind(_this);
        _this._debounceResize = _this._debounceResize.bind(_this);
        _this._calcVisible = _this._calcVisible.bind(_this);
        _this._doReflow = _this._doReflow.bind(_this);
        _this._scheduleVisibleUpdate = _this._scheduleVisibleUpdate.bind(_this);
        _this._rowCache = [];
        _this._firstRender = 0;
        _this._hasWin = typeof window !== "undefined";
        _this.state = {
            _loading: false,
            _progress: 0,
            _scrollHeight: 0,
            _topSpacer: 0,
            _renderRange: [],
            _columns: 0,
            _renderItems: [],
            _ref: null
        };
        return _this;
    }
    DVL.prototype.componentWillMount = function () {
        this._buffer = this.props.buffer !== undefined ? this.props.buffer : 5;
        this._useWindow = this.props.windowContainer;
        if (this.props.doUpdate) {
            this.props.doUpdate(this._calcVisible);
        }
        if (this._hasWin) {
            window.addEventListener("resize", this._debounceResize);
        }
    };
    DVL.prototype.componentWillUnmount = function () {
        if (this._hasWin) {
            window.removeEventListener("resize", this._debounceResize);
        }
        if (this._scrollContainer) {
            this._scrollContainer.removeEventListener("scroll", this._scheduleVisibleUpdate);
        }
    };
    DVL.prototype._debounceResize = function () {
        var _this = this;
        if (this._doResize) {
            clearTimeout(this._doResize);
        }
        this._doResize = setTimeout(function () {
            _this._reflowLayout();
        }, 250);
    };
    DVL.prototype._doReflow = function () {
        var _this = this;
        this._progressCounter = 0;
        this._itemHeight = [];
        this._itemRows = [];
        if (this._hasWin && !this._oldScroll && this._scrollContainer) {
            if (this._scrollContainer !== window) {
                this._oldScroll = this._scrollContainer.scrollTop;
                this._scrollContainer.scrollTop = 0;
            }
            else {
                var doc = document.documentElement;
                this._oldScroll = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
                this._scrollContainer.scrollTo(0, 0);
            }
        }
        setTimeout(function () {
            _this.setState({ _loading: true }, function () {
                var calcHeight = _this.props.calculateHeight;
                if (calcHeight !== undefined) {
                    _this.props.items.forEach(function (item, i) {
                        if (typeof calcHeight === "number") {
                            _this._itemHeight[i] = calcHeight;
                        }
                        else {
                            _this._itemHeight[i] = calcHeight(_this.state._ref, item, i);
                        }
                    });
                    _this._reflowComplete(true);
                }
            });
        }, 0);
    };
    DVL.prototype._reflowLayout = function () {
        this.props.onResizeStart ? this.props.onResizeStart(this._doReflow) : this._doReflow();
    };
    DVL.prototype._reflowComplete = function (doFinalPass) {
        var _this = this;
        var maxHeight = 0;
        var columns = Math.floor(this.state._ref.clientWidth / (this.props.gridItemWidth || 100));
        var rowHeights = [];
        var rowCounter = 0;
        this._rowCache = [];
        var progress = this.state._progress;
        var fixedHeight = typeof this.props.calculateHeight === "number";
        if (fixedHeight) {
            maxHeight = this.props.calculateHeight;
        }
        var scrollHeight = this._itemHeight.reduce(function (p, c, i) {
            if (!doFinalPass && progress && i > progress - 1)
                return p;
            if (_this.props.gridItemWidth) {
                _this._rowCache[i] = rowCounter;
                if (!fixedHeight) {
                    if (i % columns === 0) {
                        maxHeight = 0;
                    }
                    maxHeight = Math.max(maxHeight, _this._itemHeight[i]);
                }
                if (i === _this._itemHeight.length - 1) {
                    rowHeights[rowCounter] = maxHeight;
                    return p + maxHeight;
                }
                if (i % columns === (columns - 1)) {
                    rowHeights[rowCounter] = maxHeight;
                    rowCounter++;
                    return p + maxHeight;
                }
                return p;
            }
            else {
                return p + c;
            }
        }, 0);
        if (this.props.gridItemWidth) {
            this._itemRows = rowHeights;
        }
        else {
            this._itemRows = this._itemHeight;
        }
        if (doFinalPass) {
            this.setState({
                _loading: false,
                _columns: columns,
                _progress: 0
            }, function () {
                _this.setState({ _scrollHeight: scrollHeight }, function () {
                    _this._scheduleVisibleUpdate();
                });
                _this.props.onResizeFinish ? _this.props.onResizeFinish(scrollHeight, columns) : null;
            });
        }
        else {
            var avg = Math.round(scrollHeight / progress);
            var remainingHight = ((this.props.items.length - progress) * avg);
            this.setState({
                _scrollHeight: scrollHeight + remainingHight,
                _columns: columns
            }, function () {
                _this._scheduleVisibleUpdate();
            });
        }
    };
    DVL.prototype._nextFrame = function (cb) {
        if (this._hasWin) {
            window.requestAnimationFrame(function () {
                cb();
            });
        }
        else {
            setTimeout(function () {
                cb();
            }, 16);
        }
    };
    DVL.prototype._scheduleVisibleUpdate = function () {
        if (!this._ticking) {
            this._ticking = true;
            this._nextFrame(this._calcVisible);
        }
    };
    DVL.prototype._calcVisible = function (scrollTopIn, heightIn) {
        var _this = this;
        var height = heightIn || this.state._ref.clientHeight;
        if (this._oldScroll && this._hasWin) {
            if (this._scrollContainer !== window) {
                this._scrollContainer.scrollTop = Math.min(this._oldScroll, this.state._scrollHeight - height);
            }
            else {
                this._scrollContainer.scrollTo(0, Math.min(this._oldScroll, this.state._scrollHeight));
            }
            this._oldScroll = undefined;
        }
        var topHeight = 0;
        var scrollTop = scrollTopIn || this.state._ref.scrollTop;
        var top = 0;
        if (this._useWindow && this._hasWin) {
            var relTop = this.state._ref.getBoundingClientRect().top;
            var doc = document.documentElement;
            scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
            var containerDistanceFromTopOfDoc = relTop + scrollTop;
            height = window.innerHeight;
            scrollTop -= containerDistanceFromTopOfDoc;
            if (scrollTop < 0 && scrollTop < height * -1) {
                this._ticking = false;
                return;
            }
        }
        var renderRange = [];
        var i = 0;
        while (i < this._itemRows.length) {
            var start = renderRange[0] !== undefined;
            var end = renderRange[1] !== undefined;
            if (!start || !end) {
                if (!start && (top + this._itemRows[i]) >= scrollTop) {
                    renderRange[0] = Math.max(0, i - this._buffer);
                    topHeight = top;
                    if (renderRange[0] !== i) {
                        var goUp = 1;
                        var diff = (i - renderRange[0]);
                        while (diff > 0 && goUp <= diff) {
                            topHeight -= this._itemRows[i - goUp];
                            goUp++;
                        }
                    }
                }
                else if (!end && start && top > scrollTop + height) {
                    renderRange[1] = Math.min(i + this._buffer, this._itemRows.length);
                }
                top += this._itemRows[i];
                i++;
            }
            else {
                i = this._itemRows.length;
            }
        }
        if (renderRange[1] === undefined) {
            renderRange[1] = this._itemRows.length;
        }
        this._ticking = false;
        this.setState({
            _renderRange: renderRange,
            _topSpacer: topHeight,
            _renderItems: (function () {
                if (_this.props.calculateHeight !== undefined) {
                    var ranges = _this.props.gridItemWidth ? renderRange.map(function (r) { return r * _this.state._columns; }) : renderRange;
                    return _this.props.items.slice.apply(_this.props.items, ranges);
                }
                return _this.props.items.filter(function (v, i) {
                    if (_this.state._progress && i > _this.state._progress - 1)
                        return false;
                    if (_this.props.gridItemWidth) {
                        return _this._rowCache[i] >= renderRange[0] && _this._rowCache[i] <= renderRange[1];
                    }
                    else {
                        return i >= renderRange[0] && i <= renderRange[1];
                    }
                });
            })()
        });
    };
    DVL.prototype._addEventListener = function () {
        if (this.state._ref && !this.props.doUpdate && this._hasWin) {
            if (this._useWindow) {
                this._scrollContainer = window;
            }
            else {
                this._scrollContainer = this.state._ref;
            }
            this._scrollContainer.addEventListener("scroll", this._scheduleVisibleUpdate);
        }
        this._reflowLayout();
    };
    DVL.prototype.render = function () {
        var _this = this;
        var low = this.state._progress;
        var high = this.state._progress + 100;
        var startIdx = this.props.gridItemWidth ? this.state._renderRange[0] * this.state._columns : this.state._renderRange[0];
        if (typeof window === "undefined") {
            return (React.createElement("div", { className: this.props.containerClass, style: __assign({ marginBottom: "10px" }, this.props.containerStyle) },
                React.createElement("div", { className: this.props.innerContainerClass || "", style: this.props.innerContainerStyle || {} }, this.props.items.map(function (e, j) { return _this.props.onRender(e, j, 0); }))));
        }
        return (React.createElement("div", { className: this.props.containerClass, style: __assign({ marginBottom: "10px", boxSizing: "content-box" }, this.props.containerStyle), ref: function (ref) {
                if (ref && ref !== _this.state._ref) {
                    _this.setState({ _ref: ref }, function () {
                        if (_this._hasWin && window.getComputedStyle(ref).overflow !== "scroll" && window.getComputedStyle(ref).overflowY !== "scroll") {
                            _this._useWindow = true;
                        }
                        _this._addEventListener();
                        _this.props.containerRef ? _this.props.containerRef(ref) : null;
                    });
                }
            } },
            this.state._ref ? React.createElement("div", { className: this.props.innerContainerClass || "", style: __assign({ height: this.state._scrollHeight > 0 ? this.state._scrollHeight - this.state._topSpacer : "unset", paddingTop: this.state._topSpacer }, this.props.innerContainerStyle) }, (!this.state._loading || this.state._progress) ? this.state._renderItems.map(function (item, i) { return _this.props.onRender(item, startIdx + i, _this.state._columns); }) : null) : null,
            this.state._loading && this.props.calculateHeight === undefined && this.props.items && this.props.items.length ? React.createElement("div", { style: invisible }, this.props.items.filter(function (v, i) { return i >= low && i < high; }).map(function (e, j) {
                return _this._itemHeight[(low + j)] ? null : React.createElement("div", { key: j, ref: function (ref) {
                        if (ref && !_this._itemHeight[(low + j)]) {
                            _this._itemHeight[(low + j)] = ref.clientHeight;
                            _this._progressCounter++;
                            if (_this._progressCounter === _this.props.items.length) {
                                _this._nextFrame(function () {
                                    _this._reflowComplete(true);
                                });
                            }
                            else if (_this._progressCounter > 0 && _this._progressCounter % 100 === 0) {
                                _this._nextFrame(function () {
                                    _this.setState({ _progress: _this._progressCounter }, function () {
                                        _this._reflowComplete(false);
                                    });
                                });
                            }
                        }
                    } }, _this.props.onRender(e, low + j, 0));
            })) : null));
    };
    return DVL;
}(React.PureComponent));
exports.DVL = DVL;
