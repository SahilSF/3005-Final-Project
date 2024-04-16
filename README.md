# Sahil's GYM Management System

This Node.js application is designed to manage the operations of Sahil's GYM, facilitating various functionalities for members, trainers, and admin staff.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed Node.js. You can download it from [nodejs.org](https://nodejs.org/).
- You have installed PostgreSQL on your computer.
- You have set up the PostgreSQL database with the necessary tables and data.

## Installation

1. Clone the repository to your local machine:


2. Navigate to the cloned directory:


3. Install the necessary Node.js dependencies:
   
   npm install

## Running the Application

1. To run the application, use the following command:
    
    Copy code
    
    `node app.js`
    
2. Follow the on-screen prompts to interact with the application.

# Functionality Walkthrough of the Gym Management System

This document provides a detailed walkthrough of the functionalities available in the Gym Management System. Each section corresponds to different user roles and the actions they can perform through the interactive command-line interface.

## General Flow

1. **Starting the Application:**
   - When the application starts, users are greeted with options to either log in, register, or exit the program.

2. **Main Options:**
   - `1. Login`: Allows existing members, trainers, or admins to log into the system using their credentials.
   - `2. Register`: New users can create a member account providing details like name, email, password, fitness goals, and weight.
   - `3. Exit`: Closes the application.

## Member Dashboard

After logging in as a member, the following options are available:

1. **Edit Profile Information:**
   - Members can update their personal information, including name, password, email address, fitness goals, and weight.

2. **Schedule Management:**
   - Members can book group or personal classes, reschedule personal training sessions, or cancel any scheduled sessions.

3. **Display Profile Information:**
   - Displays detailed profile information including goals, weight, and payment status.

4. **See Future Schedules:**
   - Members can view upcoming training sessions and group classes they are registered for.

5. **Sign Out:**
   - Logs out the member and returns to the main menu.

## Trainer Dashboard

After logging in as a trainer, the following options are presented:

1. **Modify Availability:**
   - Trainers can update their availability by modifying existing schedules.

2. **View Member Profiles:**
   - Allows trainers to search and view profiles of members including their fitness goals and status.

3. **View Your Schedule:**
   - Trainers can view all upcoming personal training sessions and group fitness classes they are conducting.

4. **Sign Out:**
   - Logs out the trainer and returns to the main menu.

## Admin Dashboard

After logging in as an admin, the following options are available:

1. **Display Room Bookings:**
   - Admins can view all room bookings for the classes to manage space efficiently.

2. **Equipment Maintenance Monitoring:**
   - Displays the current status of gym equipment and allows for updates to ensure proper maintenance.

3. **Class Schedule Updating:**
   - Admins can update the schedule of any classes as needed.

4. **Manage Billing:**
   - Allows admins to update the payment status of members, ensuring all financial transactions are up-to-date.

5. **Sign Out:**
   - Logs out the admin and returns to the main menu.
