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
let userStatuses = {};
let subscriptions = []; // This will store the JIDs of users who have sent you a friend request.
let pendingFriendRequests = [];
let notificationInterval;  // Declare a variable to store the interval ID
let notifications = [];  // Declare an array to store notifications

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
        clearInterval(notificationInterval);  // Stop the notification interval when the user goes offline
    });

    // Start a timeout to check for prolonged inactivity
    const timeoutDuration = 10000;  // 10 seconds
    const timeoutID = setTimeout(() => {
        console.error('Connection timed out. Please try again later.');
        xmpp.stop();  // Stop the current XMPP session
        mainPage();  // Return to the main menu
    }, timeoutDuration);

    xmpp.on('online', async (jid) => {
        clearTimeout(timeoutID);
        console.log(`Logged in as ${jid.toString()}`);
        loggedInMenu();

        // Start a notification interval when the user logs in
        notificationInterval = setInterval(() => {
            if (notifications.length > 0) {
                console.log("You have new notifications. Go to the Notifications section to read them.");
            }
        }, 20000);  // Check for new notifications every 20 seconds

        // Listen for incoming stanzas
        xmpp.on('stanza', async (stanza) => {
            const sender = stanza.attrs.from;
            if (stanza.is('presence') && stanza.attrs.type === 'subscribe') {
                subscriptions.push(sender); // Store the JID of the user who sent the request.
                console.log(`Received a new subscription request from ${sender}.`); // Notify the user in real-time.

                // Add a new notification for the subscription request
                notifications.push({
                    type: 'subscription request',
                    sender: sender,
                    text: 'Subscription request',
                    timestamp: new Date()
                });
            } else if (stanza.is('message') && stanza.attrs.type === 'chat') {
                const body = stanza.getChildText('body');
                if (body) {
                    console.log(`${sender}: ${body}`);

                    // Add a new notification for the chat message
                    notifications.push({
                        type: 'message',
                        sender: sender,
                        text: body,
                        timestamp: new Date()
                    });
                }
            }
        });
    });

    xmpp.start().catch(console.error);
}

