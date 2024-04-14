import pkg from 'pg';
const { Pool } = pkg;


// Database connection parameters
const DB_NAME = "Gym";
const DB_USER = "postgres";
const DB_PASSWORD = "asdf";
const DB_HOST = "localhost";
const DB_PORT = "5432";

// Create a new pool instance
const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: DB_PORT
});

async function connect() {
  try {
    const client = await pool.connect();
    console.log("Connected to the database successfully.");
    client.release(); 
    return client;
  } catch (error) {
    console.error("Error while connecting to PostgreSQL:", error);
  }
}

export { connect, pool };



import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


async function showMemberDashboard(name, memberID) {
  console.log(`\nHello ${name}!\n`);
  console.log("Select an action:");
  console.log("1. Edit profile information");
  console.log("2. Schedule Management");
  console.log("3. Display Profile Information");
  console.log("4. See Future Schedules");
  console.log("5. Sign out");

  //Done
  const choice = await prompt("\nEnter your option: ");
  switch (choice) {
    case "1":
      await modifyUserProfile(name, memberID);
      break;
    case "2":
      await handleScheduleManagement(name, memberID);
      break;
    case "3":
      await showProfile(name, memberID);
      break;
    case "4":
      await showSchedules(name, memberID);
      break;
    case "5":
      main(); 
      break;
    default:
      console.log("\nInvalid option. Please try again.\n");
      await showMemberDashboard(name, memberID);
  }
}


async function showSchedules(name, memberID) {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT SessionID, Date, Time, TrainerID FROM Training WHERE MemberID = $1;", [memberID]);
    const sessions = res.rows;
    if (sessions.length > 0) {
      console.log("\nUpcoming Training sessions:");
      sessions.forEach(session => {
        console.log(`Session ID: ${session.sessionid}, Date: ${session.date}, Time: ${session.time}, Trainer ID: ${session.trainerid}`);
      });
    } else {
      console.log("No upcoming Training sessions.");
    }
    
    const classRes = await client.query(`SELECT FC.ClassID, FC.Schedule, FC.TrainerID 
                                         FROM Fitness_Class FC 
                                         JOIN Register R ON FC.ClassID = R.ClassID 
                                         WHERE R.MemberID = $1;`, [memberID]);
    const classes = classRes.rows;
    if (classes.length > 0) {
      console.log("\nUpcoming Group Fitness Classes:");
      classes.forEach(cls => {
        console.log(`Class ID: ${cls.classid}, Schedule: ${cls.schedule}, Trainer ID: ${cls.trainerid}`);
      });
    } else {
      console.log("No upcoming Group Fitness Classes.");
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
    await showMemberDashboard(name, memberID);
  }
}

