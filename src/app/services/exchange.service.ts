import { Injectable } from "@angular/core";
import { from } from "rxjs";
import { filter, map, mapTo, mergeMap, shareReplay, take, tap } from "rxjs/operators";
import { CryptoService } from "./crypto.service";
import { SocketService } from "./socket.service";

@Injectable({ providedIn: "root" })
export class ExchangeService {

    constructor(
        private socketService: SocketService,
        private crypto: CryptoService
    ) { }

    public startKeyExchange(expectedPassword: string) {

        const passwordHash = expectedPassword || "unset";

        const exportType = "jwk";
        const algo = {
            name: "ECDH",
            namedCurve: "P-256",
        };

        const derivedTarget = {
            name: "AES-CBC",
            length: 256,
        } as AesKeyGenParams;

        const sendPublicKey = (publicKey: CryptoKey) =>
            from(window.crypto.subtle.exportKey(exportType, publicKey)).pipe(
                tap(exportedKey =>
                    this.socketService.send({
                        key: "public_key", data: {
                            key: exportedKey,
                            password: passwordHash,
                        }
                    }) // Send our key
                )
            );

        const waitPublicKey = () =>
            this.socketService.receive().pipe(
                filter(evt => evt.key === "public_key"),
                map(evt => evt.data),
                filter(data => data && data.key && data.password),
                filter(data => data.password === passwordHash),
                take(1),
                mergeMap((evt) => window.crypto.subtle.importKey(exportType, evt.key, algo, false, [])),
            );

        from(window.crypto.subtle.generateKey(algo, false, ["deriveKey"])).pipe(
            tap(pair => console.log("Generated Key", pair)),
            mergeMap(pair => sendPublicKey(pair.publicKey).pipe(mapTo(pair))),
            mergeMap(pair => waitPublicKey().pipe(
                map(receivedKey => ({ pair, receivedKey })),
            )),
            mergeMap((keys) => sendPublicKey(keys.pair.publicKey).pipe(
                mapTo(keys)
            )),
            mergeMap(({ pair, receivedKey }) => from(window.crypto.subtle.deriveKey({
                name: "ECDH",
                public: receivedKey, // Received from other entity
            } as EcdhKeyDeriveParams, pair.privateKey, derivedTarget, false, ["encrypt", "decrypt"]))),
            shareReplay(1)
        ).subscribe(key => this.crypto.key.next(key));

    }

}
