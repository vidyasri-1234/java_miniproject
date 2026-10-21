package com.dhl.model;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class Parcel {
    private String trackingId;
    private String senderName;
    private String receiverName;
    private String origin;
    private String destination;
    private double weightKg;
    private String currentStatus;
    private String currentLocation;
    private Date expectedDeliveryDate;
    private Timestamp createdAt;

    // Associated milestone scan timeline
    private List<TrackingHistory> historyList = new ArrayList<>();

    public Parcel() {}

    public Parcel(String trackingId, String senderName, String receiverName, String origin,
                  String destination, double weightKg, String currentStatus, 
                  String currentLocation, Date expectedDeliveryDate) {
        this.trackingId = trackingId;
        this.senderName = senderName;
        this.receiverName = receiverName;
        this.origin = origin;
        this.destination = destination;
        this.weightKg = weightKg;
        this.currentStatus = currentStatus;
        this.currentLocation = currentLocation;
        this.expectedDeliveryDate = expectedDeliveryDate;
    }

    public String getTrackingId() { return trackingId; }
    public void setTrackingId(String trackingId) { this.trackingId = trackingId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public double getWeightKg() { return weightKg; }
    public void setWeightKg(double weightKg) { this.weightKg = weightKg; }

    public String getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(String currentStatus) { this.currentStatus = currentStatus; }

    public String getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(String currentLocation) { this.currentLocation = currentLocation; }

    public Date getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(Date expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public List<TrackingHistory> getHistoryList() { return historyList; }
    public void setHistoryList(List<TrackingHistory> historyList) { this.historyList = historyList; }
}