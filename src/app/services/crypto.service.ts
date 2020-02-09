import { Injectable } from "@angular/core";
import { Observable, ReplaySubject } from "rxjs";
import { map, mergeMap } from "rxjs/operators";

@Injectable({
    providedIn: "root"
})
export class CryptoService {

    public key = new ReplaySubject<CryptoKey>(1);

    public encrypt(data: any): Observable<string> {

        const iv = this.get16BytesRandom();
        const ivBase64 = this.arrayBufferToBase64(iv);

        return this.key.pipe(
            map(key => ({ key, buffer: this.str2ab(JSON.stringify(data)) })),
            mergeMap(({ key, buffer }) => window.crypto.subtle.encrypt({
                name: "AES-CBC",
                iv
            } as AesCbcParams, key, buffer)),
            map(encrypted => this.arrayBufferToBase64(encrypted)),
            map(base64 => `${base64}.${ivBase64}`)
        );

    }

    public decrypt<T>(data: string): Observable<T> {

        const [base64, ivBase64] = data.split(".");

        return this.key.pipe(
            map(key => ({ key, buffer: this.base64ToArrayBuffer(base64) })),
            mergeMap(({ key, buffer }) => window.crypto.subtle.decrypt({
                name: "AES-CBC",
                iv: this.base64ToArrayBuffer(ivBase64)
            } as AesCbcParams, key, buffer)),
            map(decrypted => this.ab2str(decrypted)),
            map(json => JSON.parse(json) as T)
        );
    }

    private ab2str(buf: ArrayBuffer): string {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }

    private str2ab(str: string): ArrayBuffer {
        const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
        const bufView = new Uint16Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const bin = window.atob(base64);
        const len = bin.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = bin.charCodeAt(i);
        }
        return bytes;
    }

    private get16BytesRandom() {
        const arr = new Uint8Array(16);
        crypto.getRandomValues(arr);
        return arr;
    }

}
