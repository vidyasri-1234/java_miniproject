package com.dhl.util;

import java.sql.Connection;

public class TestConnection {
    public static void main(String[] args) {
        System.out.println("Testing connection to Supabase...");
        try (Connection conn = DBConnection.getConnection()) {
            if (conn != null && !conn.isClosed()) {
                System.out.println("SUCCESS: Connected to Supabase PostgreSQL database successfully!");
            }
        } catch (Exception e) {
            System.err.println("CONNECTION FAILED:");
            e.printStackTrace();
        }
    }
}