import { Component } from "@angular/core";
import { ChatService } from "./services/chat.service";
import { ExchangeService } from "./services/exchange.service";
import { SocketService } from "./services/socket.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"]
})
export class AppComponent {
    title = "diffie-chat";

    constructor(
        private chat: ChatService,
        private socket: SocketService,
        private exchange: ExchangeService,
    ) {

        const password = "no password";

        this.socket.receive().subscribe(e => console.log(e));
        this.exchange.startKeyExchange(password);
        chat.sendMessage("Hello World!");
    }

}
