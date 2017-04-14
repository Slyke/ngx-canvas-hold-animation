import { Component, OnInit, Input, Output, ViewChild, ElementRef, EventEmitter, OnDestroy, ViewEncapsulation } from "@angular/core";

import { JSUIEngine } from "js-ui-engine-ngx-wrapper";

const MathTAU = (Math.PI * 2);

@Component({
    selector: 'hold-animation',
    templateUrl: './hold-animation.view.html',
    styleUrls: ['./hold-animation.style.css'],
    encapsulation: ViewEncapsulation.None
})

export class HoldAnimationComponent implements OnInit, OnDestroy {

    @Input() drawScale: number = 1; // Global size manipulation
    @Input() circleX: number = 0.50; // Position X of the middle of the circles
    @Input() circleY: number = 0.50; // Position Y of the middle of the circles

    @Input() innerRadiusProgress: number = 0.40; // Radius of progress circles
    @Input() progressBarWidth: number = 0.08; // Line width of progress bar.
    @Input() arcAngleOffset: number = 0.75; // By default, the arc drawing starts at 90 degrees clockwise from the top.

    @Input() innerRadiusUnfilled: number = 0.40; // Radius of progress circles
    @Input() unfilledBarWidth: number = 0.06; // Line width of unfilled progress bar.
    @Input() unfilledBarColor: string = "#667074" // Unfilled bar color

    @Input() outerRadius: number = 0.47; // Radius of background circle
    @Input() outerRadiusLineWidth: number = 0.01; // Background circle border width
    @Input() backgroundFill: string = "rgba(0, 0, 0, 0.8)"; // Background circle fill style
    @Input() backgroundBorderColor: string = "#000000"; // Background circle fill style

    @Input() holdText: string = "HOLD"; // Text to appear in the middle
    @Input() holdTextColor: string = "#FFFF00"; // Color of text to appear in the middle
    @Input() fontSize: number = 0.21; // Font size
    @Input() fontStyle: string = "helvetica-neue"; // Font style

    @Input() fillRate: number = 0.75; // Fill speed

    @Input() showAfterFinish = true; // Should the hold-animation remain visible after filling?

    @Output() animationFinished: EventEmitter<number> = new EventEmitter<number>();

    private currentProgress: number = 0;

    private directionForward: boolean = false;
    private lastAnimationTime: number = -1;

    private jsuiEngine: JSUIEngine;
    private ctx: any;
    private screenObjects: any = {};

    public finishedFilled = false;
    public firstTimeLoaded = true;
    public stopAnimationRunning: boolean = false;

    private canvasSize: Array<number> = [-1, -1];

    private pixelRenderOffsetFix: number = 0.01; // This is a fix to stop a small rendering gap at 100% of currentProgress

    @ViewChild("holdAnimationCanvas") holdAnimationCanvas: ElementRef;
    @ViewChild('animationContainer') animationContainer:ElementRef;

    constructor() {
        this.jsuiEngine = new JSUIEngine();
    }

    animateCommand(direction: string) {
        this.firstTimeLoaded = false;
        this.lastAnimationTime = new Date().getTime();
        
        if (!this.showAnimation()) {
            let smallestDimension = Math.min(this.animationContainer.nativeElement.clientHeight, this.animationContainer.nativeElement.clientWidth);
            this.holdAnimationCanvas.nativeElement.width = smallestDimension;
            this.holdAnimationCanvas.nativeElement.height = smallestDimension;

            this.canvasSize = [this.holdAnimationCanvas.nativeElement.width, this.holdAnimationCanvas.nativeElement.height];

            if (this.ctx) {
                let minSize = (this.canvasSize[0] < this.canvasSize[1] ? 0 : 1);
                this.ctx.font = (this.relToAbs(this.fontSize, minSize) * this.drawScale) + 'px ' + this.fontStyle;
                this.setupObjects();
                this.createObjects();
            }
        }

        if (direction === 'forward') {
            this.fillProgress();
        } else if (direction === 'backward') {
            this.unfillProgress();
        } else {
            this.stopAnimationRunning = true;
            // Emit finished: Halt (0)
            this.animationFinished.emit(0);
        }
    }

    ngOnDestroy() {
        delete this.jsuiEngine;
    }

