process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { client } = require('@xmpp/client');
const net = require("net");
const cliente = new net.Socket();
const readlineSync = require('readline-sync'); // Importing readline-sync package

// Defining login credentials
const username = "David@alumchat.xyz";
const password = "1234";
const domain = "alumchat.xyz";

function mainPage() {
    console.log("\nMain Menu");
    console.log("1. Register New User");
    console.log("2. Login Existing User");
    console.log("3. Exit");
    console.log("4. About the chat");

    const input = readlineSync.question('Choose an option (1, 2, 3, 4): ');

    switch (input) {
        case '1':
            registerNewUser();
            break;
        case '2':
            loginExistingUser();
            break;
        case '3':
            closeChat();
            break;
        case '4':
            aboutTheChat();
            break;
        default:
            console.log("Invalid option.");
            mainPage();
            break;
    }
}

function registerNewUser() {
    console.log("Registering new user...");


}

function loginExistingUser() {
    console.log("Logging in existing user...");
    // Add your login logic here
}

function closeChat() {
    console.log("Closing chat");

    // Close the connection with the server
    if (cliente) {
        cliente.end();
    }

    console.log("Chat closed. Goodbye!");
    process.exit(); // Exiting the process
}

function aboutTheChat() {
    console.log("\nAbout the AlumChat:");
    console.log("-------------------------------");
    console.log("AlumChat is a secure chat platform built on top of the XMPP protocol.");
    console.log("Some features include end-to-end encryption, group chats, and offline messaging.");
    console.log("-------------------------------\n");

    // Redirecting the user back to the main page after showing the about info
    mainPage();
}

mainPage(); // Start the main page loop
