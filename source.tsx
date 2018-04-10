import * as React from "React";

export class DVL extends React.Component<{
    onRender: (item: any, index: number) => JSX.Element;
    windowContainer?: boolean;
    buffer?: number;
    batchSize?: number;
    ref?: (ref: HTMLDivElement) => void;
    style?: React.CSSProperties;
}, {

}> {

    private buffer = 5;
    private batchSize = 100;
    
    constructor(p) {
        super(p);
    }

    componentWillMount() {
        if (typeof this.props.buffer !== "undefined") {
            this.buffer = this.props.buffer;
        }

        if (typeof this.props.batchSize !== "undefined") {
            this.batchSize = this.props.batchSize;
        }
    }

    render() {
        return (
            <div style={this.props.style} ref={this.props.ref}>
            
            </div>
        )
    }
}