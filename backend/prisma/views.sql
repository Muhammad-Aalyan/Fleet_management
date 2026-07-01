-- ─── View: vw_DashboardStats ─────────────────────────────────────────────────
-- Single-row summary for the admin dashboard overview cards
IF OBJECT_ID('dbo.vw_DashboardStats', 'V') IS NOT NULL DROP VIEW dbo.vw_DashboardStats;
GO
CREATE VIEW dbo.vw_DashboardStats AS
SELECT
  (SELECT COUNT(*) FROM dbo.Driver)                                                          AS totalDrivers,
  (SELECT COUNT(*) FROM dbo.Vehicle)                                                         AS totalVehicles,
  (SELECT COUNT(*) FROM dbo.RideRequest WHERE status IN ('PENDING','APPROVED'))              AS pendingRequests,
  (SELECT COUNT(*) FROM dbo.RideRequest WHERE status IN ('ASSIGNED','IN_PROGRESS'))          AS activeRides,
  (SELECT COUNT(*) FROM dbo.RideRequest WHERE status = 'COMPLETED'
     AND CAST(createdAt AS DATE) = CAST(GETDATE() AS DATE))                                  AS completedToday,
  (SELECT COUNT(*) FROM dbo.Customer)                                                        AS totalCustomers,
  (SELECT COUNT(*) FROM dbo.RideRequest)                                                     AS totalRequests,
  (SELECT ISNULL(SUM(amount), 0) FROM dbo.FuelLog)                                          AS totalFuelCost,
  -- Vehicle utilization counts
  (SELECT COUNT(*) FROM dbo.Vehicle WHERE status = 'AVAILABLE')                             AS vehiclesAvailable,
  (SELECT COUNT(*) FROM dbo.Vehicle WHERE status = 'IN_RIDE')                               AS vehiclesInRide,
  (SELECT COUNT(*) FROM dbo.Vehicle WHERE status = 'MAINTENANCE')                           AS vehiclesMaintenance,
  (SELECT COUNT(*) FROM dbo.Vehicle WHERE status = 'INACTIVE')                              AS vehiclesInactive,
  -- Driver status counts
  (SELECT COUNT(*) FROM dbo.Driver WHERE status = 'AVAILABLE')                              AS driversAvailable,
  (SELECT COUNT(*) FROM dbo.Driver WHERE status = 'ON_RIDE')                                AS driversOnRide,
  (SELECT COUNT(*) FROM dbo.Driver WHERE status = 'OFF_DUTY')                               AS driversOffDuty;
GO

-- ─── View: vw_ActiveRides ────────────────────────────────────────────────────
-- All rides currently ASSIGNED or IN_PROGRESS with customer, driver, vehicle info
IF OBJECT_ID('dbo.vw_ActiveRides', 'V') IS NOT NULL DROP VIEW dbo.vw_ActiveRides;
GO
CREATE VIEW dbo.vw_ActiveRides AS
SELECT
  rr.id,
  rr.status,
  rr.pickupLocation,
  rr.dropLocation,
  rr.scheduledDate,
  rr.scheduledTime,
  rr.passengers,
  rr.purpose,
  rr.createdAt,
  -- Customer
  c.name                                    AS customerName,
  cu.email                                  AS customerEmail,
  c.phone                                   AS customerPhone,
  -- Driver
  d.name                                    AS driverName,
  d.phone                                   AS driverPhone,
  du.email                                  AS driverEmail,
  -- Vehicle
  v.vehicleNumber,
  v.model                                   AS vehicleModel,
  v.capacity                                AS vehicleCapacity,
  -- Assignment timestamps
  ra.assignedAt,
  ra.startedAt
FROM dbo.RideRequest rr
JOIN dbo.Customer c   ON c.id  = rr.customerId
JOIN dbo.[User]   cu  ON cu.id = c.userId
LEFT JOIN dbo.RideAssignment ra ON ra.rideRequestId = rr.id
LEFT JOIN dbo.Driver d          ON d.id  = ra.driverId
LEFT JOIN dbo.[User] du         ON du.id = d.userId
LEFT JOIN dbo.Vehicle v         ON v.id  = ra.vehicleId
WHERE rr.status IN ('ASSIGNED', 'IN_PROGRESS');
GO

-- ─── View: vw_Customers ──────────────────────────────────────────────────────
-- All customers with ride statistics
IF OBJECT_ID('dbo.vw_Customers', 'V') IS NOT NULL DROP VIEW dbo.vw_Customers;
GO
CREATE VIEW dbo.vw_Customers AS
SELECT
  c.id,
  c.name,
  c.phone,
  u.email,
  u.isActive,
  u.createdAt                                                      AS joinedAt,
  COUNT(rr.id)                                                     AS totalRides,
  SUM(CASE WHEN rr.status = 'COMPLETED'  THEN 1 ELSE 0 END)       AS completedRides,
  SUM(CASE WHEN rr.status = 'CANCELLED'  THEN 1 ELSE 0 END)       AS cancelledRides,
  SUM(CASE WHEN rr.status IN ('PENDING','APPROVED',
       'ASSIGNED','IN_PROGRESS')          THEN 1 ELSE 0 END)       AS activeRides,
  MAX(rr.createdAt)                                                AS lastRideAt
FROM dbo.Customer c
JOIN dbo.[User] u     ON u.id = c.userId
LEFT JOIN dbo.RideRequest rr ON rr.customerId = c.id
GROUP BY c.id, c.name, c.phone, u.email, u.isActive, u.createdAt;
GO

-- ─── View: vw_FuelByVehicle ──────────────────────────────────────────────────
-- Per-vehicle fuel summary for admin audit
IF OBJECT_ID('dbo.vw_FuelByVehicle', 'V') IS NOT NULL DROP VIEW dbo.vw_FuelByVehicle;
GO
CREATE VIEW dbo.vw_FuelByVehicle AS
SELECT
  v.id                                    AS vehicleId,
  v.vehicleNumber,
  v.model,
  v.fuelType,
  COUNT(fl.id)                            AS totalEntries,
  ISNULL(SUM(fl.liters), 0)              AS totalLiters,
  ISNULL(SUM(fl.amount), 0)              AS totalAmount,
  ISNULL(AVG(fl.amount / NULLIF(fl.liters, 0)), 0) AS avgPricePerLiter,
  MAX(fl.createdAt)                       AS lastFuelDate
FROM dbo.Vehicle v
LEFT JOIN dbo.FuelLog fl ON fl.vehicleId = v.id
GROUP BY v.id, v.vehicleNumber, v.model, v.fuelType;
GO

-- ─── View: vw_RecentRideRequests ─────────────────────────────────────────────
-- Last 20 ride requests with customer + driver for the dashboard table
IF OBJECT_ID('dbo.vw_RecentRideRequests', 'V') IS NOT NULL DROP VIEW dbo.vw_RecentRideRequests;
GO
CREATE VIEW dbo.vw_RecentRideRequests AS
SELECT TOP 20
  rr.id,
  rr.status,
  rr.pickupLocation,
  rr.dropLocation,
  rr.scheduledDate,
  rr.passengers,
  c.name  AS customerName,
  d.name  AS driverName
FROM dbo.RideRequest rr
JOIN dbo.Customer c       ON c.id = rr.customerId
LEFT JOIN dbo.RideAssignment ra ON ra.rideRequestId = rr.id
LEFT JOIN dbo.Driver d          ON d.id = ra.driverId
ORDER BY rr.createdAt DESC;
GO
