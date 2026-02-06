-- Enable UUID generation support for SQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------
-- 1. UPDATE RESTAURANT RATING AUTOMATICALLY
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION update_restaurant_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "Restaurant"
    SET "Rating" = (
        SELECT ROUND(AVG("RatingRestaurant"), 1)
        FROM "Review"
        WHERE "RestaurantID" = NEW."RestaurantID"
    )
    WHERE "RestaurantID" = NEW."RestaurantID";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE ON "Review"
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_rating();

-- ---------------------------------------------------------
-- 2. WALLET DEDUCTION BEFORE PAYMENT
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION process_wallet_payment()
RETURNS TRIGGER AS $$
DECLARE
    user_balance DECIMAL(10,2);
BEGIN
    IF NEW."PaymentMethod" = 'Wallet' AND NEW."PaymentStatus" = 'Success' THEN
        -- Check Balance
        SELECT "WalletBalance" INTO user_balance
        FROM "User"
        WHERE "UserID" = NEW."UserID";

        IF user_balance < NEW."TotalAmount" THEN
            RAISE EXCEPTION 'Insufficient wallet balance';
        END IF;

        -- Deduct Balance
        UPDATE "User"
        SET "WalletBalance" = "WalletBalance" - NEW."TotalAmount"
        WHERE "UserID" = NEW."UserID";
        
        -- Log Transaction
        INSERT INTO "WalletTransaction" ("TransactionID", "UserID", "TransactionType", "Amount", "Description")
        VALUES (gen_random_uuid(), NEW."UserID", 'Debit', NEW."TotalAmount", 'Payment for Order ' || NEW."PaymentID");
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_wallet
BEFORE INSERT ON "Payment"
FOR EACH ROW
EXECUTE FUNCTION process_wallet_payment();

-- ---------------------------------------------------------
-- 3. DRIVER AVAILABILITY TOGGLE
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION manage_driver_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Driver Assigned -> Busy
    IF NEW."DeliveryPartnerID" IS NOT NULL AND NEW."OrderStatus" NOT IN ('Delivered', 'Cancelled') THEN
        UPDATE "DeliveryPartner"
        SET "IsAvailable" = FALSE
        WHERE "DeliveryPartnerID" = NEW."DeliveryPartnerID";
    END IF;

    -- Order Done -> Free
    IF NEW."OrderStatus" IN ('Delivered', 'Cancelled') AND OLD."OrderStatus" NOT IN ('Delivered', 'Cancelled') THEN
        UPDATE "DeliveryPartner"
        SET "IsAvailable" = TRUE
        WHERE "DeliveryPartnerID" = NEW."DeliveryPartnerID";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_driver_availability
AFTER INSERT OR UPDATE ON "Orders"
FOR EACH ROW
EXECUTE FUNCTION manage_driver_availability();

-- ---------------------------------------------------------
-- 4. AUTO INVOICE GENERATION
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_generate_invoice()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."OrderStatus" = 'Delivered' AND OLD."OrderStatus" != 'Delivered' THEN
        INSERT INTO "Invoice" ("InvoiceID", "OrderID", "InvoiceDate", "PDFUrl")
        VALUES (
            gen_random_uuid(),
            NEW."OrderID",
            NOW(),
            'https://api.zomato.com/invoices/' || NEW."OrderID" || '.pdf'
        )
        ON CONFLICT ("OrderID") DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_invoice
AFTER UPDATE ON "Orders"
FOR EACH ROW
EXECUTE FUNCTION auto_generate_invoice();

-- ---------------------------------------------------------
-- 5. DISTRIBUTE PAYOUTS (Commission, Restaurant, Driver)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION distribute_payouts()
RETURNS TRIGGER AS $$
DECLARE
    owner_user_id TEXT;
    driver_user_id TEXT;
    admin_user_id TEXT;
    pay_method "payment_method_enum";
    amount_to_adjust DECIMAL(10,2);
    platform_commission DECIMAL(10,2);
BEGIN
    IF NEW."OrderStatus" = 'Delivered' AND OLD."OrderStatus" != 'Delivered' THEN
        
        -- 1. CALCULATE COMMISSION & CREDIT ADMIN
        platform_commission := NEW."TotalAmount" - (NEW."RestaurantEarning" + NEW."DeliveryPartnerEarning");
        
        SELECT "UserID" INTO admin_user_id FROM "User" WHERE "Role" = 'SuperAdmin' LIMIT 1;
        
        IF admin_user_id IS NOT NULL THEN
            UPDATE "User" SET "WalletBalance" = "WalletBalance" + platform_commission WHERE "UserID" = admin_user_id;
            INSERT INTO "WalletTransaction" ("TransactionID", "UserID", "TransactionType", "Amount", "Description")
            VALUES (gen_random_uuid(), admin_user_id, 'Credit', platform_commission, 'Commission Order #' || NEW."OrderID");
        END IF;

        -- 2. CREDIT RESTAURANT
        SELECT ro."UserID" INTO owner_user_id
        FROM "Restaurant" r JOIN "RestaurantOwner" ro ON r."OwnerID" = ro."OwnerID"
        WHERE r."RestaurantID" = NEW."RestaurantID";

        UPDATE "User" SET "WalletBalance" = "WalletBalance" + NEW."RestaurantEarning" WHERE "UserID" = owner_user_id;
        INSERT INTO "WalletTransaction" ("TransactionID", "UserID", "TransactionType", "Amount", "Description")
        VALUES (gen_random_uuid(), owner_user_id, 'Credit', NEW."RestaurantEarning", 'Payout Order #' || NEW."OrderID");

        -- 3. SETTLE DRIVER (COD vs ONLINE)
        IF NEW."DeliveryPartnerID" IS NOT NULL THEN
            SELECT dp."UserID" INTO driver_user_id FROM "DeliveryPartner" dp WHERE dp."DeliveryPartnerID" = NEW."DeliveryPartnerID";
            SELECT "PaymentMethod" INTO pay_method FROM "Payment" WHERE "PaymentID" = NEW."PaymentID";

            IF pay_method = 'COD' THEN
                -- Driver has cash. Debit the difference.
                amount_to_adjust := NEW."TotalAmount" - NEW."DeliveryPartnerEarning";
                UPDATE "User" SET "WalletBalance" = "WalletBalance" - amount_to_adjust WHERE "UserID" = driver_user_id;
                INSERT INTO "WalletTransaction" ("TransactionID", "UserID", "TransactionType", "Amount", "Description")
                VALUES (gen_random_uuid(), driver_user_id, 'Debit', amount_to_adjust, 'COD Settlement #' || NEW."OrderID");
            ELSE
                -- Online pay. Credit the fee.
                UPDATE "User" SET "WalletBalance" = "WalletBalance" + NEW."DeliveryPartnerEarning" WHERE "UserID" = driver_user_id;
                INSERT INTO "WalletTransaction" ("TransactionID", "UserID", "TransactionType", "Amount", "Description")
                VALUES (gen_random_uuid(), driver_user_id, 'Credit', NEW."DeliveryPartnerEarning", 'Delivery Fee #' || NEW."OrderID");
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payout_on_delivery
AFTER UPDATE ON "Orders"
FOR EACH ROW
EXECUTE FUNCTION distribute_payouts();