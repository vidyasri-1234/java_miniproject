package com.dhl.model;

import java.sql.Timestamp;

public class TrackingHistory {
    private int historyId;
    private String trackingId;
    private String status;
    private String location;
    private String remarks;
    private Timestamp updatedAt;

    public TrackingHistory() {}

    public TrackingHistory(int historyId, String trackingId, String status, String location, String remarks, Timestamp updatedAt) {
        this.historyId = historyId;
        this.trackingId = trackingId;
        this.status = status;
        this.location = location;
        this.remarks = remarks;
        this.updatedAt = updatedAt;
    }

    public TrackingHistory(String trackingId, String status, String location, String remarks) {
        this.trackingId = trackingId;
        this.status = status;
        this.location = location;
        this.remarks = remarks;
    }

    public int getHistoryId() { return historyId; }
    public void setHistoryId(int historyId) { this.historyId = historyId; }

    public String getTrackingId() { return trackingId; }
    public void setTrackingId(String trackingId) { this.trackingId = trackingId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }
}