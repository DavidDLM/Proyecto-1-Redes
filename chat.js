process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { client } = require('@xmpp/client');
const net = require("net");
const cliente = new net.Socket();
const readlineSync = require('readline-sync'); // Importing readline-sync package
const { xml } = require('@xmpp/client');
let xmpp; // Global variable for the XMPP client.
const rl = require('readline'); // Add this import for the asynchronous readline.

const readlineInterface = rl.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Defining login credentials
const username = "dele19019";
const password = "1234";
const domain = 'alumchat.xyz';

// Utility function to handle asynchronous user input prompts
function prompt(question, callback) {
    readlineInterface.question(question, (answer) => {
        callback(answer);
    });
}

function mainPage() {
    console.log("\nMain Menu");
    console.log("1. Register New User");
    console.log("2. Login Existing User");
    console.log("3. Exit");
    console.log("4. About the chat");

    prompt('Choose an option (1, 2, 3, 4): ', (input) => {
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
    });
}

//**********************************************/
//************ REGISTER SECTION ****************/

function registerNewUser() {
    console.log("Registering new user.");

    // Initiates a connection with the server.
    initiateConnection();

    // Gathers username and password from the user.
    gatherCredentials();

    // Listens for data, close, and error events from the server.
    cliente.on('data', handleServerResponse);
    cliente.on('close', handleClose);
    cliente.on('error', handleError);
}

function initiateConnection() {
    // Connection
    cliente.connect(5222, 'alumchat.xyz', function () {
        cliente.write("<stream:stream to='alumchat.xyz' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>");
    });
}

function gatherCredentials() {
    prompt("Username: ", (username) => {
        prompt("Password: ", (password) => {
            sendRegistrationRequest(username, password);
        });
    });
}

function sendRegistrationRequest(username, password) {
    // Constructs XML registration request and sends to server.
    const xmlRegister = `
        <iq type="set" id="reg_1" mechanism='PLAIN'>
            <query xmlns="jabber:iq:register">
                <username>${username}</username>
                <password>${password}</password>
            </query>
        </iq>
    `;
    cliente.write(xmlRegister);
}

function handleServerResponse(data) {
    // Handles server's response after registration request.
    if (data.toString().includes('<stream:features>')) return;
    if (data.toString().includes('<iq type="result"')) {
        console.log('Registration successful');
        cleanupListeners();
        mainPage();
    } else if (data.toString().includes('<iq type="error"')) {
        console.log('Error while registering:', data.toString());
    }
}

function handleClose() {
    // Handles the close event of the connection.
    console.log('Connection closed');
    cleanupListeners();
}

function handleError(err) {
    // Handles the error event of the connection.
    console.log('Error occurred:', err.message);
    cleanupListeners();
}

function cleanupListeners() {
    // Removes listeners to avoid potential memory leaks.
    cliente.removeListener('data', handleServerResponse);
    cliente.removeListener('close', handleClose);
    cliente.removeListener('error', handleError);
}

//**********************************************/
//*************** LOGIN SECTION ****************/

function loginExistingUser() {
    console.log("Logging in existing user...");

    if (xmpp && (xmpp.status === 'online' || xmpp.status === 'connecting')) {
        console.log('You are already logged in or connecting.');
        return;
    }

    // Disabling the TLS/SSL certificate verification - Use with caution! Only for testing.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // Using xmpp:// protocol
    xmpp = client({
        service: 'xmpp://alumchat.xyz:5222',
        domain: domain,
        resource: 'example',
        username: username,
        password: password,
        // Incorporating the 'terminal' option
        terminal: true,
        // Including the TLS settings
        tls: {
            rejectUnauthorized: false
        }
    });

    xmpp.on('error', (err) => {
        console.error('Something went wrong:', err);
    });

    xmpp.on('offline', () => {
        console.log('You are offline now.');
    });

    xmpp.on('online', async (jid) => {
        console.log(`Logged in as ${jid.toString()}`);
        loggedInMenu();
    });

    xmpp.on('stanza', async (stanza) => {
        if (stanza.is('message')) {
            // Handle the message...
        }
    });

    xmpp.start().catch(console.error);
}

function loggedInMenu() {
    console.log("\nLogged In Menu:");
    console.log("1. Check online users");
    console.log("2. Exit");

    prompt('Choose an option (1, 2): ', (answer) => {
        switch (answer) {
            case '1':
                checkOnlineUsers();
                break;
            case '2':
                console.log('Exiting.');
                xmpp.stop();
                process.exit();
                break;
            default:
                console.log("Invalid option.");
                loggedInMenu();
                break;
        }
    });
}

let contacts = []; // Store the contacts here

function checkOnlineUsers() {

}

//**********************************************/
//**************** EXIT SECTION ****************/

function closeChat() {
    console.log("Closing chat");
    // Then, close the connection with the server (if necessary)
    if (cliente) { cliente.end(); }
    console.log("Chat closed. Goodbye!");
    process.exit(); // Exiting the process
}

//**********************************************/

//**********************************************/
//*************** ABOUT SECTION ****************/

function aboutTheChat() {
    console.log("\nAbout the AlumChat:");
    console.log("-------------------------------");
    console.log("AlumChat is a secure chat platform built on top of the XMPP protocol.");
    console.log("Some features include end-to-end encryption, group chats, and offline messaging.");
    console.log("-------------------------------\n");

    // Redirecting the user back to the main page after showing the about info
    mainPage();
}

//**********************************************/

mainPage(); // Start the main page loop
