-- RideNexa Master Database Schema

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(24) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(24) NOT NULL,
    city VARCHAR(120) NOT NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rental_owner_applications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    business_name VARCHAR(160) NOT NULL,
    business_phone VARCHAR(24) NOT NULL,
    gst_number VARCHAR(40) NULL,
    address_line VARCHAR(500) NOT NULL,
    service_radius_km INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    review_note VARCHAR(500) NULL,
    reviewed_by VARCHAR(36) NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner_application_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_owner_application_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_owner_application_status (status)
);

CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    vehicle_type VARCHAR(40) NOT NULL,
    make VARCHAR(80) NOT NULL,
    model VARCHAR(100) NOT NULL,
    registration_number VARCHAR(30) NOT NULL UNIQUE,
    transmission VARCHAR(20) NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    seats INT NOT NULL,
    daily_rate DECIMAL(12,2) NOT NULL,
    hourly_rate DECIMAL(12,2) NOT NULL,
    security_deposit DECIMAL(12,2) NOT NULL DEFAULT 0,
    city VARCHAR(120) NOT NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    image_url VARCHAR(1000) NULL,
    description VARCHAR(1000) NULL,
    delivery_supported BOOLEAN NOT NULL DEFAULT FALSE,
    driver_supported BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    rating DECIMAL(3,2) NOT NULL DEFAULT 0,
    review_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    INDEX idx_vehicles_discovery (city, vehicle_type, status),
    INDEX idx_vehicles_owner (owner_id)
);

CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(36) PRIMARY KEY,
    vehicle_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    delivery_method VARCHAR(30) NOT NULL,
    return_method VARCHAR(30) NOT NULL,
    rental_mode VARCHAR(30) NOT NULL,
    delivery_address VARCHAR(500) NOT NULL,
    pickup_address VARCHAR(500) NULL,
    destination_address VARCHAR(500) NULL,
    driver_required BOOLEAN NOT NULL DEFAULT FALSE,
    quoted_total DECIMAL(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    owner_note VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    INDEX idx_booking_vehicle_period (vehicle_id, start_at, end_at),
    INDEX idx_booking_customer (customer_id)
);

CREATE TABLE IF NOT EXISTS booking_messages (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NULL,
    sender_role VARCHAR(24) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_message_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_message_sender FOREIGN KEY (sender_id) REFERENCES users(id),
    INDEX idx_booking_messages_booking_created (booking_id, created_at)
);

CREATE TABLE IF NOT EXISTS vehicle_interactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interaction_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_interaction_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    INDEX idx_interactions_user_event (user_id, event_type)
);

CREATE TABLE IF NOT EXISTS delivery_tasks (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    task_type VARCHAR(30) NOT NULL,
    assigned_to VARCHAR(36) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
    handover_otp VARCHAR(10) NULL,
    licence_verified BOOLEAN NOT NULL DEFAULT FALSE,
    licence_number VARCHAR(50) NULL,
    odometer_reading INT NULL,
    fuel_percent INT NULL,
    inspection_notes VARCHAR(1000) NULL,
    customer_ready_time DATETIME NULL,
    staff_arrival_time DATETIME NULL,
    completed_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_delivery_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_assigned FOREIGN KEY (assigned_to) REFERENCES users(id),
    INDEX idx_delivery_booking (booking_id),
    INDEX idx_delivery_staff (assigned_to, status)
);

CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    base_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    late_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    fuel_charge DECIMAL(12,2) NOT NULL DEFAULT 0,
    deposit_deducted DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    paid_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    INDEX idx_invoice_booking (booking_id)
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NULL,
    booking_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
    gateway_order_id VARCHAR(100) NULL,
    gateway_payment_id VARCHAR(100) NULL,
    gateway_signature VARCHAR(200) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    INDEX idx_payment_booking (booking_id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL UNIQUE,
    vehicle_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL,
    comment VARCHAR(1000) NOT NULL,
    owner_reply VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_review_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    INDEX idx_review_vehicle (vehicle_id)
);

CREATE TABLE IF NOT EXISTS driver_trips (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
    start_odometer INT NULL,
    end_odometer INT NULL,
    notes VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_driver_trip_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_driver_trip_driver FOREIGN KEY (driver_id) REFERENCES users(id),
    INDEX idx_driver_trip (driver_id, status)
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_notification_user (user_id, is_read)
);
