-- CreateEnum
CREATE TYPE "user_role_enum" AS ENUM ('RestaurantOwner', 'DeliveryPartner', 'User', 'SuperAdmin', 'Ops', 'Support');

-- CreateEnum
CREATE TYPE "payment_method_enum" AS ENUM ('UPI', 'Card', 'Wallet', 'COD');

-- CreateEnum
CREATE TYPE "payment_status_enum" AS ENUM ('Pending', 'Success', 'Failed');

-- CreateEnum
CREATE TYPE "order_status_enum" AS ENUM ('Placed', 'Preparing', 'PickedUp', 'Delivered', 'Cancelled');

-- CreateEnum
CREATE TYPE "transaction_type_enum" AS ENUM ('Credit', 'Debit');

-- CreateEnum
CREATE TYPE "discount_type_enum" AS ENUM ('Flat', 'Percentage');

-- CreateEnum
CREATE TYPE "ticket_status_enum" AS ENUM ('Open', 'InProgress', 'Resolved');

-- CreateEnum
CREATE TYPE "login_status_enum" AS ENUM ('Success', 'Failed_OTP', 'Failed_Block');

-- CreateTable
CREATE TABLE "ServiceZone" (
    "ZoneID" TEXT NOT NULL,
    "ZoneName" TEXT,
    "City" TEXT,
    "RadiusKM" DECIMAL(65,30),

    CONSTRAINT "ServiceZone_pkey" PRIMARY KEY ("ZoneID")
);

-- CreateTable
CREATE TABLE "User" (
    "UserID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Phone" TEXT NOT NULL,
    "Role" "user_role_enum",
    "ProfilePicURL" TEXT,
    "PasswordHash" TEXT NOT NULL,
    "WalletBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ZoneID" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("UserID")
);

-- CreateTable
CREATE TABLE "Address" (
    "AddressID" TEXT NOT NULL,
    "AddressLine" TEXT,
    "City" TEXT,
    "Pincode" TEXT,
    "Latitude" DECIMAL(65,30),
    "Longitude" DECIMAL(65,30),
    "IsDefault" BOOLEAN NOT NULL DEFAULT false,
    "UserID" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("AddressID")
);

-- CreateTable
CREATE TABLE "RestaurantOwner" (
    "OwnerID" TEXT NOT NULL,
    "PANNumber" TEXT NOT NULL,
    "BankAccountNo" TEXT,
    "IFSC" TEXT,
    "UserID" TEXT NOT NULL,

    CONSTRAINT "RestaurantOwner_pkey" PRIMARY KEY ("OwnerID")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "RestaurantID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "CategoryName" TEXT,
    "Latitude" DECIMAL(65,30),
    "Longitude" DECIMAL(65,30),
    "Rating" DECIMAL(65,30),
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "IsOpen" BOOLEAN NOT NULL DEFAULT true,
    "OwnerID" TEXT,
    "ZoneID" TEXT,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("RestaurantID")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "ItemID" TEXT NOT NULL,
    "ItemName" TEXT,
    "ItemImageURL" TEXT,
    "Price" DECIMAL(65,30),
    "IsVeg" BOOLEAN,
    "IsAvailable" BOOLEAN NOT NULL DEFAULT true,
    "AvailableQuantity" INTEGER NOT NULL DEFAULT 0,
    "RestaurantID" TEXT NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("ItemID")
);

-- CreateTable
CREATE TABLE "DeliveryPartner" (
    "DeliveryPartnerID" TEXT NOT NULL,
    "VehicleNumber" TEXT,
    "LicenseNumber" TEXT,
    "CurrentLatitude" DECIMAL(65,30),
    "CurrentLongitude" DECIMAL(65,30),
    "IsAvailable" BOOLEAN NOT NULL DEFAULT false,
    "UserID" TEXT NOT NULL,

    CONSTRAINT "DeliveryPartner_pkey" PRIMARY KEY ("DeliveryPartnerID")
);

-- CreateTable
CREATE TABLE "Payment" (
    "PaymentID" TEXT NOT NULL,
    "TotalAmount" DECIMAL(65,30),
    "PaymentMethod" "payment_method_enum",
    "PaymentStatus" "payment_status_enum",
    "TransactionReference" TEXT,
    "PaymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UserID" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("PaymentID")
);

-- CreateTable
CREATE TABLE "Orders" (
    "OrderID" TEXT NOT NULL,
    "OrderDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "TotalAmount" DECIMAL(65,30),
    "OrderStatus" "order_status_enum",
    "RestaurantEarning" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "DeliveryPartnerEarning" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "UserID" TEXT NOT NULL,
    "RestaurantID" TEXT NOT NULL,
    "DeliveryPartnerID" TEXT,
    "PaymentID" TEXT,
    "AddressID" TEXT,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("OrderID")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "OrderItemID" TEXT NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "ItemPrice" DECIMAL(65,30),
    "OrderID" TEXT NOT NULL,
    "ItemID" TEXT NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("OrderItemID")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "InvoiceID" TEXT NOT NULL,
    "InvoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "PDFUrl" TEXT,
    "OrderID" TEXT NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("InvoiceID")
);

