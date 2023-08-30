"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const PDFPage = ({ pageNumber, pdfDocument, isVisible, onPageHeight }) => {
    const canvasRef = (0, react_1.useRef)(null);
    const renderTaskRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        const renderPage = () => __awaiter(void 0, void 0, void 0, function* () {
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
            if (mounted && canvasRef.current && isVisible) {
                const page = yield pdfDocument.getPage(pageNumber);
                // Get the available width of the container (e.g., the window width or parent div width)
                const availableWidth = window.innerWidth; // or another reference to the width
                // Calculate the scale based on the available width and page width
                const scale = availableWidth / page.getViewport({ scale: 1 }).width;
                // Get the viewport using the calculated scale
                const viewport = page.getViewport({ scale });
                const canvasContext = canvasRef.current.getContext('2d');
                console.log("viewport width: ", viewport.width, " viewport height: ", viewport.height);
                onPageHeight(pageNumber, viewport.height); // Report the actual page height
                if (canvasContext) {
                    canvasRef.current.width = viewport.width;
                    canvasRef.current.height = viewport.height;
                    renderTaskRef.current = page.render({ canvasContext, viewport });
                    try {
                        yield renderTaskRef.current.promise;
                    }
                    catch (error) {
                        if (error.name === 'RenderingCancelledException') {
                            console.log(`Rendering cancelled for page ${pageNumber}`);
                        }
                        else {
                            console.error('Error rendering page:', error);
                        }
                    }
                }
            }
        });
        renderPage();
        return () => {
            mounted = false;
            if (renderTaskRef.current) {
                console.log("Cancelling render");
                renderTaskRef.current.cancel();
            }
        };
    }, [pageNumber, pdfDocument, isVisible, onPageHeight]);
    return react_1.default.createElement("div", { style: { height: isVisible ? 'auto' : '0', overflow: 'hidden' } },
        react_1.default.createElement("canvas", { ref: canvasRef }));
};
exports.default = react_1.default.memo(PDFPage);
//# sourceMappingURL=PDFPageComponent.js.map