    ngOnInit() {
        let smallestDimension = Math.min(this.animationContainer.nativeElement.clientHeight, this.animationContainer.nativeElement.clientWidth);
        this.holdAnimationCanvas.nativeElement.width = smallestDimension;
        this.holdAnimationCanvas.nativeElement.height = smallestDimension;

        this.canvasSize = [this.holdAnimationCanvas.nativeElement.width, this.holdAnimationCanvas.nativeElement.height];
        this.setupObjects();
        this.createObjects();
    }

    ngAfterViewInit() {
        this.ctx = this.jsuiEngine.setupCanvas(this.holdAnimationCanvas.nativeElement); //Setup the canvas for drawing.
        
        let minSize = (this.canvasSize[0] < this.canvasSize[1] ? 0 : 1);
        this.ctx.font = (this.relToAbs(this.fontSize, minSize) * this.drawScale) + 'px ' + this.fontStyle;
        this.jsuiEngine.refreshScreen();
        this.lastAnimationTime = new Date().getTime();
    }

    resetState() {
        this.currentProgress = 0;
        this.finishedFilled = false;
    }

    setupObjects() {

        this.screenObjects = {};

        this.screenObjects.backgroundCircle = {
            'x': this.relToAbs(this.circleX, 0),
            'y': this.relToAbs(this.circleY, 1),
            'r': this.relToAbs(this.outerRadius, 0) * this.drawScale,
            'f': 1 * MathTAU,
            'shape':'arc', // This lets the click and mouse move handler know what type of object it is.
            'renderType': () => { this.jsuiEngine.canvasContext.fill(); this.jsuiEngine.canvasContext.stroke(); }, // fill() is to fill the inside and stroke() is for the border.
            'render': (self) => {
                this.jsuiEngine.drawArc(self.x, self.y, self.r, null, self.f, self.renderType, this.jsuiEngine.canvasContext, {'fillStyle': this.backgroundFill, 'strokeStyle': this.backgroundBorderColor, 'lineWidth': this.relToAbs(this.outerRadiusLineWidth, 0) * this.drawScale});
            },
            'visible':true
        };

        this.screenObjects.unfilledBackground = {
            'x': this.relToAbs(this.circleX, 0),
            'y': this.relToAbs(this.circleY, 1),
            'r': this.relToAbs(this.innerRadiusUnfilled, 0) * this.drawScale,
            'f': 1 * MathTAU,
            'shape': 'arc', // This lets the click and mouse move handler know what type of object it is.
            'render': (self) => {
                this.jsuiEngine.drawArc(self.x, self.y, self.r, null, self.f, null, this.jsuiEngine.canvasContext, {'strokeStyle': this.unfilledBarColor, 'lineWidth': this.relToAbs(this.unfilledBarWidth, 0) * this.drawScale});
            },
            'visible':true
        };

        this.screenObjects.progressBarCircle = {
            'x': this.relToAbs(this.circleX, 0),
            'y': this.relToAbs(this.circleY, 1),
            'r': this.relToAbs(this.innerRadiusProgress, 0) * this.drawScale,
            's': (this.arcAngleOffset * MathTAU),
            'f': (this.arcAngleOffset * MathTAU),
            'shape': 'arc', // This lets the click and mouse move handler know what type of object it is.
            'render': (self) => {
                // Dynamic progress bar color
                let barColorRed: number = 255; // FF
                let barColorGreen: number = 18; // 12
                let barColorBlue: number = 14; // 0D
                let barColorEnd = "#FFFFFF"; // Default, is ignored anyway.

                // Color manipulation logic
                barColorRed = (255 - (barColorRed * this.currentProgress));
                barColorGreen = (255 * this.currentProgress);

                // Ensure sanity
                barColorRed = Math.min(Math.max(barColorRed, 0), 255);
                barColorGreen = Math.min(Math.max(barColorGreen, 0), 255);
                barColorBlue = Math.min(Math.max(barColorBlue, 0), 255);

                barColorEnd = "#" + this.toHex(Math.round(barColorRed)) + this.toHex(Math.round(barColorGreen)) + this.toHex(Math.round(barColorBlue));

                this.jsuiEngine.drawArc(self.x, self.y, self.r, self.s, self.f, null, this.jsuiEngine.canvasContext, {'strokeStyle': barColorEnd, 'lineWidth': this.relToAbs(this.progressBarWidth, 0) * this.drawScale});
            },
            'visible':true
        };

        this.screenObjects.txtHold = {
            'x': this.relToAbs(this.circleX, 0),
            'y': this.relToAbs(this.circleY, 1),
            'text': this.holdText,
            'shape': 'text', // This lets the click and mouse move handler know what type of object it is.
            'render': (self) => {
                let minSize = (this.canvasSize[0] < this.canvasSize[1] ? 0 : 1);
                let textMid: Array<number> = [(this.ctx.measureText(self.text).width / 2), ((this.relToAbs(this.fontSize, minSize) * this.drawScale) / 2)];
                this.jsuiEngine.drawText(self.x - textMid[0], self.y- textMid[1], self.text, self, null, this.jsuiEngine.canvasContext, {'fillStyle': this.holdTextColor});
            },
            'visible':true
        };
    }

