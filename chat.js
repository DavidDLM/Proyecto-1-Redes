process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { client } = require('@xmpp/client');
const net = require("net");
const cliente = new net.Socket();
const readlineSync = require('readline-sync'); // Importing readline-sync package
const { xml } = require('@xmpp/client');
let xmpp; // Global variable for the XMPP client.
const rl = require('readline'); // Add this import for the asynchronous readline.
let contacts = [];  // This stores the contacts after fetch the roster
let manualLogout = false;

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
        console.error('Error occurred:', err);
        if (err && err.condition === 'not-authorized') {
            console.log('Account doesn\'t exist or wrong credentials provided.');
        } else {
            console.log('An unexpected error occurred. Please try again later.');
        }
        mainPage();  // Redirect back to main menu for user convenience.
    });

    xmpp.on('offline', () => {
        if (!manualLogout) {
            console.log('You are offline now.');
        }
        manualLogout = false;  // Reset the flag
    });

    // Start a timeout to check for prolonged inactivity
    const timeoutDuration = 10000;  // 10 seconds
    const timeoutID = setTimeout(() => {
        console.error('Connection timed out. Please try again later.');
        xmpp.stop();  // Stop the current XMPP session
        mainPage();  // Return to the main menu
    }, timeoutDuration);

    xmpp.on('online', async (jid) => {
        clearTimeout(timeoutID);  // Clear the timeout if we successfully connect
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
    console.log("2. Change online status");
    console.log('3. Delete Account');
    console.log("4. Logout");

    prompt('Choose an option (1, 2, 3, 4): ', (answer) => {
        switch (answer) {
            case '1':
                checkOnlineUsers();  // Checks online users
                break;
            case '2':
                changeOnlineStatus();
                break;
            case '3':
                deleteAccount();
                break;
            case '4':
                logoutSession();
                break;
            default:
                console.log("Invalid option.");
                loggedInMenu();
                break;
        }
    });
}

// Logout
function logoutSession() {
    if (xmpp) {
        manualLogout = true;
        xmpp.stop();  // This will disconnect the client
        xmpp = null;  // Reset the client instance
    }
    console.log("Logged out successfully.");
    mainPage();  // Display the very first menu
}

// Function to fetch the roster
function fetchRoster() {
    console.log("Fetching online users.");

    const rosterRequest = xml(
        'iq',
        { type: 'get', id: 'roster' },
        xml('query', { xmlns: 'jabber:iq:roster' })
    );

    xmpp.send(rosterRequest);
}

// Function to handle the roster response
function handleRoster(stanza) {
    if (stanza.is('iq') && stanza.attrs.type === 'result') {
        const query = stanza.getChild('query', 'jabber:iq:roster');
        contacts = query.getChildren('item');

        // Display the roster and set up presence listeners
        displayRosterListeners(contacts);

        // Request presence info for all contacts
        requestPresence(contacts);

        // Return to the main menu
        loggedInMenu();
    }
}

// Function to display the roster and set up presence listeners
function displayRosterListeners(contacts) {
    xmpp.on('presence', (presence) => {
        const from = presence.attrs.from;
        const contact = contacts.find(c => c.attrs.jid === from);

        if (!contact) return;

        if (!presence.attrs.type || presence.attrs.type === 'available') {
            console.log(`${from} is online`);
        } else if (presence.attrs.type === 'unavailable') {
            console.log(`${from} is offline`);
        }
    });
}

// Function to request presence for all contacts
function requestPresence(contacts) {
    contacts.forEach((contact) => {
        const jid = contact.attrs.jid;
        const presenceRequest = xml('presence', { to: jid });
        xmpp.send(presenceRequest);
    });
}

// The refactored checkOnlineUsers function
function checkOnlineUsers() {
    fetchRoster();
    xmpp.once('stanza', handleRoster);
}

function deleteAccount() {
    prompt("Are you sure you want to delete your account? (yes/no) ", (answer) => {
        if (answer.toLowerCase() === 'yes') {
            ifDeleteAccount();
            console.log("Account deleted successfully. Exiting...");
            readlineInterface.close();
            process.exit();  // This will terminate the application.
        } else {
            console.log('Account deletion canceled.');
            loggedInMenu();
        }
    });
}

function ifDeleteAccount() {
    console.log('Deleting account...');

    // Create the IQ stanza for account deletion.
    const deleteStanza = xml(
        'iq',
        { type: 'set', from: `${username}@${domain}`, id: 'delete1' },
        xml('query', { xmlns: 'jabber:iq:register' },
            xml('remove')
        )
    );

    xmpp.send(deleteStanza);

    // Handling the server's response
    xmpp.once('stanza', (stanza) => {
        if (stanza.is('iq') && stanza.attrs.id === 'delete1') {
            if (stanza.attrs.type === 'result') {
                console.log('Account successfully deleted!');
                // Instead of going to loggedInMenu, exit.
                console.log('Goodbye!');
                xmpp.stop();
                rl.close(); // Close the readline interface
                process.exit(0); // Exit the application
            } else if (stanza.attrs.type === 'error') {
                console.error('Error deleting account:', stanza.toString());
                loggedInMenu();
            }
        }
    });
}

function setStatus(show, statusMessage = '') {
    const presenceXML = xml(
        'presence',
        {},
        xml('show', {}, show),
        xml('status', {}, statusMessage)
    );

    xmpp.send(presenceXML).then(() => {
        console.log(`Status updated to: ${show} ${statusMessage}`);
        loggedInMenu();
    }).catch((err) => {
        console.error('Error while updating status:', err);
        loggedInMenu();
    });
}

function changeOnlineStatus() {
    console.log('Choose your online status:');
    console.log('1. Online');
    console.log('2. Away');
    console.log('3. Do not disturb');
    console.log('4. Set custom message');
    console.log('5. Go back to the previous menu');

    prompt("Enter your choice (1-5): ", (answer) => {
        switch (answer) {
            case '1':
                setStatus('online');
                break;
            case '2':
                setStatus('away');
                break;
            case '3':
                setStatus('dnd');
                break;
            case '4':
                prompt("Enter your custom message: ", (customMessage) => {
                    setStatus('online', customMessage);
                });
                break;
            default:
                loggedInMenu();
                break;
        }
    });
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
