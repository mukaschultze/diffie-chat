import { Injectable } from "@angular/core";
import { of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { WebSocketSubject, WebSocketSubjectConfig } from "rxjs/webSocket";
import { CryptoService } from "./crypto.service";

export interface SocketMessage {
    key: string;
    data?: any;
    encrypted?: any;
}

@Injectable({ providedIn: "root" })
export class SocketService {

    private socket: WebSocketSubject<SocketMessage>;

    constructor(
        private crypto: CryptoService,
    ) {

        const serializer = (value: SocketMessage) => {
            // console.log("Sent", value);
            return JSON.stringify(value);
        };
        const deserializer = (value: MessageEvent) => {
            try {
                return JSON.parse(value.data);
            } catch {
                console.warn("Failed to parse message as JSON, ignoring", value.data);
                return undefined;
            }
        };

        const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjIxN2MzMTQzODBhMTAyNjY2N2I2MTQwNmEwYzQzMTFmNDIwNWZkZjkwYjMyMGJkMzEzZDRkN2M3MzUxMmUzYmRkZTZjMjBmODhlMzhkMjU3In0.eyJhdWQiOiI4IiwianRpIjoiMjE3YzMxNDM4MGExMDI2NjY3YjYxNDA2YTBjNDMxMWY0MjA1ZmRmOTBiMzIwYmQzMTNkNGQ3YzczNTEyZTNiZGRlNmMyMGY4OGUzOGQyNTciLCJpYXQiOjE1ODEyNTk2MjQsIm5iZiI6MTU4MTI1OTYyNCwiZXhwIjoxNjEyODgyMDI0LCJzdWIiOiI0ODIiLCJzY29wZXMiOltdfQ.SfHw0TfxDVk08uVITLCtBYvmfwTK6PZ3UcwPzmI8t6vq8on-Cd5d7y27thYedbILEKDzCMjeQmYGGrj9SsVhlAHWpGvD8Stu70ufdRioHyfda05UBGsrbXDosb2tvGX4UzKU4z4ndNeMsPCOJnzc6zyBg8gHhXE9elhxZ0r0UICPHSK2o3PCrKfHhaN_hVHSb0P-Mfe-GnK7kJroNhywwRps-ByvGYJhS3It4DH9lN2qWC3E3EEVLf99fwMPsFpaTnGskSGW92VPkSMlouJYStIpiLv04boI-wlSgDZ5UM2O0UqQ__DMiFJFPthwuAzfE_13agF4p5iUrGN06p8Dv_brkbViiOyQ8jSPk9Dz1CG-dYHzqSV_NnvX66ZCGf-3kTKxJjaS4SKVa-vEA7BpkSKEcUMSfKdjy2qzb-6pXC7_hyTp7Ucl8D08EoMefuYj3Gw5MXn5y9-1AtJfODRwngsrHwiDaQYo0bSpxzOO-DS0gLT3ALm8a2lweppfJkfc-Z3ILTVIC4jPmS5jv8VQhCX1QMFRthzpb-_a38S4_a95cbWqXRQmf6e9Vsk8GS22SOZc_SDhsoxcRa2ys5KxW8v8XWyEoTZH5urxRvb15BL4QRCdCsFB3LnpMymWLJRBO0dMSSiUsdwmsgubRiXtbC3RJz8dvCqomiiqXQo-wNE";
        const channel = 1; // Must be between 1-10000 range
        const url = `wss://connect.websocket.in/v2/${channel}?token=${token}`;

        this.socket = new WebSocketSubject({
            url,
            serializer,
            deserializer,
        } as WebSocketSubjectConfig<SocketMessage>);

    }

    public receive() {
        return this.socket.pipe(
            filter(r => !!r && !!r.key),
            mergeMap(r => r.key !== "encrypted" ?
                of(r) :
                this.crypto.decrypt<SocketMessage>(r.data)
            )
        );
    }

    public send(message: SocketMessage) {
        this.socket.next(message);
    }

    public sendEncrypted(message: SocketMessage) {
        this.crypto.encrypt(message).pipe(
            map(e => ({ key: "encrypted", data: e }))
        ).subscribe(m => this.socket.next(m));
    }

}
