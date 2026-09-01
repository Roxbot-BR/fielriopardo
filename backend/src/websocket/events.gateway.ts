import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect, SubscribeMessage, MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/" })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket)    { this.logger.log("Client connected: " + client.id); }
  handleDisconnect(client: Socket)    { this.logger.log("Client disconnected: " + client.id); }

  emitMatchUpdate(matchId: string, data: any)   { this.server.emit("match:score_update", { matchId, ...data }); }
  emitMatchStarted(matchId: string, data: any)  { this.server.emit("match:started", { matchId, ...data }); }
  emitMatchEvent(matchId: string, event: any)   { this.server.emit("match:event", { matchId, event }); }
  emitMatchFinished(matchId: string, data: any) { this.server.emit("match:finished", { matchId, ...data }); }
  emitBolaoClose(matchId: string)               { this.server.emit("bolao:closed", { matchId }); }
  emitBolaoResults(results: any)                { this.server.emit("bolao:results_ready", results); }
  emitRankingUpdate(ranking: any)               { this.server.emit("bolao:ranking_updated", ranking); }

  @SubscribeMessage("join:match")
  handleJoinMatch(client: Socket, @MessageBody() matchId: string) {
    client.join("match:" + matchId);
    return { event: "joined", data: matchId };
  }
}