// Log in menu
function loggedInMenu() {
    console.log("\nLogged In Menu:");
    console.log("1. Check users");
    console.log("2. Manage contacts");
    console.log("3. Change online status");
    console.log('4. Delete Account');
    console.log("5. Logout");

    prompt('Choose an option (1-5): ', (answer) => {
        switch (answer) {
            case '1':
                checkUsers();
                break;
            case '2':
                manageSubscriptions()
                break;
            case '3':
                changeOnlineStatus();
                break;
            case '4':
                deleteAccount();
                break;
            case '5':
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

// Log in menu
function loggedInMenu() {
    console.log("\nLogged In Menu:");
    console.log("1. Check users");
    console.log("2. Manage contacts");
    console.log("3. Change online status");
    console.log("4. Chats");
    console.log("5. Notifications");  // New option
    console.log('6. Delete Account');
    console.log("7. Logout");  // Updated option number

    prompt('Choose an option (1-7): ', (answer) => {
        switch (answer) {
            case '1':
                checkUsers();
                break;
            case '2':
                manageSubscriptions()
                break;
            case '3':
                changeOnlineStatus();
                break;
            case '4':
                chatMenu();
                break;
            case '5':  // Notifications option
                viewNotifications();
                break;
            case '6':
                deleteAccount();
                break;
            case '7':  // Updated case number for the Logout option
                logoutSession();
                break;
            default:
                console.log("Invalid option.");
                loggedInMenu();
                break;
        }
    });
}

// ***************************************

// The chat menu that displays the options for the user
function chatMenu() {
    console.log("\nChat Menu:");
    console.log("1. Chat with a contact");
    console.log("2. Chat with anyone");
    console.log("3. Go back to the main menu");
    prompt('Choose an option (1-3): ', chatMenuOptions);
}

function chatMenuOptions(option) {
    switch (option) {
        case '1':
            chatWithContact();
            break;
        case '2':
            chatWithAnyone();
            break;
        case '3':
            loggedInMenu();
            break;
        default:
            console.log("Invalid option.");
            chatMenu();
            break;
    }
}

// Chat with contact
function chatWithContact() {
    prompt("Enter the JID or name of the contact you want to chat with: ", (contactJID) => {
        startChat(`${contactJID}@alumchat.xyz`);
    });
}

// Chat with anyone
function chatWithAnyone() {
    prompt("Enter the JID of the user you want to chat with: ", (anyJID) => {
        startChat(anyJID);
    });
}

// Function to handle outgoing messages
function startChat(anyJID) {
    console.log(`Starting chat with: ${anyJID}`);

    // Function to handle outgoing messages
    async function handleOutgoingMessages(message) {
        const text = xml(
            'message',
            { type: 'chat', to: anyJID },
            xml('body', {}, message),
        );
        await xmpp.send(text);
    }

    // Message handling function
    function sendMessage() {
        prompt('Send a message: ', async (message) => {
            if (message.trim() === './exit') {
                console.log('Chat ended.');
                chatMenu(); // Go back to the chat menu after ending the conversation
            } else {
                await handleOutgoingMessages(message);
                sendMessage(); // Prompt for the next message
            }
        });
    }

    sendMessage();
}

// ***************************************

// Function to fetch the roster
function fetchRoster() {
    console.log("Fetching users.");

    const rosterRequest = xml(
        'iq',
        { type: 'get', id: 'roster' },
        xml('query', { xmlns: 'jabber:iq:roster' })
    );

    xmpp.send(rosterRequest);
}

// Function to fetch the contacts
async function fetchContacts() {
    const contacts = [];
    const rosterIQ = xml(
        'iq',
        { type: 'get', id: 'roster_1' },
        xml('query', { xmlns: 'jabber:iq:roster' })
    );

    try {
        const response = await xmpp.send(rosterIQ);

        console.log("XMPP Roster Response:", response); // Logging for debug purposes

        if (response && response.children) {
            response.children.forEach(child => {
                if (child.is('item')) {
                    contacts.push(child.attrs.jid);
                }
            });
        }
        return contacts;
    } catch (error) {
        console.error("Error fetching contacts:", error);
        throw error; // Re-throwing the error so that you can catch it outside
    }
}

// Function to handle the roster response and display contact statuses
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

function displayRosterListeners(contacts) {
    // Initialize the user statuses with 'offline'.
    contacts.forEach(contact => {
        userStatuses[contact.attrs.jid] = 'offline';
    });

    xmpp.on('presence', (presence) => {
        const from = presence.attrs.from;
        const contact = contacts.find(c => c.attrs.jid === from);

        if (!contact) return;

        if (!presence.attrs.type || presence.attrs.type === 'available') {
            userStatuses[from] = presence.getChildText('show') || 'available'; // Update the status
        } else if (presence.attrs.type === 'unavailable') {
            userStatuses[from] = 'offline'; // Update the status
        }
    });

    // Display all users with their initial statuses.
    console.log("All users and their status:");
    for (let jid in userStatuses) {
        console.log(`${jid}: ${userStatuses[jid]}`);
    }
}

// Function to request presence for all contacts
function requestPresence(contacts) {
    contacts.forEach((contact) => {
        const jid = contact.attrs.jid;
        const presenceRequest = xml('presence', { to: jid });
        xmpp.send(presenceRequest);
    });
}

// The refactored checkUsers function
function checkUsers() {
    fetchRoster();
    xmpp.once('stanza', handleRoster);
}

// Function to delete current account
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

// Function to double check delete account
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

// Function to set status
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

// Function to change status
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

// Function to send a friend request to another user
function sendFriendRequest(anyJID) {
    anyJID = `${anyJID}@alumchat.xyz`;
    const presence = xml('presence', { to: anyJID, type: 'subscribe' });

    return xmpp.send(presence);
}

// Function to accept a friend request from another user
function acceptFriendRequest(userRequest) {
    const acceptUser = `${userRequest}@alumchat.xyz`;
    const addFriend = subscriptions.find(s => s === acceptUser);

    if (!addFriend) {
        console.log("No friend request found from the specified person.");
        return Promise.reject();
    }

    return xmpp.send(xml('presence', { to: addFriend, type: 'subscribed' })).then(() => {
        const index = subscriptions.indexOf(addFriend);
        if (index > -1) subscriptions.splice(index, 1);
    });
}

// Function to delete a contact from the user's list
function deleteContact(anyJID) {
    anyJID = `${anyJID}@alumchat.xyz`;
    const presence = xml('presence', { to: anyJID, type: 'unsubscribe' });

    return xmpp.send(presence).then(() => {
        // Construct the XML stanza to remove the user from the roster
        const removeRosterIQ = xml(
            'iq',
            { type: 'set', id: 'remove1' },
            xml('query', { xmlns: 'jabber:iq:roster' },
                xml('item', { jid: anyJID, subscription: 'remove' })
            )
        );

        return xmpp.send(removeRosterIQ);
    });
}

// Function to manage contacts: add, delete, check details
function manageSubscriptions() {
    console.log("\nManage Contacts:");
    console.log("1. Add a user to my contacts");
    console.log("2. Accept friend requests");
    console.log("3. Delete a contact");
    console.log("4. View contact details");
    console.log("5. Go back to the main menu");

    prompt("Choose an option (1-5): ", (answer) => {
        switch (answer) {
            case '1':
                prompt("JID of the user you wish to add: ", (anyJID) => {
                    sendFriendRequest(anyJID)
                        .then(() => {
                            console.log(`Friend request sent to ${anyJID}@alumchat.xyz`);
                            manageSubscriptions();
                        })
                        .catch(err => {
                            console.error('Error while sending friend request:', err);
                            manageSubscriptions();
                        });
                });
                break;
            case '2':
                if (subscriptions.length === 0) {
                    console.log("No friend requests to accept.");
                    manageSubscriptions();
                } else {
                    console.log("Received friend requests: ", subscriptions);
                    prompt("Do you want to accept any request? (yes/no): ", (answer) => {
                        if (answer.toLowerCase() === 'yes') {
                            prompt("Enter the name of the person you want to accept: ", (userRequest) => {
                                acceptFriendRequest(userRequest)
                                    .then(() => {
                                        console.log(`Accepted friend request from: ${userRequest}@alumchat.xyz`);
                                        manageSubscriptions();
                                    })
                                    .catch(() => {
                                        manageSubscriptions();
                                    });
                            });
                        } else {
                            manageSubscriptions();
                        }
                    });
                }
                break;
            case '3':
                prompt("JID of the user you wish to delete: ", (anyJID) => {
                    deleteContact(anyJID)
                        .then(() => {
                            console.log(`You have removed ${anyJID}@alumchat.xyz from your contacts.`);
                            manageSubscriptions();
                        })
                        .catch(err => {
                            console.error('Error while deleting contact:', err);
                            manageSubscriptions();
                        });
                });
                break;
            case '4':
                console.log("Provide details for the contact.");
                prompt("Provide the JID or name of the contact: ", (queriedJID) => {
                    initiateRosterRequest(queriedJID);
                });
                break;

            case '5':
                console.log("Navigating back to the main menu.");
                loggedInMenu();
                break;
            default:
                console.log("Invalid option.");
                manageSubscriptions();
                break;
        }
    });
}

// Function to get and display the details of a specific contact
async function displayContactDetails(anyJID) {
    let contacts;
    try {
        contacts = await fetchContacts();
    } catch (error) {
        console.log("This contact does not exist in your roster.");
        return;
    }

    // Check if the user is in contacts
    if (!contacts.includes(`${anyJID}@alumchat.xyz`)) {
        console.log("This contact does not exist in your roster.");
        return;
    }

    // Separate the JID into username and domain.
    let [username, domain] = anyJID.split('@');
    if (!domain) domain = "alumchat.xyz"; // Assign default domain if none

    console.log("\nContact Details:");
    console.log(`Username: ${username}`);
    console.log(`Domain: ${domain}`);

}

// Function to process the roster stanza response from the XMPP server
function processRosterStanza(stanza, queriedJID) {
    if (stanza.is('iq') && stanza.attrs.type === 'result') {
        const queryData = stanza.getChild('query', 'jabber:iq:roster');
        const contactList = queryData.getChildren('item');
        const completeJID = `${queriedJID}@alumchat.xyz`;

        const matchingContact = contactList.find((contact) => contact.attrs.jid === completeJID);

        if (matchingContact) {
            let [contactName, domain] = matchingContact.attrs.jid.split('@');
            console.log(`\nDetails for ${queriedJID}:`);
            console.log(`Username: ${contactName}`);
            console.log(`Domain: ${domain}`);
            // both": You and the contact can see each other's presence status.
            //"from": You can see the contact's presence status, but they cannot see yours.
            //"to": The contact can see your presence status, but you cannot see theirs.
            //"none": Neither you nor the contact can see each other's presence status.
            console.log(`Added contact: ${matchingContact.attrs.subscription}`);
            // Further contact details can be displayed as required
        } else {
            console.log(`\nThe contact ${queriedJID} is not in your roster.`);
        }

        manageSubscriptions();  // Navigate back to the Contact Management menu
    }
}

// Function to send roster request to XMPP server
function initiateRosterRequest(queriedJID) {
    console.log("Roster query dispatched to server.");

    // The event listener is set to 'once' so that it is triggered just one time
    xmpp.once('stanza', (stanza) => processRosterStanza(stanza, queriedJID));

    const rosterQuery = xml(
        'iq',
        { type: 'get', id: 'roster' },
        xml('query', { xmlns: 'jabber:iq:roster' })
    );

    // Sending roster query to server
    xmpp.send(rosterQuery)
        .then(() => {
            console.log('Roster request dispatched to server.');
        })
        .catch((err) => {
            console.error('Error dispatching roster request:', err);
        });
}

// Function to view notifications
function viewNotifications() {
    console.log("\nNotifications:");
    if (notifications.length === 0) {
        console.log("You have no notifications.");
    } else {
        notifications.forEach((notification, index) => {
            console.log(`${index + 1}. ${notification.timestamp.toLocaleTimeString()} - ${notification.sender}: ${notification.text}`);
        });
    }
    loggedInMenu();  // Return to the logged-in menu after viewing notifications
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
