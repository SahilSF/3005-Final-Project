
-- Insert data into Members
INSERT INTO Members (Name, Email, Password, Goal, BMI, PaymentStatus) VALUES
('John Doe', 'johndoe@example.com', 'password123', 'Lose weight', '24', 'Paid'),
('Jane Smith', 'janesmith@example.com', 'password456', 'Gain muscle', '22', 'Unpaid');

-- Insert data into Trainer
INSERT INTO Trainer (Name, Specialization) VALUES
('Sam Taylor', 'Cardio'),
('Alex Jordan', 'Strength training');

-- Insert data into Fitness_Class
INSERT INTO Fitness_Class (Schedule, TrainerID) VALUES
(1010, 1),
(1020, 2);

-- Insert data into Equipment
INSERT INTO Equipment (Status) VALUES
(1),
(0);

-- Insert data into Staff
INSERT INTO Staff (Name, Role) VALUES
('Alice Johnson', 'Receptionist'),
('Bob Lee', 'Maintenance');

-- Insert data into Room
INSERT INTO Room (StaffID, Capacity) VALUES
(1, 20),
(2, 15);

-- Insert data into Equipment_Admin
INSERT INTO Equipment_Admin (EquipmentID, StaffID) VALUES
(1, 2);

-- Insert data into Member_Fitness
INSERT INTO Member_Fitness (MemberID, ClassID) VALUES
(1, 1),
(2, 2);

-- Insert data into Register
INSERT INTO Register (MemberID, ClassID, GroupFitnessSession) VALUES
(1, 1, 'Morning Yoga'),
(2, 2, 'Evening Weights');

-- Insert data into Training
INSERT INTO Training (TrainerID, MemberID, Date, Time) VALUES
(1, 1, '2024-04-12', '09:00:00'),
(2, 2, '2024-04-12', '17:00:00');
