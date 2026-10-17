-- Run only in a new, empty SQL Server practice database.
-- Creates sample objects. Does not drop or replace existing objects.
CREATE TABLE DIM_REGION (
  region nvarchar(20) NOT NULL PRIMARY KEY,
  manager nvarchar(40) NOT NULL
);
CREATE TABLE TABLE_SALES (
  id int NOT NULL PRIMARY KEY,
  region nvarchar(20) NOT NULL,
  customer nvarchar(20) NOT NULL,
  dt_month date NOT NULL,
  status nvarchar(20) NOT NULL,
  amount decimal(18,2) NOT NULL
);
-- Time-comparison SQL uses the standard system calendar.
CREATE TABLE DML_CALENDAR (
  dt_date date NOT NULL PRIMARY KEY,
  dt_month date NOT NULL
);
DECLARE @calendar_date date = '2024-12-01';
WHILE @calendar_date < '2025-03-01'
BEGIN
  INSERT INTO DML_CALENDAR (dt_date, dt_month)
  VALUES (@calendar_date, DATEFROMPARTS(YEAR(@calendar_date), MONTH(@calendar_date), 1));
  SET @calendar_date = DATEADD(day, 1, @calendar_date);
END;
INSERT INTO DIM_REGION (region, manager) VALUES
('North', 'Ada'),
('South', 'Lin');
INSERT INTO TABLE_SALES (id, region, customer, dt_month, status, amount) VALUES
(1, 'North', 'A', '2025-02-01', 'completed', 10),
(2, 'North', 'B', '2025-02-01', 'returned', 20),
(3, 'South', 'C', '2025-02-01', 'completed', 30),
(4, 'South', 'C', '2025-02-01', 'completed', 40),
(5, 'North', 'A', '2025-01-01', 'completed', 8),
(6, 'North', 'A', '2025-01-01', 'completed', 12),
(7, 'South', 'C', '2025-01-01', 'completed', 20),
(8, 'South', 'D', '2025-01-01', 'completed', 30);
-- Both checks must return no rows.
SELECT id, COUNT(*) AS rows_per_key FROM TABLE_SALES GROUP BY id HAVING COUNT(*) > 1;
SELECT region, COUNT(*) AS rows_per_key FROM DIM_REGION GROUP BY region HAVING COUNT(*) > 1;
