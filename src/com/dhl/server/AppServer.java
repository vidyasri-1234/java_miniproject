package com.dhl.server;

import com.dhl.dao.ParcelDAO;
import com.dhl.model.Parcel;
import com.dhl.model.TrackingHistory;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;

public class AppServer {

    private static final int PORT = 8080;
    private static final ParcelDAO parcelDAO = new ParcelDAO();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // API Endpoint fir Tracking ID Sich
        server.createContext("/api/track", new TrackHandler());

        // Static Web Files (HTML, CSS, JS)
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null);
        System.out.println("==================================================");
        System.out.println("DHL Parcel Tracking Server leeft!");
        System.out.println("Öffentlech Adress am Browser: http://localhost:" + PORT);
        System.out.println("==================================================");
        server.start();
    }

    // Handler fir /api/track?id=DHL999
    static class TrackHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // CORS Headeren
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            URI requestURI = exchange.getRequestURI();
            String query = requestURI.getQuery();
            String trackingId = null;

            if (query != null && query.contains("id=")) {
                for (String param : query.split("&")) {
                    String[] pair = param.split("=");
                    if (pair.length == 2 && pair[0].equals("id")) {
                        trackingId = pair[1].trim();
                        break;
                    }
                }
            }

            if (trackingId == null || trackingId.isEmpty()) {
                String errorJson = "{\"error\": \"Keng Tracking ID uginn.\"}";
                sendResponse(exchange, 400, errorJson);
                return;
            }

            Parcel parcel = parcelDAO.getParcelByTrackingId(trackingId);

            if (parcel == null) {
                String notFoundJson = "{\"found\": false, \"trackingId\": \"" + escapeJson(trackingId) + "\"}";
                sendResponse(exchange, 404, notFoundJson);
            } else {
                StringBuilder json = new StringBuilder();
                json.append("{");
                json.append("\"found\": true,");
                json.append("\"trackingId\": \"").append(escapeJson(parcel.getTrackingId())).append("\",");
                json.append("\"senderName\": \"").append(escapeJson(parcel.getSenderName())).append("\",");
                json.append("\"receiverName\": \"").append(escapeJson(parcel.getReceiverName())).append("\",");
                json.append("\"origin\": \"").append(escapeJson(parcel.getOrigin())).append("\",");
                json.append("\"destination\": \"").append(escapeJson(parcel.getDestination())).append("\",");
                json.append("\"weightKg\": ").append(parcel.getWeightKg()).append(",");
                json.append("\"currentStatus\": \"").append(escapeJson(parcel.getCurrentStatus())).append("\",");
                json.append("\"currentLocation\": \"").append(escapeJson(parcel.getCurrentLocation())).append("\",");
                json.append("\"expectedDeliveryDate\": \"").append(parcel.getExpectedDeliveryDate() != null ? parcel.getExpectedDeliveryDate().toString() : "").append("\",");
                
                // History Timeline
                json.append("\"history\": [");
                List<TrackingHistory> historyList = parcel.getHistoryList();
                for (int i = 0; i < historyList.size(); i++) {
                    TrackingHistory h = historyList.get(i);
                    json.append("{");
                    json.append("\"status\": \"").append(escapeJson(h.getStatus())).append("\",");
                    json.append("\"location\": \"").append(escapeJson(h.getLocation())).append("\",");
                    json.append("\"remarks\": \"").append(escapeJson(h.getRemarks())).append("\",");
                    json.append("\"updatedAt\": \"").append(h.getUpdatedAt() != null ? h.getUpdatedAt().toString() : "").append("\"");
                    json.append("}");
                    if (i < historyList.size() - 1) json.append(",");
                }
                json.append("]");
                json.append("}");

                sendResponse(exchange, 200, json.toString());
            }
        }

        private void sendResponse(HttpExchange exchange, int statusCode, String responseText) throws IOException {
            byte[] bytes = responseText.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(statusCode, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        private String escapeJson(String value) {
            if (value == null) return "";
            return value.replace("\\", "\\\\").replace("\"", "\\\"");
        }
    }

    // Handler fir statesch Fichieren (HTML, CSS, JS)
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) {
                path = "/index.html";
            }

            File file = new File("." + path);
            if (!file.exists() || file.isDirectory()) {
                String notFound = "404 Not Found";
                exchange.sendResponseHeaders(404, notFound.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(notFound.getBytes());
                }
                return;
            }

            String contentType = "text/plain";
            if (path.endsWith(".html")) contentType = "text/html";
            else if (path.endsWith(".css")) contentType = "text/css";
            else if (path.endsWith(".js")) contentType = "application/javascript";
            else if (path.endsWith(".json")) contentType = "application/json";

            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.sendResponseHeaders(200, file.length());

            try (OutputStream os = exchange.getResponseBody()) {
                Files.copy(file.toPath(), os);
            }
        }
    }
}