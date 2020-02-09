import { Injectable } from "@angular/core";
import { ReplaySubject } from "rxjs";
import { tap } from "rxjs/operators";
import { SocketService } from "./socket.service";

interface ChatMessage {
    content: string;
    timestamp: number;
}

@Injectable({ providedIn: "root" })
export class ChatService {

    private messages = new ReplaySubject<ChatMessage>(100, 100);

    constructor(
        private socketService: SocketService
    ) {
        this.messages.pipe(
            tap((data) => this.socketService.sendEncrypted({ key: "message", data })),
        ).subscribe();
    }

    public getMessages() {
        return this.messages.asObservable();
    }

    public sendMessage(content: string) {
        this.messages.next({
            content,
            timestamp: +new Date()
        });
    }

}
