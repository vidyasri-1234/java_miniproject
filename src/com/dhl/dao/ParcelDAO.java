package com.dhl.dao;

import com.dhl.model.Parcel;
import com.dhl.model.TrackingHistory;
import com.dhl.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ParcelDAO {

    // 1. Search Parcel by Tracking ID (Customer Lookup)
    public Parcel getParcelByTrackingId(String trackingId) {
        String query = "SELECT * FROM parcels WHERE tracking_id = ?";
        Parcel parcel = null;

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {

            ps.setString(1, trackingId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    parcel = new Parcel();
                    parcel.setTrackingId(rs.getString("tracking_id"));
                    parcel.setSenderName(rs.getString("sender_name"));
                    parcel.setReceiverName(rs.getString("receiver_name"));
                    parcel.setOrigin(rs.getString("origin"));
                    parcel.setDestination(rs.getString("destination"));
                    parcel.setWeightKg(rs.getDouble("weight_kg"));
                    parcel.setCurrentStatus(rs.getString("current_status"));
                    parcel.setCurrentLocation(rs.getString("current_location"));
                    parcel.setExpectedDeliveryDate(rs.getDate("expected_delivery_date"));
                    parcel.setCreatedAt(rs.getTimestamp("created_at"));

                    // Fetch associated tracking timeline
                    parcel.setHistoryList(getTrackingHistory(trackingId));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return parcel;
    }

    // 2. Fetch Milestone History for a Parcel
    public List<TrackingHistory> getTrackingHistory(String trackingId) {
        List<TrackingHistory> historyList = new ArrayList<>();
        String query = "SELECT * FROM tracking_history WHERE tracking_id = ? ORDER BY updated_at DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {

            ps.setString(1, trackingId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    TrackingHistory item = new TrackingHistory(
                            rs.getInt("history_id"),
                            rs.getString("tracking_id"),
                            rs.getString("status"),
                            rs.getString("location"),
                            rs.getString("remarks"),
                            rs.getTimestamp("updated_at")
                    );
                    historyList.add(item);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return historyList;
    }

    // 3. Create New Parcel (Admin Add)
    public boolean addParcel(Parcel parcel) {
        String insertParcelSql = "INSERT INTO parcels (tracking_id, sender_name, receiver_name, origin, destination, weight_kg, current_status, current_location, expected_delivery_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        String insertHistorySql = "INSERT INTO tracking_history (tracking_id, status, location, remarks) VALUES (?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false); // Transaction

            try (PreparedStatement psParcel = conn.prepareStatement(insertParcelSql);
                 PreparedStatement psHistory = conn.prepareStatement(insertHistorySql)) {

                psParcel.setString(1, parcel.getTrackingId());
                psParcel.setString(2, parcel.getSenderName());
                psParcel.setString(3, parcel.getReceiverName());
                psParcel.setString(4, parcel.getOrigin());
                psParcel.setString(5, parcel.getDestination());
                psParcel.setDouble(6, parcel.getWeightKg());
                psParcel.setString(7, parcel.getCurrentStatus());
                psParcel.setString(8, parcel.getCurrentLocation());
                psParcel.setDate(9, parcel.getExpectedDeliveryDate());
                psParcel.executeUpdate();

                // Add initial 'Booked' milestone
                psHistory.setString(1, parcel.getTrackingId());
                psHistory.setString(2, parcel.getCurrentStatus());
                psHistory.setString(3, parcel.getCurrentLocation());
                psHistory.setString(4, "Consignment booked into system.");
                psHistory.executeUpdate();

                conn.commit();
                return true;
            } catch (SQLException ex) {
                conn.rollback();
                ex.printStackTrace();
                return false;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // 4. Update Parcel Status and Location (Admin Status Flow)
    public boolean updateParcelStatus(String trackingId, String newStatus, String newLocation, String remarks) {
        String updateParcelSql = "UPDATE parcels SET current_status = ?, current_location = ? WHERE tracking_id = ?";
        String insertHistorySql = "INSERT INTO tracking_history (tracking_id, status, location, remarks) VALUES (?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);

            try (PreparedStatement psParcel = conn.prepareStatement(updateParcelSql);
                 PreparedStatement psHistory = conn.prepareStatement(insertHistorySql)) {

                // Update master record
                psParcel.setString(1, newStatus);
                psParcel.setString(2, newLocation);
                psParcel.setString(3, trackingId);
                int rowsUpdated = psParcel.executeUpdate();

                if (rowsUpdated == 0) {
                    conn.rollback();
                    return false;
                }

                // Append status change to tracking history
                psHistory.setString(1, trackingId);
                psHistory.setString(2, newStatus);
                psHistory.setString(3, newLocation);
                psHistory.setString(4, remarks);
                psHistory.executeUpdate();

                conn.commit();
                return true;
            } catch (SQLException ex) {
                conn.rollback();
                ex.printStackTrace();
                return false;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // 5. Delete Parcel (Admin Delete)
    public boolean deleteParcel(String trackingId) {
        String sql = "DELETE FROM parcels WHERE tracking_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, trackingId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}