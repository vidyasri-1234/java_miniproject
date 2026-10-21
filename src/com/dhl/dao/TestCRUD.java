package com.dhl.dao;

import com.dhl.model.Parcel;
import com.dhl.model.TrackingHistory;

import java.sql.Date;
import java.time.LocalDate;

public class TestCRUD {
    public static void main(String[] args) {
        ParcelDAO dao = new ParcelDAO();
        String testId = "DHL999";

        System.out.println("=== 1. TESTING CREATE (addParcel) ===");
        Parcel newParcel = new Parcel(
                testId,
                "Sonali Sharma",
                "Samriddhi Roy",
                "Bangalore Depot",
                "Delhi Sort Hub",
                2.75,
                "Booked",
                "Bangalore Depot",
                Date.valueOf(LocalDate.now().plusDays(3))
        );

        // Delete test parcel first in case it remained from a previous run
        dao.deleteParcel(testId);

        boolean created = dao.addParcel(newParcel);
        System.out.println("Parcel created: " + created);

        System.out.println("\n=== 2. TESTING READ (getParcelByTrackingId) ===");
        Parcel fetched = dao.getParcelByTrackingId(testId);
        if (fetched != null) {
            System.out.println("Found Parcel: " + fetched.getTrackingId());
            System.out.println("From: " + fetched.getSenderName() + " -> To: " + fetched.getReceiverName());
            System.out.println("Current Status: " + fetched.getCurrentStatus());
            System.out.println("Timeline Events: " + fetched.getHistoryList().size());
        }

        System.out.println("\n=== 3. TESTING UPDATE (updateParcelStatus) ===");
        boolean updated = dao.updateParcelStatus(
                testId,
                "In Transit",
                "Hyderabad Linehaul Hub",
                "Package processed via express air transit"
        );
        System.out.println("Status updated: " + updated);

        Parcel updatedParcel = dao.getParcelByTrackingId(testId);
        System.out.println("New Status: " + updatedParcel.getCurrentStatus());
        System.out.println("New Location: " + updatedParcel.getCurrentLocation());
        System.out.println("History log count: " + updatedParcel.getHistoryList().size());

        for (TrackingHistory h : updatedParcel.getHistoryList()) {
            System.out.println("  - [" + h.getStatus() + "] at " + h.getLocation() + " (" + h.getRemarks() + ")");
        }
    }
}