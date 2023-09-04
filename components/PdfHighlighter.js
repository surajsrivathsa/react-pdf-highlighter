import "pdfjs-dist/web/pdf_viewer.css";
import "../style/pdf_viewer.css";
import "../style/PdfHighlighter.css";
import { EventBus, NullL10n, PDFLinkService, PDFViewer, } from "pdfjs-dist/legacy/web/pdf_viewer";
import React, { PureComponent } from "react";
import { asElement, findOrCreateContainerLayer, getPageFromElement, getPagesFromRange, getWindow, isHTMLElement, } from "../lib/pdfjs-dom";
import { scaledToViewport, viewportToScaled } from "../lib/coordinates";
import MouseSelection from "./MouseSelection";
import TipContainer from "./TipContainer";
import { createRoot } from "react-dom/client";
import debounce from "lodash.debounce";
import getAreaAsPng from "../lib/get-area-as-png";
import getBoundingRect from "../lib/get-bounding-rect";
import getClientRects from "../lib/get-client-rects";
import { HighlightLayer } from "./HighlightLayer";
const EMPTY_ID = "empty-id";
export class PdfHighlighter extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            ghostHighlight: null,
            isCollapsed: true,
            range: null,
            scrolledToHighlightId: EMPTY_ID,
            isAreaSelectionInProgress: false,
            tip: null,
            tipPosition: null,
            tipChildren: null,
        };
        this.eventBus = new EventBus();
        this.linkService = new PDFLinkService({
            eventBus: this.eventBus,
            externalLinkTarget: 2,
        });
        this.resizeObserver = null;
        this.containerNode = null;
        this.highlightRoots = {};
        this.unsubscribe = () => { };
        this.attachRef = () => {
            var _a;
            const { eventBus, resizeObserver: observer } = this;
            const ref = (this.containerNode = this.containerNodeRef.current);
            this.unsubscribe();
            if (ref) {
                const { ownerDocument: doc } = ref;
                eventBus.on("textlayerrendered", this.onTextLayerRendered);
                eventBus.on("pagesinit", this.onDocumentReady);
                doc.addEventListener("selectionchange", this.onSelectionChange);
                doc.addEventListener("keydown", this.handleKeyDown);
                (_a = doc.defaultView) === null || _a === void 0 ? void 0 : _a.addEventListener("resize", this.debouncedScaleValue);
                if (observer)
                    observer.observe(ref);
                this.unsubscribe = () => {
                    var _a;
                    eventBus.off("pagesinit", this.onDocumentReady);
                    eventBus.off("textlayerrendered", this.onTextLayerRendered);
                    doc.removeEventListener("selectionchange", this.onSelectionChange);
                    doc.removeEventListener("keydown", this.handleKeyDown);
                    (_a = doc.defaultView) === null || _a === void 0 ? void 0 : _a.removeEventListener("resize", this.debouncedScaleValue);
                    if (observer)
                        observer.disconnect();
                };
            }
        };
        this.hideTipAndSelection = () => {
            this.setState({
                tipPosition: null,
                tipChildren: null,
            });
            // console.log("hide tipposition");
            this.setState({ ghostHighlight: null, tip: null }, () => this.renderHighlightLayers());
        };
        this.renderTip = () => {
            const { tipPosition, tipChildren } = this.state;
            if (!tipPosition)
                return null;
            const { boundingRect, pageNumber } = tipPosition;
            let paginatedPageNumber = null;
            if (pageNumber > this.props.pageSize) {
                paginatedPageNumber = pageNumber - this.props.currentPage + 1;
            }
            else {
                paginatedPageNumber = pageNumber;
            }
            const page = {
                node: this.viewer.getPageView((paginatedPageNumber || boundingRect.pageNumber || pageNumber) - 1)
                    .div,
                pageNumber: paginatedPageNumber || boundingRect.pageNumber || pageNumber,
            };
            const pageBoundingClientRect = page.node.getBoundingClientRect();
            const pageBoundingRect = {
                bottom: pageBoundingClientRect.bottom,
                height: pageBoundingClientRect.height,
                left: pageBoundingClientRect.left,
                right: pageBoundingClientRect.right,
                top: pageBoundingClientRect.top,
                width: pageBoundingClientRect.width,
                x: pageBoundingClientRect.x,
                y: pageBoundingClientRect.y,
                pageNumber: page.pageNumber,
            };
            if (pageBoundingRect.pageNumber < this.props.pageSize &&
                this.props.currentPage > this.props.pageSize) {
                pageBoundingRect.pageNumber = pageBoundingRect.pageNumber + this.props.currentPage - 1;
            }
            // console.log("renderTip: ", tipPosition, " pageBoundingRect: ", pageBoundingRect);
            return (React.createElement(TipContainer, { scrollTop: this.viewer.container.scrollTop, pageBoundingRect: pageBoundingRect, style: {
                    left: page.node.offsetLeft + boundingRect.left + boundingRect.width / 2,
                    top: boundingRect.top + page.node.offsetTop,
                    bottom: boundingRect.top + page.node.offsetTop + boundingRect.height,
                } }, tipChildren));
        };
        this.onTextLayerRendered = () => {
            this.renderHighlightLayers();
        };
        this.scrollTo = (highlight) => {
            const { pageNumber, boundingRect, usePdfCoordinates } = highlight.position;
            this.viewer.container.removeEventListener("scroll", this.onScroll);
            let paginatedPageNumber = null;
            if (pageNumber > this.props.pageSize) {
                paginatedPageNumber = pageNumber - this.props.currentPage + 1;
            }
            else {
                paginatedPageNumber = pageNumber;
            }
            // console.log("scrollTo: ", pageNumber, paginatedPageNumber);
            const pageViewport = this.viewer.getPageView(paginatedPageNumber - 1).viewport;
            const scrollMargin = 10;
            this.viewer.scrollPageIntoView({
                pageNumber: paginatedPageNumber,
                destArray: [
                    null,
                    { name: "XYZ" },
                    ...pageViewport.convertToPdfPoint(0, scaledToViewport(boundingRect, pageViewport, usePdfCoordinates).top -
                        scrollMargin),
                    0,
                ],
            });
            this.setState({
                scrolledToHighlightId: highlight.id,
            }, () => this.renderHighlightLayers());
            // wait for scrolling to finish
            setTimeout(() => {
                this.viewer.container.addEventListener("scroll", this.onScroll);
            }, 100);
        };
        this.onDocumentReady = () => {
            const { scrollRef } = this.props;
            this.handleScaleValue();
            scrollRef(this.scrollTo);
        };
        this.onSelectionChange = () => {
            const container = this.containerNode;
            const selection = getWindow(container).getSelection();
            if (!selection) {
                return;
            }
            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            if (selection.isCollapsed) {
                this.setState({ isCollapsed: true });
                return;
            }
            if (!range ||
                !container ||
                !container.contains(range.commonAncestorContainer)) {
                return;
            }
            this.setState({
                isCollapsed: false,
                range,
            });
            this.debouncedAfterSelection();
        };
        this.onScroll = () => {
            const { onScrollChange } = this.props;
            onScrollChange();
            this.setState({
                scrolledToHighlightId: EMPTY_ID,
            }, () => this.renderHighlightLayers());
            this.viewer.container.removeEventListener("scroll", this.onScroll);
        };
        this.onMouseDown = (event) => {
            if (!isHTMLElement(event.target)) {
                return;
            }
            if (asElement(event.target).closest(".PdfHighlighter__tip-container")) {
                return;
            }
            this.hideTipAndSelection();
        };
        this.handleKeyDown = (event) => {
            if (event.code === "Escape") {
                this.hideTipAndSelection();
            }
        };
        this.afterSelection = () => {
            const { onSelectionFinished } = this.props;
            const { isCollapsed, range } = this.state;
            if (!range || isCollapsed) {
                return;
            }
            const pages = getPagesFromRange(range); //pdfjs method that returns elements for paginated page pdf ranges
            if (!pages || pages.length === 0) {
                return;
            }
            const rects = getClientRects(range, pages);
            // console.log("pages: ", pages, " afterselection-rects: ", rects);
            if (rects.length === 0) {
                return;
            }
            // console.log("pagerange-afterselection: ", pages, " rects-afterselection: ", rects);
            const realPageNumber = pages[0].number + this.props.currentPage - 1;
            let boundingRect = getBoundingRect(rects);
            boundingRect.pageNumber = realPageNumber; // use real page number rather paginatyed ones
            const viewportPosition = {
                boundingRect,
                rects,
                pageNumber: realPageNumber //pages[0].number 
            };
            const content = {
                text: range.toString(),
            };
            const scaledPosition = this.viewportPositionToScaled(viewportPosition);
            this.setTip(viewportPosition, onSelectionFinished(scaledPosition, content, () => this.hideTipAndSelection(), () => this.setState({
                ghostHighlight: { position: scaledPosition },
            }, () => this.renderHighlightLayers())));
            // console.log("onselectionfinished: ", scaledPosition);
        };
        this.debouncedAfterSelection = debounce(this.afterSelection, 500);
        this.handleScaleValue = () => {
            if (this.viewer) {
                this.viewer.currentScaleValue = this.props.pdfScaleValue; //"page-width";
            }
        };
        this.debouncedScaleValue = debounce(this.handleScaleValue, 500);
        if (typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(this.debouncedScaleValue);
        }
        this.containerNodeRef = React.createRef();
    }
    componentDidMount() {
        this.init();
    }
    componentDidUpdate(prevProps) {
        if (prevProps.pdfDocument !== this.props.pdfDocument) {
            this.init();
            return;
        }
        if (prevProps.highlights !== this.props.highlights) {
            this.renderHighlightLayers();
        }
    }
    init() {
        const { pdfDocument } = this.props;
        this.attachRef();
        this.viewer =
            this.viewer ||
                new PDFViewer({
                    container: this.containerNodeRef.current,
                    eventBus: this.eventBus,
                    // enhanceTextSelection: true, // deprecated. https://github.com/mozilla/pdf.js/issues/9943#issuecomment-409369485
                    textLayerMode: 2,
                    removePageBorders: true,
                    linkService: this.linkService,
                    l10n: NullL10n,
                });
        this.linkService.setDocument(pdfDocument);
        this.linkService.setViewer(this.viewer);
        this.viewer.setDocument(pdfDocument);
        // debug
        window.PdfViewer = this;
    }
    componentWillUnmount() {
        this.unsubscribe();
    }
    findOrCreateHighlightLayer(page) {
        let paginatedPageNumber = null;
        if (page > this.props.pageSize) {
            paginatedPageNumber = page - this.props.currentPage + 1; // Map to paginated number
        }
        else {
            paginatedPageNumber = page; // Map to paginated number
        }
        const { textLayer } = this.viewer.getPageView(paginatedPageNumber - 1) || {};
        //// console.log("textLayer: ", textLayer);
        if (!textLayer) {
            return null;
        }
        return findOrCreateContainerLayer(textLayer.textLayerDiv, "PdfHighlighter__highlight-layer");
    }
    groupHighlightsByPage(highlights, currentPage, endPage) {
        const { ghostHighlight } = this.state;
        // Filter out null or undefined values
        const allHighlights = [...highlights, ghostHighlight].filter((x) => Boolean(x));
        const pageNumbers = new Set();
        for (const highlight of allHighlights) {
            const highlightPage = highlight.position.pageNumber;
            // Filter out highlights that don't belong to the current page range
            if (highlightPage < currentPage || highlightPage > endPage) {
                continue;
            }
            pageNumbers.add(highlight.position.pageNumber);
            for (const rect of highlight.position.rects) {
                if (rect.pageNumber) {
                    // Again, filter based on current page range
                    if (rect.pageNumber < currentPage || rect.pageNumber > endPage) {
                        continue;
                    }
                    pageNumbers.add(rect.pageNumber);
                }
            }
        }
        const groupedHighlights = {};
        // console.log("highlight pageNumbers: ", pageNumbers, );
        for (const pageNumber of pageNumbers) {
            groupedHighlights[pageNumber] = groupedHighlights[pageNumber] || [];
            for (const highlight of allHighlights) {
                const pageSpecificHighlight = Object.assign(Object.assign({}, highlight), { position: {
                        pageNumber,
                        boundingRect: highlight.position.boundingRect,
                        rects: [],
                        usePdfCoordinates: highlight.position.usePdfCoordinates,
                    } });
                let anyRectsOnPage = false;
                for (const rect of highlight.position.rects) {
                    // Assuming rect.pageNumber holds the real page number
                    // const realRectPageNumber = rect.pageNumber;
                    if (pageNumber === (rect.pageNumber || highlight.position.pageNumber)) {
                        pageSpecificHighlight.position.rects.push(rect);
                        anyRectsOnPage = true;
                    }
                }
                if (anyRectsOnPage || pageNumber === highlight.position.pageNumber) {
                    groupedHighlights[pageNumber].push(pageSpecificHighlight);
                }
            }
        }
        // console.log(" groupedHighlights: ", groupedHighlights);
        return groupedHighlights;
    }
    showTip(highlight, content) {
        const { isCollapsed, ghostHighlight, isAreaSelectionInProgress } = this.state;
        const highlightInProgress = !isCollapsed || ghostHighlight;
        if (highlightInProgress || isAreaSelectionInProgress) {
            return;
        }
        // console.log("showTip: ", highlight.position);
        this.setTip(highlight.position, content);
    }
    scaledPositionToViewport({ pageNumber, boundingRect, rects, usePdfCoordinates, }) {
        let paginatedPageNumber = null;
        if (pageNumber > this.props.pageSize) {
            paginatedPageNumber = pageNumber - this.props.currentPage + 1;
        }
        else {
            paginatedPageNumber = pageNumber;
        }
        const viewport = this.viewer.getPageView(paginatedPageNumber - 1).viewport;
        // console.log("scaledPositionToViewport: ", pageNumber);
        // console.log("xx: ", {
        //   originalboundingrect: boundingRect,
        //   boundingRect: scaledToViewport(boundingRect, viewport, usePdfCoordinates),
        //   rects: (rects || []).map((rect) =>
        //     scaledToViewport(rect, viewport, usePdfCoordinates)
        //   ),
        //   pageNumber,
        //   usePdfCoordinates,
        // });
        return {
            boundingRect: scaledToViewport(boundingRect, viewport, usePdfCoordinates),
            rects: (rects || []).map((rect) => scaledToViewport(rect, viewport, usePdfCoordinates)),
            pageNumber,
        };
    }
    viewportPositionToScaled({ pageNumber, boundingRect, rects, }) {
        let paginatedPageNumber = null;
        if (pageNumber > this.props.pageSize) {
            paginatedPageNumber = pageNumber - this.props.currentPage + 1;
        }
        else {
            paginatedPageNumber = pageNumber;
        }
        // // console.log("paginatedPageNumber: ", paginatedPageNumber);
        const viewport = this.viewer.getPageView(paginatedPageNumber - 1).viewport;
        // console.log("viewportPositionToScaled: ", viewportToScaled(boundingRect, viewport), " pageNumber: ", pageNumber);
        const updatedRectObjects = rects.map((obj) => (Object.assign(Object.assign({}, obj), { pageNumber: obj.pageNumber + this.props.currentPage - 1 })));
        return {
            boundingRect: viewportToScaled(boundingRect, viewport),
            rects: (updatedRectObjects || []).map((rect) => viewportToScaled(rect, viewport)),
            pageNumber,
        };
    }
    screenshot(position, pageNumber) {
        let paginatedPageNumber = null;
        if (pageNumber > this.props.pageSize) {
            paginatedPageNumber = pageNumber - this.props.currentPage + 1;
        }
        else {
            paginatedPageNumber = pageNumber;
        }
        const canvas = this.viewer.getPageView(paginatedPageNumber - 1).canvas;
        return getAreaAsPng(canvas, position);
    }
    setTip(position, inner) {
        this.setState({
            tipPosition: position,
            tipChildren: inner,
        });
    }
    toggleTextSelection(flag) {
        this.viewer.viewer.classList.toggle("PdfHighlighter--disable-selection", flag);
    }
    render() {
        const { onSelectionFinished, enableAreaSelection } = this.props;
        return (React.createElement("div", { onPointerDown: this.onMouseDown },
            React.createElement("div", { ref: this.containerNodeRef, className: "PdfHighlighter", onContextMenu: (e) => e.preventDefault() },
                React.createElement("div", { className: "pdfViewer" }),
                this.renderTip(),
                typeof enableAreaSelection === "function" ? (React.createElement(MouseSelection, { onDragStart: () => this.toggleTextSelection(true), onDragEnd: () => this.toggleTextSelection(false), onChange: (isVisible) => this.setState({ isAreaSelectionInProgress: isVisible }), shouldStart: (event) => enableAreaSelection(event) &&
                        isHTMLElement(event.target) &&
                        Boolean(asElement(event.target).closest(".page")), onSelection: (startTarget, boundingRect, resetSelection) => {
                        const page = getPageFromElement(startTarget);
                        // console.log("startTarget: ", startTarget,  " boundingRect: ", boundingRect);
                        if (!page) {
                            return;
                        }
                        // let paginatedPageNumber = null;
                        // if (page.number > this.props.pageSize){
                        //   paginatedPageNumber = page.number - this.props.currentPage + 1;
                        // }
                        // else{
                        //   paginatedPageNumber = page.number
                        // }
                        const pageBoundingRect = Object.assign(Object.assign({}, boundingRect), { top: boundingRect.top - page.node.offsetTop, left: boundingRect.left - page.node.offsetLeft, pageNumber: page.number + this.props.currentPage - 1 });
                        const viewportPosition = {
                            boundingRect: pageBoundingRect,
                            rects: [pageBoundingRect],
                            pageNumber: page.number + this.props.currentPage - 1,
                        };
                        const scaledPosition = this.viewportPositionToScaled(viewportPosition);
                        const image = this.screenshot(pageBoundingRect, pageBoundingRect.pageNumber);
                        // console.log("Debug: scaledPosition in onSelection", scaledPosition);
                        // console.log("Debug: image in onSelection", image);
                        this.setTip(viewportPosition, onSelectionFinished(scaledPosition, { image }, () => this.hideTipAndSelection(), () => {
                            // console.log("setting ghost highlight", scaledPosition);
                            this.setState({
                                ghostHighlight: {
                                    position: scaledPosition,
                                    content: { image },
                                },
                            }, () => {
                                resetSelection();
                                this.renderHighlightLayers();
                            });
                        }));
                    } })) : null)));
    }
    renderHighlightLayers() {
        const { currentPage, pageSize } = this.props;
        // Calculate the end page for the current batch
        //const endPage = Math.min(currentPage + pageSize - 1, totalPageCount);
        // console.log("highlight layer - currentPage: ", currentPage, " endPage: ", endPage);
        // console.log("highlightRoots: ", this.highlightRoots);
        for (let pageNumber = currentPage; pageNumber <= currentPage + pageSize; pageNumber++) {
            // const cutPageNumber = pageNumber - currentPage + 1;
            const highlightRoot = this.highlightRoots[pageNumber];
            // // console.log("highlightRoot: ", highlightRoot, " cutPageNumber: ", cutPageNumber);
            /** Need to check if container is still attached to the DOM as PDF.js can unload pages. */
            if (highlightRoot && highlightRoot.container.isConnected) {
                this.renderHighlightLayer(highlightRoot.reactRoot, pageNumber);
            }
            else {
                const highlightLayer = this.findOrCreateHighlightLayer(pageNumber);
                if (highlightLayer) {
                    const reactRoot = createRoot(highlightLayer);
                    this.highlightRoots[pageNumber] = {
                        reactRoot,
                        container: highlightLayer,
                    };
                    this.renderHighlightLayer(reactRoot, pageNumber);
                }
            }
        }
    }
    renderHighlightLayer(root, pageNumber) {
        const { highlightTransform, highlights, currentPage, pageSize, totalPageCount } = this.props;
        const { tip, scrolledToHighlightId } = this.state;
        // Calculate the end page for the current batch
        const realPageNumber = pageNumber;
        const paginatedPageNumber = pageNumber - currentPage + 1;
        const endPage = Math.min(currentPage + pageSize - 1, totalPageCount);
        root.render(React.createElement(HighlightLayer, { highlightsByPage: this.groupHighlightsByPage(highlights, currentPage, endPage), pageNumber: paginatedPageNumber.toString(), scrolledToHighlightId: scrolledToHighlightId, highlightTransform: highlightTransform, tip: tip, scaledPositionToViewport: this.scaledPositionToViewport.bind(this), hideTipAndSelection: this.hideTipAndSelection.bind(this), viewer: this.viewer, screenshot: this.screenshot.bind(this), showTip: this.showTip.bind(this), setState: this.setState.bind(this), currentPage: currentPage, realPageNumber: realPageNumber, pageSize: pageSize }));
    }
}
PdfHighlighter.defaultProps = {
    pdfScaleValue: "auto",
    pageSize: 20,
    totalPageCount: 1,
    currentPage: 1,
};
//# sourceMappingURL=PdfHighlighter.js.map