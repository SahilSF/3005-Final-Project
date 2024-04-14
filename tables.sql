CREATE TABLE Members (
    MemberID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Email VARCHAR(255) UNIQUE,
    Password VARCHAR(255) UNIQUE,
    Goal TEXT,
    Weight TEXT,
	PaymentStatus TEXT
);

CREATE TABLE Staff (
    StaffID SERIAL PRIMARY KEY,
    Name VARCHAR(255),
    Role VARCHAR(255)
);
CREATE TABLE Trainer (
    TrainerID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Specialization TEXT
);
CREATE TABLE Room (
    RoomID SERIAL PRIMARY KEY,
	StaffID INTEGER,
    Capacity INTEGER,
	FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
);
CREATE TABLE Fitness_Class (
    ClassID SERIAL PRIMARY KEY,
    Schedule INTEGER NOT NULL,
	TrainerID INTEGER,
	RoomID INTEGER,
    FOREIGN KEY (TrainerID) REFERENCES Trainer(TrainerID),
	FOREIGN KEY (RoomID) REFERENCES Room(RoomID)
);
CREATE TABLE Equipment (
    EquipmentID SERIAL PRIMARY KEY,
    Status INTEGER
);


CREATE TABLE Equipment_Admin (
    EquipmentID INTEGER,
    StaffID INTEGER,
    PRIMARY KEY (EquipmentID, StaffID),
    FOREIGN KEY (EquipmentID) REFERENCES Equipment(EquipmentID),
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
);
CREATE TABLE Member_Fitness (
    MemberID INTEGER,
    ClassID INTEGER,
    PRIMARY KEY (MemberID, ClassID),
    FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
    FOREIGN KEY (ClassID) REFERENCES Fitness_Class(ClassID)
);
CREATE TABLE Register (
    MemberID INTEGER,
    ClassID INTEGER,
	GroupFitnessSession TEXT,
    PRIMARY KEY (MemberID, ClassID),
    FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
    FOREIGN KEY (ClassID) REFERENCES Fitness_Class(ClassID)
);
CREATE TABLE Training (
    TrainerID INTEGER,
    MemberID INTEGER,
    SessionID SERIAL PRIMARY KEY,
    Date DATE,
    Time TIME,
    FOREIGN KEY (TrainerID) REFERENCES Trainer(TrainerID),
    FOREIGN KEY (MemberID) REFERENCES Members(MemberID)
);
