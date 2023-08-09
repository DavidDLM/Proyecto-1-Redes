const client = require('node-xmpp-client');

// XMPP instance
const cliente = new client({
  jid: 'david@alumchat.xyz',
  password: '1234abcd'
});

// Good connection
cliente.on('online', function() {
  console.log('Conexión exitosa');
});

// Error event
cliente.on('error', function(error) {
  console.error('Error de conexión:', error);
});

// Connect
cliente.connect();

// Close
cliente.on('close', function() {
  console.log('Conexión cerrada');
});
