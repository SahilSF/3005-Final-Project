import pkg from 'pg';
const { Pool } = pkg;


// Database connection parameters
const DB_NAME = "Gym";
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
    
    const classRes = await client.query(`SELECT FC.ClassID, FC.Schedule, FC.TrainerID FROM Fitness_Class FC JOIN Register R ON FC.ClassID = R.ClassID WHERE R.MemberID = $1;`, [memberID]);
    const classes = classRes.rows;
    if (classes.length > 0) {
      console.log("\nUpcoming Group Classes:");
      classes.forEach(cls => {
        console.log(`Class ID: ${cls.classid}, Schedule: ${cls.schedule}, Trainer ID: ${cls.trainerid}`);
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
        const trainerID = await prompt("Enter ID of trainer whose class you want to register for: ");
        const classRes = await client.query("SELECT ClassID, Schedule FROM Fitness_Class WHERE TrainerID = $1;", [trainerID]);
        if (classRes.rows.length > 0) {
          classRes.rows.forEach(cls => {
            console.log(`Class ID: ${cls.classid}, Schedule: ${cls.schedule}`);
          });
          const classID = await prompt("Enter Class ID from the above list to register: ");
          await client.query("INSERT INTO Register (MemberID, ClassID, Session) VALUES ($1, $2, $3);", [memberID, classID, "Session detail"]);
          console.log("Registration successful.");
        } else {
          console.log("No available classes for this trainer.");
        }
        break;
      case "2":
        const res = await client.query("SELECT TrainerID, Name, Specialization FROM Trainer;");
        const sessions = res.rows;
        if (sessions.length > 0) {
          console.log("Available trainers:");
          sessions.forEach(session => {
            console.log(`${session.trainerid}: ${session.name}, Specialization: ${session.specialization}`);
          });
          const selectedTrainerID = await prompt("Enter ID of the trainer you want to schedule a session with: ");
          const date = await prompt("Enter date of session (YYYY-MM-DD): ");
          const time = await prompt("Enter time of session (HH:MM): ");
          await client.query("INSERT INTO Training (Date, Time, MemberID, TrainerID) VALUES ($1, $2, $3, $4);", [date, time, memberID, selectedTrainerID]);
          console.log("Session scheduled successfully.");
        } else {
          console.log("No trainers available.");
        }
        break;
      case "3":
        const sessionIDReschedule = await prompt("Enter ID of session to be rescheduled: ");
        const newDate = await prompt("Enter new date (YYYY-MM-DD): ");
        const newTime = await prompt("Enter new time (HH:MM): ");
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
      await modifyAvailability(trainerID);
      break;
    case "2":
      await showMemberProfiles(trainerID);
      break;
    case "3":
      await showTrainerSchedules(trainerID);
      break;
    case "4":
      console.log("Signing out...");
      await main();
      break;
    default:
      console.log("\nInvalid option. Please try again.");
      await showTrainerDashboard(trainerID);
  }
}

async function modifyAvailability(trainerID) {
  console.log("Displaying current schedules to infer availability.");
  const client = await pool.connect();
  try {
      const trainingSessions = await client.query("SELECT Date, Time FROM Training WHERE TrainerID = $1;", [trainerID]);
      console.log("Current Training Sessions:");
      if (trainingSessions.rows.length > 0) {
          trainingSessions.rows.forEach(session => {
              console.log(`Date: ${session.date}, Time: ${session.time}`);
          });
      } else {
          console.log("No training sessions found.");
      }

      const fitnessClasses = await client.query("SELECT Schedule FROM Fitness_Class WHERE TrainerID = $1;", [trainerID]);
      console.log("Current Fitness Class Schedules:");
      if (fitnessClasses.rows.length > 0) {
          fitnessClasses.rows.forEach(cls => {
              console.log(`Schedule: ${cls.schedule}`);
          });
      } else {
          console.log("No fitness classes found.");
      }

      console.log("Note: Trainer is assumed to be available outside of the above times.");
  } catch (err) {
      console.error('Error executing query', err.stack);
  } finally {
      client.release();
      await showTrainerDashboard(trainerID);
  }
}


async function showTrainerSchedules(trainerID) {
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
              console.log(`Class ID: ${cls.classid}, Schedule: ${cls.schedule}, Room ID: ${cls.roomid}`);
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

async function showMemberProfiles(trainerID) {
  const memberName = await prompt("Enter name of member to be searched: ");
  const client = await pool.connect();
  try {
      const res = await client.query("SELECT MemberID, Name, Email, Goal, Weight, PaymentStatus FROM Members WHERE Name = $1;", [memberName]);
      const members = res.rows;
      if (members.length > 0) {
          console.log("Member profiles found:");
          members.forEach(member => {
              console.log(`Member ID: ${member.memberid}, Name: ${member.name}, Email: ${member.email}, Goal: ${member.goal}, Weight: ${member.weight}, Payment Status: ${member.paymentstatus}`);
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
    console.log("1. Display room bookings");
    console.log("2. Equipment Maintenance Monitoring");
    console.log("3. Class Schedule Updating");
    console.log("4. Manage Billing");
    console.log("5. Sign out");

    const options = await prompt("\nEnter your option: ");
    switch (options) {
        case "1":
            await showRoomBookings(staffID);
            break;
        case "2":
            await monitorEquipment(staffID);
            break;
        case "3":
            await updateClassSchedule(staffID);
            break;
        case "4":
            await manageBilling(staffID);
            break;
        case "5":
            console.log("Exiting...");
            await main();
            break;
        default:
            console.log("\nInvalid option. Please try again.");
            await displayAdminDashboard(staffID);
    }
}

async function showRoomBookings(staffID) {
    const client = await pool.connect();
    try {
        const { rows: bookings } = await client.query("SELECT ClassID, Schedule, RoomID, TrainerID FROM Fitness_Class;");
        console.log("Room bookings for classes:");
        bookings.forEach(booking => {
            console.log(`Class ID: ${booking.classid}, Schedule: ${booking.schedule}, Room ID: ${booking.roomid}, Trainer ID: ${booking.trainerid}`);
        });
    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        client.release();
        await displayAdminDashboard(staffID);
    }
}

async function monitorEquipment(staffID) {
    const client = await pool.connect();
    try {
        const { rows: equipment } = await client.query("SELECT EquipmentID, Status FROM Equipment;");
        console.log("Equipment status:");
        equipment.forEach(eq => {
            console.log(`Equipment ID: ${eq.equipmentid}, Status: ${eq.status}`);
        });
    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        client.release();
        await displayAdminDashboard(staffID);
    }
}

async function updateClassSchedule(staffID) {
    const classID = await prompt("Enter Class ID to update schedule: ");
    const newSchedule = await prompt("Enter new schedule (integer value): ");
    const client = await pool.connect();
    try {
        await client.query("UPDATE Fitness_Class SET Schedule = $1 WHERE ClassID = $2;", [newSchedule, classID]);
        console.log("Class schedule updated successfully.");
    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        client.release();
        await displayAdminDashboard(staffID);
    }
}

async function manageBilling(staffID) {
    const client = await pool.connect();
    try {
        const members = await client.query("SELECT MemberID, Name, PaymentStatus FROM Members;");
        if (members.rows.length > 0) {
            members.rows.forEach(member => {
                console.log(`Member ID: ${member.memberid}, Name: ${member.name}, Current Payment Status: ${member.paymentstatus}`);
            });

            const memberID = await prompt("Enter Member ID to update payment status: ");
            const newPaymentStatus = await prompt("Enter new payment status (Paid or Unpaid): ");

            if (newPaymentStatus.toLowerCase() !== 'paid' && newPaymentStatus.toLowerCase() !== 'unpaid') {
                console.log("Invalid payment status entered. Please enter 'Paid' or 'Unpaid'.");
                return;
            }

            await client.query("UPDATE Members SET PaymentStatus = $1 WHERE MemberID = $2;", [newPaymentStatus, memberID]);
            console.log("Payment status updated successfully for Member ID:", memberID);
        } else {
            console.log("No members found.");
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
            process.exit(0);
    }
}

main().catch(err => {
    console.error('Startup error:', err);
    rl.close();
});