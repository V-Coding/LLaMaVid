import "video.js";

declare module "video.js" {
    interface Marker {
        time: number;
        text?: string;
        duration?: number;
        class?: string;
    }

    interface MarkerOptions {
        markers: Marker[];
    }

    interface Player {
        markers(options: MarkerOptions): void;
    }
}
