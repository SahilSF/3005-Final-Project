import pkg from 'pg';
const { Pool } = pkg;


// Database connection parameters
const DB_NAME = "New";
const DB_USER = "postgres";
const DB_PASSWORD = "sdfg";
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


async function showMemberDashboard(memberID) {
  console.log("1. Edit profile information");
  console.log("2. Schedule Management");
  console.log("3. Display Profile Information");
  console.log("4. See Future Schedules");
  console.log("5. Sign out");

  //Done
  const options = await prompt("\nEnter your option: ");
  switch (options) {
    case "1":
      await modifyUserProfile(memberID);
      break;
    case "2":
      await handleScheduleManagement(memberID);
      break;
    case "3":
      await showProfile(memberID);
      break;
    case "4":
      await showSchedules(memberID);
      break;
    case "5":
      main(); 
      break;
    default:
      console.log("\nInvalid option. Please try again.\n");
      await showMemberDashboard(memberID);
  }
}


async function showSchedules(memberID) {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT TrainerID, SessionID FROM Training WHERE MemberID = $1;", [memberID]);
    const sessions = res.rows;
    if (sessions.length > 0) {
      console.log("\nUpcoming Training sessions:");
      sessions.forEach(session => {
        console.log(`Session ID: ${session.sessionid}, Trainer ID: ${session.trainerid}`);
      });
    } else {
      console.log("No upcoming Training sessions.");
    }
    
    const classRes = await client.query(`SELECT FC.Schedule, FC.TrainerID FROM Fitness_Class FC JOIN Register R ON FC.ClassID = R.ClassID WHERE R.MemberID = $1;`, [memberID]);
    const classes = classRes.rows;
    if (classes.length > 0) {
      console.log("\nUpcoming Group Classes:");
      classes.forEach(cls => {
        console.log(`Schedule: ${cls.schedule}, Trainer ID: ${cls.trainerid}`);
      });
    } else {
      console.log("No upcoming Group Classes.");
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
    await showMemberDashboard(memberID);
  }
}