    createObjects() {
        this.jsuiEngine.canvasObjects = [];
        this.jsuiEngine.canvasObjects.push(this.screenObjects.backgroundCircle);
        this.jsuiEngine.canvasObjects.push(this.screenObjects.unfilledBackground);
        this.jsuiEngine.canvasObjects.push(this.screenObjects.progressBarCircle);
        this.jsuiEngine.canvasObjects.push(this.screenObjects.txtHold);
    }

    updateCircleProgress = function() {

        let currentTime: number = new Date().getTime();
        let timeDiff: number = (currentTime - this.lastAnimationTime);
        let fillRatePixels: number = ((timeDiff / 1000) * this.fillRate);

        if(this.screenObjects.length === 0) {
            return false;
        }

        try {
            if (this.currentProgress > 0.33) {
                this.screenObjects.progressBarCircle.f = (this.currentProgress + this.arcAngleOffset + this.pixelRenderOffsetFix) * MathTAU;
            } else {
                this.screenObjects.progressBarCircle.f = (this.currentProgress + this.arcAngleOffset) * MathTAU;
            }
        } catch(err) {
            console.error('[HoldAnimationComponent::updateCircleProgress()]: Could not update progress bar: ', err);
            // We'll want to stop it trying to draw the bar if this happens.
            this.stopAnimationRunning = true;
            // Emit finished: Error (-1)
            this.animationFinished.emit(-1);
            return ;
        }

        if (this.stopAnimationRunning) {
            return true;
        }

        if (this.directionForward) {
            this.currentProgress += fillRatePixels;
            if (this.currentProgress <= 1.0001) {
                if (!this.stopAnimationRunning) {
                    requestAnimationFrame(() => { this.updateCircleProgress(); });
                }
            } else {
                this.stopAnimationRunning = true;
                 this.finishedFilled = true
                 this.currentProgress = 1;
                // Emit finished: Filled
                this.animationFinished.emit(1);
            }
        } else {
            this.currentProgress -= fillRatePixels;
            if (this.currentProgress >= 0.0001) {
                if (!this.stopAnimationRunning) {
                    requestAnimationFrame(() => { this.updateCircleProgress(); });
                }
            } else {
                this.currentProgress = 0;
                this.stopAnimationRunning = true;

                if (this.finishedFilled) {
                    this.finishedFilled = false;
                }

                this.screenObjects.progressBarCircle.f = ((this.currentProgress + this.arcAngleOffset)) * MathTAU;

                // Emit finished: Emptied
                this.animationFinished.emit(2);
                
            }
        }

        this.lastAnimationTime = currentTime;

        if (this.jsuiEngine) {
            this.jsuiEngine.refreshScreen();
        }

    };

    fillProgress() {
        this.stopAnimationRunning = false;
        this.directionForward = true;
        this.updateCircleProgress();
    };

    unfillProgress() {
        this.stopAnimationRunning = false;
        this.directionForward = false;
        this.updateCircleProgress();
    };

    showAnimation(): boolean {
        if (this.firstTimeLoaded) {
            return false;
        }
        if (this.stopAnimationRunning) {
            if (this.showAfterFinish && this.finishedFilled) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    private toHex(dec) {
        return  ("0" + (Number(dec).toString(16))).slice(-2).toUpperCase()
    }

    private relToAbs(relCoord: number, dimension: number) {
        return (relCoord * this.canvasSize[dimension]);
    }

}
