# Chat XMPP
## Project Description

- The project is an XMPP chat client written in Node.js.
- It allows users to communicate with others in real-time via the @alumchat.xyz server on port 5222.

## Functionalities

Account Management:

- Register a new user account.
- Log in to an existing user account.
- Log out from the current user account.
- Delete an existing user account.

Contact Management:

- Retrieve and display all contacts in the user's roster, along with their presence status and status messages.
- Add a new contact to the roster.
- Retrieve contact information for a specified user.
- Handle contact subscription requests by accepting or rejecting them.

Messaging:

- Send direct one-on-one messages to a specified user.
- Participate in group chat conversations by sending messages to a specified group.
- Receive real-time notifications for incoming messages.
- Group Chat Management:

Create a new group chat.
- Invite users to join a group chat.
- Join an existing group chat.
- Handle group chat invitations by accepting or rejecting them.

Presence Management:

- Set the user's presence status and status message.

File Transfers:

- Send files to a specified user.
- Receive files from other users.

Notifications:

- Receive real-time notifications for incoming friend requests, group invitations, and other events.
- View a list of pending notifications.

## Methods Implemented

### Initialization & Connection
- **`initializeFetch()`**: Initializes asynchronous fetch requests.
- **`initiateConnection()`**: Connects to the domain.
- **`handleClose()`**: Handles close events.

### User Prompts & Menus
- **`prompt(question, callback)`**: Utility function to handle asynchronous user input prompts.
- **`mainPage()`**: Creates a main menu for login and registration.
- **`loggedInMenu()`**: Displays options once the user has logged in.
- **`chatMenu()`**: Displays chat options for the user.
- **`chatMenuOptions(option)`**: Submenu for various chat options.
- **`chatRoomsMenu()`**: Displays chat room related options.
- **`notificationsMenu()`**: Menu for notification-related actions.

### Account Management
- **`registerNewUser()`**: Creates a new user.
- **`gatherCredentials()`**: Gathers credentials for login or registration.
- **`sendRegistrationRequest(username, password)`**: Sends a registration request to the server.
- **`loginExistingUser()`**: Logs into an existing account.
- **`logoutSession()`**: Logs out of the current session.
- **`deleteAccount()`**: Deletes the current account.
- **`ifDeleteAccount()`**: Double-checks the intent to delete the account.

### Message Handling
- **`chatWithContact()`**: Initiates a chat with a contact from the roster.
- **`chatWithAnyone()`**: Initiates a chat with any user.
- **`startChat(anyJID)`**: Handles the initiation of chat sessions.

### Roster & Contacts
- **`fetchRoster()`**: Fetches the roster of contacts.
- **`handleRoster(stanza)`**: Handles the roster stanza response from the server.
- **`displayRosterListeners(contacts)`**: Displays contacts and their listeners.
- **`requestPresence(contacts)`**: Requests the presence of all contacts in the roster.
- **`checkUsers()`**: Refactored method to check users.
- **`sendFriendRequest(anyJID)`**: Sends a friend request to another user.
- **`acceptFriendRequest(userRequest)`**: Accepts a friend request from another user.
- **`deleteContact(anyJID)`**: Deletes a contact from the user's list.
- **`manageSubscriptions()`**: Manages contact subscriptions (add, delete, check details).
- **`processRosterStanza(stanza, queriedJID)`**: Processes the roster stanza response.
- **`initiateRosterRequest(queriedJID)`**: Sends a roster request to the server.

### Chat Rooms
- **`createChatRoom()`**: Creates a chat room.
- **`listJoinedChatRooms()`**: Lists previously joined chat rooms.
- **`leaveChatRoom()`**: Leaves a previously joined chat room.
- **`joinChatRoom()`**: Joins a chat room.
- **`configureChatRoom(roomJID)`**: Configures settings for a chat room.
- **`joinSpecifiedRoom(roomName)`**: Joins a chat room with the specified JID.
- **`chatInRoom(roomName)`**: Enables message sending in the specified chat room.

### File Handling
- **`requestUploadSlot(filename, filesize)`**: Requests an upload slot from the server.
- **`uploadFile(url, fileData, filename, contentType)`**: Uploads a file to the given URL.
- **`sendFileUrl(to, url)`**: Sends a file URL to a specified user.
- **`sendFile(to, filePath)`**: Sends a file and debugs steps.
- **`sendFileMenu()`**: Submenu for file-sending options.

### Notifications & Status
- **`handleServerResponse(data)`**: Handles server responses after sending a request.
- **`handleError(err)`**: Handles communication errors.
- **`cleanupListeners()`**: Manages and cleans up listeners.
- **`setStatus(show, statusMessage = '')`**: Sets the user's status.
- **`changeOnlineStatus()`**: Allows the user to change their online status.
- **`viewNotifications()`**: Displays user notifications.
- **`toggleMuteNotifications()`**: Mutes or turns on notifications.
- **`deleteNotifications()`**: Deletes notifications.

### Others
- **`closeChat()`**: Closes the current chat session.
- **`aboutTheChat()`**: Provides information about the chat application.


## Technologies Used

- **JavaScript**: The primary language used for the backend and frontend logic of the application.
- **Node.js**: The server-side runtime used to handle backend operations and real-time functionalities.
- **XMPP Protocol**: An extensible messaging and presence protocol used to handle real-time chat and presence functionalities.
- **Stanza.js**: A library to handle XMPP communications in JavaScript.
- **Console Input/Output**: Utilized for the interactive command-line interface.
- **WebSockets**: Used for real-time bidirectional communication between the client and server.
- **File Handling API**: For uploading, downloading, and managing files within the chat.


## Dependencies

The project uses the following dependencies:

- [`@xmpp/client`](https://www.npmjs.com/package/@xmpp/client) - version 0.13.1
- [`@xmpp/xml`](https://www.npmjs.com/package/@xmpp/xml) - version 0.13.1
- [`node-fetch`](https://www.npmjs.com/package/node-fetch) - version 3.3.2
- [`node-xmpp`](https://www.npmjs.com/package/node-xmpp) - version 1.1.0
- [`readline-sync`](https://www.npmjs.com/package/readline-sync) - version 1.4.10


## Installation

1. Clone the repository: https://github.com/DavidDLM/Proyecto-1-Redes
2. Navigate to the AlumChat directory: cd Redes-Chat-Protocolo-XMPP
3. Install the dependencies: npm install

### Usage
1. Start AlumChat by running: node chat.js
2. Follow the on-screen prompts to register or log in.
3. Use the sub-menu options to chat, send files, and more.

## Author
- Name: [Mario de León]
- Email: [mariodeleonm1@gmail.com]
- GitHub: [(https://github.com/DavidDLM)]