async function handleScheduleManagement(memberID) {
  console.log("1. Book a group class");
  console.log("2. Book a personal class");
  console.log("3. Change the time of a personal class");
  console.log("4. Withdraw from a group class");
  console.log("5. Withdraw from a personal class");
  

  const options = await prompt("\nEnter your option: ");
  const client = await pool.connect();
  try {
    switch (options) {
      case "1":

        const groupName = await prompt("Enter name of group: ");
        const classID = await prompt("Enter ID of trainer you want to register for: ");
        const classRes = await client.query("SELECT Schedule FROM Fitness_Class WHERE TrainerID = $1;", [TrainerID]);
        const fitnessClass = classRes.rows[0];
        if (fitnessClass) {
          console.log(`Schedule: ${fitnessClass.schedule},Trainer ID: ${fitnessClass.trainerid}`);
          await client.query("INSERT INTO Register (MemberID, ClassID, GroupName) VALUES ($1, $2, $3);", [memberID, classID, groupName]);
          console.log("Registration successful.");
        }
        break;
      case "2":
        const res = await client.query(`SELECT t.TrainerID, t.Name, t.Specialization FROM Trainer t LEFT JOIN Training ts ON t.TrainerID = ts.TrainerID GROUP BY t.TrainerID, t.Name, t.Specialization HAVING COUNT(ts.SessionID) = 0;`);
        const sessions = res.rows;
        if (sessions.length > 0) {
        console.log("Available trainers:");
        sessions.forEach(session => {
        console.log(`${session.trainerid}: ${session.name}, Specialization: ${session.specialization}`);
         });
        const trainerID = await prompt("Enter ID of the trainer you want to schedule a session with: ");
        const date = await prompt("Enter date of session (YYYY-MM-DD): ");
        const time = await prompt("Enter time of session (HH:MM): ");
        const memberID = await prompt("Enter your Member ID: "); 
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
        await client.query("DELETE FROM Register WHERE ClassID = $1 AND MemberID = $2;", [classIDCancel, memberID]);
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
    await showMemberDashboard(memberID);
  }
}


async function modifyUserProfile(memberID) {
  console.log("1. Change your name");
  console.log("2. Change your password");
  console.log("3. Change your email address");
  console.log("4. Set new fitness goals");
  console.log("5. Update your weight");

  const options = await prompt("\nEnter your option: ");
  const client = await pool.connect();

  try {
    switch (options) {
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
        const newWeight = await prompt("Enter new Weight: ");
        await client.query("UPDATE Members SET Weight = $1 WHERE MemberID = $2;", [newWeight, memberID]);
        console.log("Weight updated successfully.");
        break;
      default:
        console.log("Invalid option. Please select a valid option.");
        break;
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    client.release();
    await showMemberDashboard(memberID);
  }
}

async function showProfile(memberID) {
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT Name, Email, Goal, Weight, PaymentStatus FROM Members WHERE MemberID = $1;", [memberID]);
      const member = res.rows[0];
      if (member) {
        console.log(`Name: ${member.name}, Email: ${member.email},  Goals: ${member.goal}, Weight: ${member.Weight}, PaymentStatus: ${member.paymentstatus}` );
      } else {
        console.log("\nNo profile information found.");
      }
    } catch (err) {
      console.error('Error executing query', err.stack);
    } finally {
      client.release();
      await showMemberDashboard(memberID);
    }
}
  
async function showTrainerDashboard(trainerID) {
    
    console.log("1. Modify availability");
    console.log("2. View member profiles");
    console.log("3. View your schedule");
    console.log("4. Sign out");

  
  
    const options = await prompt("\nEnter your option: ");
    switch (options) {
      case "1":
        await updateAvailability(trainerID);
        break;
      case "2":
        await showMemberProfiles(trainerID);
        break;
      case "3":
        await showrainerSchedules(trainerID);
        break;
      case "4":
        main(); 
        break;
      default:
        console.log("\nInvalid option. Please try again.");
        await showTrainerDashboard(trainerID);
    }
  }

  async function showrainerSchedules(trainerID) {
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
      await showTrainerDashboard(trainerID);
    }
  }

  async function updateAvailability(trainerID) {
    const availability = await prompt("Enter your availability: ");
    const client = await pool.connect();
    try {
      await client.query("UPDATE Trainer SET AvailableTimes = $1 WHERE TrainerID = $2;", [availability, trainerID]);
      console.log("Availability updated successfully.");
    } catch (err) {
      console.error('Error executing query', err.stack);
    } finally {
      client.release();
      await showTrainerDashboard(trainerID);
    }
  }

  async function showMemberProfiles(trainerID) {
    const memberName = await prompt("Enter name of member to be searched: ");
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT MemberID, Name, Email, goal, Weight, PaymentStatus FROM Members WHERE Name = $1;", [memberName]);
      const members = res.rows;
      if (members.length > 0) {
        console.log("Member profiles found:");
        members.forEach(member => {
          console.log(`Member ID: ${member.memberid}, Name: ${member.name}, Email: ${member.email}, Goal: ${member.goal}, Weight: ${member.Weight}, Payment Status: ${member.paymentstatus}`);
        });
      } else {
        console.log("Member not found.");
      }
    } catch (err) {
      console.error('Error executing query', err.stack);
    } finally {
      client.release();
      await showTrainerDashboard(trainerID);
    }
  }
  


  async function displayAdminDashboard(staffID) {
    console.log("1. Administer room reservations");
    console.log("2. Display room bookings");
    console.log("3. Display room details");
    console.log("4. Modify equipment status");
    console.log("5. Check equipment status");
    console.log("6. Organize group fitness class timetables");
    console.log("7. View all classes");
    console.log("8. Manage billing");
    console.log("9. Sign out");

  
    const options = await prompt("\nEnter your option: ");
    switch (options) {
      case "1":
        await manageRoomBookings(staffID);
        break;
      case "2":
        await showRoomBookings(staffID);
        break;
      case "3":
        await showRoomInformation(staffID);
        break;
      case "4":
        await manageEquipment(staffID);
        break;
      case "5":
        await monitorEquipment(staffID);
        break;
      case "6":
        await manageClassSchedules(staffID);
        break;
      case "7":
        await showAllClasses(staffID);
        break;
      case "8":
        await billing(staffID);
        break;
      case "9":
        main(); 
        break;
      default:
        console.log("\nInvalid option. Please try again.");
        await displayAdminDashboard(staffID);
    }
  }

  async function showAllClasses(staffID) {
  console.log("1. Group Classes");
  console.log("2. Personal Classes");

  const options = await prompt("\nEnter your option: ");
  const client = await pool.connect();
  try {
    if (options === "1") {
      const { rows: classes } = await client.query("SELECT * FROM Fitness_Class;");
      console.log("Group Classes:");
      classes.forEach(cls => {
        console.log(`Class ID: ${cls.classid}, Schedule: ${cls.schedule}, Room ID: ${cls.RoomID}, Trainer ID: ${cls.trainerid}`);
      });
    } else if (options === "2") {
      const { rows: sessions } = await client.query("SELECT * FROM Training;");
      console.log("Personal Classes:");
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
    await displayAdminDashboard(staffID);
  }
}

async function showRoomBookings(staffID) {
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
      await displayAdminDashboard(staffID);
    }
}
  