async function handleScheduleManagement(name, memberID) {
  console.log("\nWhat action would you like to take?");
  console.log("1. Book a group fitness class");
  console.log("2. Book a personal training session");
  console.log("3. Change the time of a personal training session");
  console.log("4. Withdraw from a group fitness class");
  console.log("5. Withdraw from a personal training session");
  

  const choice = await prompt("\nEnter your option: ");
  const client = await pool.connect();
  try {
    switch (choice) {
      case "1":

        const groupName = await prompt("Enter name of group: ");
        const classID = await prompt("Enter ID of class you want to register for: ");
        const classRes = await client.query("SELECT Schedule, RoomID, TrainerID FROM Fitness_Class WHERE ClassID = $1;", [classID]);
        const fitnessClass = classRes.rows[0];
        if (fitnessClass) {
          console.log(`Schedule: ${fitnessClass.schedule}, Room ID: ${fitnessClass.roomid}, Trainer ID: ${fitnessClass.trainerid}`);
          await client.query("INSERT INTO Registers (MemberID, ClassID, GroupName) VALUES ($1, $2, $3);", [memberID, classID, groupName]);
          console.log("Registration successful.");
        }
        break;
      case "2":
        const res = await client.query(`
          SELECT t.TrainerID, t.Name, t.Specialization, t.AvailableTimes
          FROM Trainer t
          LEFT JOIN Training ts ON t.TrainerID = ts.TrainerID
          WHERE ts.TrainerID IS NULL;
        `);
        const sessions = res.rows;
        if (sessions.length > 0) {
          sessions.forEach(session => {
            console.log(`${session.trainerid}: ${session.name}, Specialization: ${session.specialization}, Available Times: ${session.availabletimes}`);
          });
          const trainerID = await prompt("Enter ID of the trainer you want to schedule a session with: ");
          const date = await prompt("Enter date of session: ");
          const time = await prompt("Enter time of session: ");
          await client.query("INSERT INTO Training (Date, Time, MemberID, TrainerID) VALUES ($1, $2, $3, $4);", [date, time, memberID, trainerID]);
          console.log("Session scheduled successfully.");
        } else {
          console.log("No trainers available.");
        }
        break;
      case "3":
        const sessionIDReschedule = await prompt("Enter ID of session to be rescheduled: ");
        const newDate = await prompt("Enter new date: ");
        const newTime = await prompt("Enter new time: ");
        await client.query("UPDATE Training SET Date = $1, Time = $2 WHERE SessionID = $3;", [newDate, newTime, sessionIDReschedule]);
        console.log("Session rescheduled successfully.");
        break;
      case "4":
        const classIDCancel = await prompt("Enter ID of group fitness class to be cancelled: ");
        await client.query("DELETE FROM Registers WHERE ClassID = $1 AND MemberID = $2;", [classIDCancel, memberID]);
        console.log("Class registration cancelled successfully.");
        break;
      case "5":
        const sessionIDCancel = await prompt("Enter ID of training session to be cancelled: ");
        await client.query("DELETE FROM Training WHERE SessionID = $1;", [sessionIDCancel]);
        console.log("Session cancelled successfully.");
        break;
      default:
        console.log("Invalid option. Please try again.");
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
    await showMemberDashboard(name, memberID);
  }
}


async function modifyUserProfile(name, memberID) {
  console.log("\nModify your profile details:");
  console.log("1. Change your name");
  console.log("2. Change your password");
  console.log("3. Change your email address");
  console.log("4. Set new fitness goals");
  console.log("5. Update your health metrics");

  const choice = await prompt("\nEnter your option: ");
  const client = await pool.connect();

  try {
    switch (choice) {
      case "1":
        const newName = await prompt("Enter updated name: ");
        await client.query("UPDATE Members SET Name = $1 WHERE MemberID = $2;", [newName, memberID]);
        console.log("Name updated successfully.");
        break;
      case "2":
        const newPassword = await prompt("Enter new password: ");
        await client.query("UPDATE Members SET Password = $1 WHERE MemberID = $2;", [newPassword, memberID]);
        console.log("Password updated successfully.");
        break;
      case "3":
        const newEmail = await prompt("Enter new email: ");
        await client.query("UPDATE Members SET Email = $1 WHERE MemberID = $2;", [newEmail, memberID]);
        console.log("Email updated successfully.");
        break;
      case "4":
        const newGoals = await prompt("Enter new goals: ");
        await client.query("UPDATE Members SET Goal = $1 WHERE MemberID = $2;", [newGoals, memberID]);
        console.log("Goals updated successfully.");
        break;
      case "5":
        const newBMI = await prompt("Enter new BMI: ");
        await client.query("UPDATE Members SET BMI = $1 WHERE MemberID = $2;", [newBMI, memberID]);
        console.log("BMI updated successfully.");
        break;
      default:
        console.log("Invalid option. Please select a valid option.");
        break;
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
    await showMemberDashboard(name, memberID);
  }
}

async function showProfile(name, memberID) {
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT Name, Email, Goal, BMI, PaymentStatus FROM Members WHERE MemberID = $1;", [memberID]);
      const member = res.rows[0];
      if (member) {
        console.log(`Name: ${member.name}, Email: ${member.email},  Goals: ${member.goal}, BMI: ${member.bmi}, PaymentStatus: ${member.paymentstatus}` );
      } else {
        console.log("\nNo profile information found.");
      }
    } catch (err) {
      console.error('Error executing query', err.stack);
    } finally {
      client.release();
      await showMemberDashboard(name, memberID);
    }
}
  
async function showTrainerDashboard(name, trainerID) {
    
console.log(`\nGreetings, Trainer ${name}!`);
    console.log("\nPlease select your action:");
    console.log("1. Modify availability");
    console.log("2. View member profiles");
    console.log("3. View your schedule");
    console.log("4. Sign out");

  
  
    const choice = await prompt("\nEnter your option: ");
    switch (choice) {
      case "1":
        await updateAvailability(name, trainerID);
        break;
      case "2":
        await showMemberProfiles(name, trainerID);
        break;
      case "3":
        await showrainerSchedules(name, trainerID);
        break;
      case "4":
        main(); 
        break;
      default:
        console.log("\nInvalid option. Please try again.");
        await showTrainerDashboard(name, trainerID);
    }
  }

  async function showrainerSchedules(name, trainerID) {
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT SessionID, Date, Time, MemberID FROM Training WHERE TrainerID = $1;", [trainerID]);
      const sessions = res.rows;
      if (sessions.length > 0) {
        console.log("Upcoming Training sessions:");
        sessions.forEach(session => {
          console.log(`Session ID: ${session.sessionid}, Date: ${session.date}, Time: ${session.time}, Member ID: ${session.memberid}`);
        });
      } else {
        console.log("No upcoming Training sessions.");
      }
  
      const classRes = await client.query("SELECT ClassID, Schedule, RoomID FROM Fitness_Class WHERE TrainerID = $1;", [trainerID]);
      const classes = classRes.rows;
      if (classes.length > 0) {
        console.log("Upcoming Group Fitness Classes:");
        classes.forEach(cls => {
          console.log(`Class ID: ${cls.classid}, Schedule: ${cls.schedule}, Room ID: ${cls.RoomID}`);
        });
      } else {
        console.log("No upcoming Group Fitness Classes.");
      }
    } catch (err) {
      console.error('Error executing query', err.stack);
    } finally {
      client.release();
      await showTrainerDashboard(name, trainerID);
    }
  }

  async function updateAvailability(name, trainerID) {
    const availability = await prompt("Enter your availability: ");
    const client = await pool.connect();
    try {
      await client.query("UPDATE Trainer SET AvailableTimes = $1 WHERE TrainerID = $2;", [availability, trainerID]);
      console.log("Availability updated successfully.");
    } catch (err) {
      console.error('Error executing query', err.stack);
    } finally {
      client.release();
      await showTrainerDashboard(name, trainerID);
    }
  }

  async function showMemberProfiles(name, trainerID) {
    const memberName = await prompt("Enter name of member to be searched: ");
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT MemberID, Name, Email, goal, BMI, PaymentStatus FROM Members WHERE Name = $1;", [memberName]);
      const members = res.rows;
      if (members.length > 0) {
        console.log("Member profiles found:");
        members.forEach(member => {
          console.log(`Member ID: ${member.memberid}, Name: ${member.name}, Email: ${member.email}, Goal: ${member.goal}, BMI: ${member.BMI}, Payment Status: ${member.paymentstatus}`);
        });
      } else {
        console.log("Member not found.");
      }
    } catch (err) {
      console.error('Error executing query', err.stack);
    } finally {
      client.release();
      await showTrainerDashboard(name, trainerID);
    }
  }
  


  async function displayAdminDashboard(name, staffID) {
    console.log(`\nWelcome Admin ${name}!`);
    console.log("Please select an option:");
    console.log("1. Administer room reservations");
    console.log("2. Display room bookings");
    console.log("3. Display room details");
    console.log("4. Modify equipment status");
    console.log("5. Check equipment status");
    console.log("6. Organize group fitness class timetables");
    console.log("7. View all classes");
    console.log("8. Manage billing");
    console.log("9. Sign out");

  
    const choice = await prompt("\nEnter your option: ");
    switch (choice) {
      case "1":
        await manageRoomBookings(name, staffID);
        break;
      case "2":
        await showRoomBookings(name, staffID);
        break;
      case "3":
        await showRoomInformation(name, staffID);
        break;
      case "4":
        await manageEquipment(name, staffID);
        break;
      case "5":
        await monitorEquipment(name, staffID);
        break;
      case "6":
        await manageClassSchedules(name, staffID);
        break;
      case "7":
        await showAllClasses(name, staffID);
        break;
      case "8":
        await billing(name, staffID);
        break;
      case "9":
        main(); 
        break;
      default:
        console.log("\nInvalid option. Please try again.");
        await displayAdminDashboard(name, staffID);
    }
  }

  async function showAllClasses(name, staffID) {
  console.log("\nWhich class would you like to show?\n");
  console.log("1. Group Fitness Classes");
  console.log("2. Personal Training Sessions");

  const choice = await prompt("\nEnter your option: ");
  const client = await pool.connect();
  try {
    if (choice === "1") {
      const { rows: classes } = await client.query("SELECT * FROM Fitness_Class;");
      console.log("Group Fitness Classes:");
      classes.forEach(cls => {
        console.log(`Class ID: ${cls.classid}, Schedule: ${cls.schedule}, Room ID: ${cls.RoomID}, Trainer ID: ${cls.trainerid}`);
      });
    } else if (choice === "2") {
      const { rows: sessions } = await client.query("SELECT * FROM Training;");
      console.log("Personal Training Sessions:");
      sessions.forEach(session => {
        console.log(`Session ID: ${session.sessionid}, Date: ${session.date}, Time: ${session.time}, Member ID: ${session.memberid}, Trainer ID: ${session.trainerid}`);
      });
    } else {
      console.log("\nInvalid option. Please try again.");
      await showAllClasses(name, staffID);
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
    await displayAdminDashboard(name, staffID);
  }
}

async function showRoomBookings(name, staffID) {
    const client = await pool.connect();
    try {
      const { rows: bookings } = await client.query("SELECT ClassID, RoomID FROM Fitness_Class;");
      if (bookings.length > 0) {
        console.log("Room bookings:");
        bookings.forEach(booking => {
          console.log(`ClassID: ${booking.classID}, Room ID: ${booking.RoomID}`);
        });
      } else {
        console.log("No room bookings found.");
      }
    } catch (err) {
      console.error('Error executing query', err.stack);
    } finally {
      client.release();
      await displayAdminDashboard(name, staffID);
    }
}
  

async function showRoomInformation(name, staffID) {
    const client = await pool.connect();
    try {
      const { rows: rooms } = await client.query("SELECT RoomID, Capacity, StaffID FROM Room;");
      if (rooms.length > 0) {
        console.log("Room information:");
        rooms.forEach(room => {
          console.log(`Room ID: ${room.RoomID}, Capacity: ${room.capacity}, Staff ID: ${room.staffid}`);
        });
      } else {
        console.log("No room information found.");
      }
    } catch (err) {
      console.error('Error executing query', err.stack);
    } finally {
      client.release();
      await displayAdminDashboard(name, staffID);
    }
  }


async function manageRoomBookings(name, staffID) {
  console.log("\nWhat action would you like to take?");
  console.log("1. Modify room details");
  console.log("2. Adjust room assignments for fitness classes");
  console.log("3. Remove a fitness class reservation");

  const choice = await prompt("\nEnter your option: ");
  const client = await pool.connect();
  try {
    switch (choice) {
      case "1":
        const RoomID = await prompt("Enter id of room to be updated: ");
        const capacity = await prompt("Enter new capacity: ");
        await client.query("UPDATE Room SET Capacity = $1 WHERE RoomID = $2;", [capacity, RoomID]);
        console.log("Room updated successfully.");
        break;
      case "2":
        const classID = await prompt("Enter id of fitness class to be updated: ");
        const newRoomID = await prompt("Enter new room ID: ");
        await client.query("UPDATE Fitness_Class SET RoomID = $1 WHERE ClassID = $2;", [newRoomID, classID]);
        console.log("Room updated successfully.");
        break;
      case "3":
        const classIDToDelete = await prompt("Enter id of fitness class to be deleted: ");
        await client.query("DELETE FROM Fitness_Class WHERE ClassID = $1;", [classIDToDelete]);
        console.log("Reservation for fitness class deleted successfully.");
        break;
      default:
        console.log("Invalid option. Please try again.");
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
    await displayAdminDashboard(name, staffID);
  }
}


async function manageEquipment(name, staffID) {
    const equipmentID = await prompt("Enter id of equipment to be updated: ");
    const status = await prompt("Enter updated status: ");
    const client = await pool.connect();
    try {
      await client.query("UPDATE Equipment SET Status = $1 WHERE EquipmentID = $2;", [status, equipmentID]);
      console.log("Equipment status updated successfully.");
    } catch (err) {
      console.error('Error executing query', err.stack);
    } finally {
      client.release();
      await displayAdminDashboard(name, staffID);
    }
  }

  
async function monitorEquipment(name, staffID) {
  const equipmentID = await prompt("Enter id of equipment to be monitored: ");
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT Status FROM Equipment WHERE EquipmentID = $1;", [equipmentID]);
    if (rows.length > 0) {
      console.log(`The status of equipment with id ${equipmentID} is ${rows[0].status}`);
    } else {
      console.log("Equipment not found.");
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
    await displayAdminDashboard(name, staffID);
  }
}


async function manageClassSchedules(name, staffID) {
  console.log("\nWhat would you like to do?");
  console.log("1. Create a new group fitness class");
  console.log("2. Edit a group fitness class");
  console.log("3. Discontinue a group fitness class");
  console.log("4. Modify a training session");
  console.log("5. Withdraw from a training session");


  const choice = await prompt("\nEnter your option: ");
  const client = await pool.connect();
  try {
    switch (choice) {
      case "1":
        const schedule = await prompt("Enter schedule of class: ");
        const trainerID = await prompt("Enter trainer ID for class: ");
        await client.query("INSERT INTO Fitness_Class (Schedule,TrainerID) VALUES ($1, $2, $3, $4);", [schedule, trainerID]);
        console.log("Class added successfully.");
        break;
      case "2":
        const classIDToUpdate = await prompt("Enter id of class to be updated: ");
        const newSchedule = await prompt("Enter updated class schedule: ");
        await client.query("UPDATE Fitness_Class SET Schedule = $1 WHERE ClassID = $2;", [newSchedule, classIDToUpdate]);
        console.log("Class schedule updated successfully.");
        break;
      case "3":
        const classIDToCancel = await prompt("Enter id of class to be cancelled: ");
        await client.query("DELETE FROM Fitness_Class WHERE ClassID = $1;", [classIDToCancel]);
        console.log("Class cancelled successfully.");
        break;
      case "4":
        const sessionIDToUpdate = await prompt("Enter id of session to be updated: ");
        const newDate = await prompt("Enter updated date: ");
        const newTime = await prompt("Enter updated time: ");
        await client.query("UPDATE Training SET Date = $1, Time = $2 WHERE SessionID = $3;", [newDate, newTime, sessionIDToUpdate]);
        console.log("Session updated successfully.");
        break;
      case "5":
        const sessionIDToCancel = await prompt("Enter id of session to be cancelled: ");
        await client.query("DELETE FROM Training WHERE SessionID = $1;", [sessionIDToCancel]);
        console.log("Session cancelled successfully.");
        break;
      default:
        console.log("Invalid option. Please try again.");
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
    await displayAdminDashboard(name, staffID);
  }
}

async function login() {
  console.log("\nWhat would you like to login as?");
  console.log("1. Login as Member");
  console.log("2. Login as Trainer");
  console.log("3. Login as Admin");

  const choice = await prompt("\nEnter your option: ");
  switch (choice.trim()) {
    case "1":
      await memberAuthentication();
      break;
    case "2":
      await trainerAuthentication();
      break;
    case "3":
      await adminAuthentication();
      break;
    default:
      console.log("\nInvalid option. Please try again.");
      await login();
  }
}

async function memberAuthentication() {
  const email = await prompt("Enter email: ");
  const password = await prompt("Enter password: ");
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT MemberID, Name FROM Members WHERE Email = $1 AND Password = $2", [email, password]);
    if (rows.length > 0) {
      const member = rows[0];
      await showMemberDashboard(member.name, member.memberid);
    } else {
      console.log("Invalid email or password. Please try again.");
      await memberAuthentication();
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
  }
}

async function trainerAuthentication() {
  const trainerID = await prompt("Enter trainer ID: ");
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT TrainerID, Name FROM Trainer WHERE TrainerID = $1", [trainerID]);
    if (rows.length > 0) {
      const trainer = rows[0];
      await showTrainerDashboard(trainer.name, trainer.trainerid); 
    } else {
      console.log("Invalid trainer ID. Please try again.");
      await trainerAuthentication();
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
  }
}

async function adminAuthentication() {
  const staffID = await prompt("Enter staff ID: ");
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT StaffID, Name FROM Staff WHERE StaffID = $1", [staffID]);
    if (rows.length > 0) {
      const admin = rows[0];
      await displayAdminDashboard(admin.name, admin.staffid); 
    } else {
      console.log("Invalid admin ID. Please try again.");
      await adminAuthentication();
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
  }
}

async function register() {
  try {
      const name = await prompt("Enter Name: ");
      const email = await prompt("Enter email: ");
      const password = await prompt("Enter password: ");
      const goals = await prompt("Enter fitness goals: ");
      const BMI = await prompt("Enter BMI: ");

      const client = await pool.connect();
      try {
          await client.query("BEGIN");
          await client.query(
              "INSERT INTO Members (Name, Email, Password, Goal, BMi, PaymentStatus) VALUES ($1, $2, $3, $4, $5, 'Pending');",
              [name, email, password, goals, BMI]
          );
          const res = await client.query(
              "SELECT MemberID FROM Members WHERE Email = $1;",
              [email]
          );
          await client.query("COMMIT");
          const memberID = res.rows[0]?.memberid; 
          if (memberID) {
              console.log("\nUser registered successfully.");
              await showMemberDashboard(name, memberID); 
          } else {
              console.log("\nRegistration failed. Please try again.");
              await register(); 
          }
      } catch (err) {
          await client.query("ROLLBACK");
          throw err;
      } finally {
          client.release();
      }
  } catch (error) {
      console.error("Error in registration:", error);
  } finally {
      rl.close(); 
  }
}


function prompt(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
    console.log("Welcome to Sahil's GYM!\n");
    console.log("1. Login");
    console.log("2. Register"); 
    console.log("3. Exit");

    const choice = await prompt("\nWhat would you like to do? ");
    switch (choice.trim()) {
        case "1":
            await login();
            break;
        case "2":
            await register(); 
            break;
        case "3":
            console.log("Ending the program.");
            console.log("See you soon!");
            rl.close(); 
            process.exit(0);  
            break;
        default:
            console.log("Invalid option. Please try again.");
            await main();
    }
}


main().catch(err => {
    console.error('Startup error:', err);
    rl.close();
});