-- CreateTable
CREATE TABLE "Review" (
    "ReviewID" TEXT NOT NULL,
    "RatingRestaurant" INTEGER,
    "RatingDelivery" INTEGER,
    "ReviewText" TEXT,
    "UserID" TEXT NOT NULL,
    "RestaurantID" TEXT NOT NULL,
    "OrderID" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("ReviewID")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "TicketID" TEXT NOT NULL,
    "IssueType" TEXT,
    "Description" TEXT,
    "Status" "ticket_status_enum",
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UserID" TEXT NOT NULL,
    "OrderID" TEXT NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("TicketID")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "CouponID" TEXT NOT NULL,
    "CouponCode" TEXT NOT NULL,
    "DiscountType" "discount_type_enum",
    "DiscountValue" DECIMAL(65,30),
    "ExpiryDate" TIMESTAMP(3),
    "IsActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("CouponID")
);

-- CreateTable
CREATE TABLE "UserCoupon" (
    "UsageID" TEXT NOT NULL,
    "UsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UserID" TEXT NOT NULL,
    "CouponID" TEXT NOT NULL,
    "OrderID" TEXT NOT NULL,

    CONSTRAINT "UserCoupon_pkey" PRIMARY KEY ("UsageID")
);

-- CreateTable
CREATE TABLE "NotificationInbox" (
    "NotificationID" TEXT NOT NULL,
    "Title" TEXT,
    "Body" TEXT,
    "ActionLink" TEXT,
    "IsRead" BOOLEAN NOT NULL DEFAULT false,
    "ReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UserID" TEXT NOT NULL,

    CONSTRAINT "NotificationInbox_pkey" PRIMARY KEY ("NotificationID")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "TransactionID" TEXT NOT NULL,
    "TransactionType" "transaction_type_enum",
    "Amount" DECIMAL(65,30),
    "Description" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UserID" TEXT NOT NULL,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("TransactionID")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "HistoryID" TEXT NOT NULL,
    "IPAddress" TEXT,
    "DeviceType" TEXT,
    "LoginStatus" "login_status_enum",
    "AttemptTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UserID" TEXT NOT NULL,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("HistoryID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "User_Phone_key" ON "User"("Phone");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantOwner_PANNumber_key" ON "RestaurantOwner"("PANNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantOwner_UserID_key" ON "RestaurantOwner"("UserID");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryPartner_LicenseNumber_key" ON "DeliveryPartner"("LicenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryPartner_UserID_key" ON "DeliveryPartner"("UserID");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_OrderID_key" ON "Invoice"("OrderID");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_CouponCode_key" ON "Coupon"("CouponCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_ZoneID_fkey" FOREIGN KEY ("ZoneID") REFERENCES "ServiceZone"("ZoneID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantOwner" ADD CONSTRAINT "RestaurantOwner_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_OwnerID_fkey" FOREIGN KEY ("OwnerID") REFERENCES "RestaurantOwner"("OwnerID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_ZoneID_fkey" FOREIGN KEY ("ZoneID") REFERENCES "ServiceZone"("ZoneID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_RestaurantID_fkey" FOREIGN KEY ("RestaurantID") REFERENCES "Restaurant"("RestaurantID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryPartner" ADD CONSTRAINT "DeliveryPartner_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_RestaurantID_fkey" FOREIGN KEY ("RestaurantID") REFERENCES "Restaurant"("RestaurantID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_DeliveryPartnerID_fkey" FOREIGN KEY ("DeliveryPartnerID") REFERENCES "DeliveryPartner"("DeliveryPartnerID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_PaymentID_fkey" FOREIGN KEY ("PaymentID") REFERENCES "Payment"("PaymentID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_AddressID_fkey" FOREIGN KEY ("AddressID") REFERENCES "Address"("AddressID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "Orders"("OrderID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_ItemID_fkey" FOREIGN KEY ("ItemID") REFERENCES "MenuItem"("ItemID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "Orders"("OrderID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_RestaurantID_fkey" FOREIGN KEY ("RestaurantID") REFERENCES "Restaurant"("RestaurantID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "Orders"("OrderID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "Orders"("OrderID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_CouponID_fkey" FOREIGN KEY ("CouponID") REFERENCES "Coupon"("CouponID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_OrderID_fkey" FOREIGN KEY ("OrderID") REFERENCES "Orders"("OrderID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationInbox" ADD CONSTRAINT "NotificationInbox_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;