async function showRoomInformation(staffID) {
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
      await displayAdminDashboard(staffID);
    }
  }


async function manageRoomBookings(staffID) {
  console.log("1. Modify room details");
  console.log("2. Adjust room assignments for fitness classes");
  console.log("3. Remove a fitness class reservation");

  const options = await prompt("\nEnter your option: ");
  const client = await pool.connect();
  try {
    switch (options) {
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
    await displayAdminDashboard(staffID);
  }
}


async function manageEquipment(staffID) {
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
      await displayAdminDashboard(staffID);
    }
  }

  
async function monitorEquipment(staffID) {
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
    await displayAdminDashboard(staffID);
  }
}


async function manageClassSchedules(staffID) {
  console.log("1. Create a new group fitness class");
  console.log("2. Edit a group fitness class");
  console.log("3. Discontinue a group fitness class");
  console.log("4. Modify a training session");
  console.log("5. Withdraw from a training session");


  const options = await prompt("\nEnter your option: ");
  const client = await pool.connect();
  try {
    switch (options) {
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
    await displayAdminDashboard(staffID);
  }
}

async function login() {
  console.log("1. Login as Member");
  console.log("2. Login as Trainer");
  console.log("3. Login as Admin");

  const options = await prompt("\nEnter your option: ");
  switch (options.trim()) {
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
      await showMemberDashboard(member.memberid);
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
      await showTrainerDashboard(trainer.trainerid); 
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
      await displayAdminDashboard(admin.staffid); 
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
      const weight = await prompt("Enter Weight: ");

      const client = await pool.connect();
      try {
          await client.query("BEGIN");
          await client.query(
              "INSERT INTO Members (Name, Email, Password, Goal, Weight, PaymentStatus) VALUES ($1, $2, $3, $4, $5, 'Pending');",
              [name, email, password, goals, weight]
          );
          const res = await client.query(
              "SELECT MemberID FROM Members WHERE Email = $1;",
              [email]
          );
          await client.query("COMMIT");
          const memberID = res.rows[0]?.memberid; 
          if (memberID) {
              console.log("\nUser registered successfully.");
              await showMemberDashboard(memberID); 
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

    const options = await prompt("\nWhat would you like to do? ");
    switch (options.trim()) {
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