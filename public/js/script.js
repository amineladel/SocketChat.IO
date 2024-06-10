$(document).ready(function() {
    const socket = io({ autoConnect: false });

    $('#registerForm').submit(function(e) {
        e.preventDefault();
        const username = $('#registerUsername').val();
        const password = $('#registerPassword').val();
        const name = $('#registerName').val();
        const email = $('#registerEmail').val();
        $.ajax({
            url: '/api/auth/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, password, name, email }),
            success: function(response) {
                alert('Registration successful!');
            },
            error: function(response) {
                alert('Error registering user');
            }
        });
    });

    $('#loginForm').submit(function(e) {
        e.preventDefault();
        const username = $('#loginUsername').val();
        const password = $('#loginPassword').val();
        $.ajax({
            url: '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, password }),
            success: function(response) {
                const token = response.token;
                localStorage.setItem('jwt', token);
                socket.auth = { token };
                socket.connect();
                $('#authWrapper').hide();
                $('#mainWrapper').show();
            },
            error: function(response) {
                alert('Error logging in');
            }
        });
    });

    // Check if user is already authenticated (OAuth2 session)
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
        localStorage.setItem('jwt', token);
        socket.auth = { token };
        socket.connect();
        $('#authWrapper').hide();
        $('#mainWrapper').show();
    }

    $('#logout').click(function() {
        localStorage.removeItem('jwt');
        socket.disconnect();
        $('#mainWrapper').hide();
        $('#authWrapper').show();
    });

    socket.on('connect_error', (err) => {
        if (err.message !== 'Authentication error') {
            console.error(err.message);
        }
    });

    socket.on('initialMessages', (messages) => {
        $('#chatWindow').empty();
        messages.forEach(message => {
            $('#chatWindow').append(`<p><strong>${message.username}</strong>: ${message.message}</p>`);
        });
    });

    socket.on('initialUsers', (users) => {
        updateUsersList(users, []);
    });

    socket.on('updateConnectedUsers', (connectedUsers) => {
        updateUsersList([], connectedUsers);
    });

    $('#messageForm').submit(function(e) {
        e.preventDefault();
        const message = $('#message').val();
        socket.emit('chatMessage', message);
        $('#message').val('');
    });

    socket.on('chatMessage', (message) => {
        $('#chatWindow').append(`<p><strong>${message.username}</strong>: ${message.message}</p>`);
    });

    // Load Conversations
    $('#loadConversations').click(function() {
        const date = prompt('Enter a date (YYYY-MM-DD):');
        const before = confirm('Before the date?');
        $.ajax({
            url: `/api/chat/conversations?date=${date}&before=${before}`,
            method: 'GET',
            success: function(messages) {
                $('#chatWindow').empty();
                messages.forEach(message => {
                    $('#chatWindow').append(`<p><strong>${message.username}</strong>: ${message.message}</p>`);
                });
            },
            error: function(response) {
                alert('Error loading conversations');
            }
        });
    });

    // Search Messages
    $('#searchMessages').click(function() {
        const content = prompt('Enter content to search for:');
        $.ajax({
            url: `/api/chat/messages?content=${content}`,
            method: 'GET',
            success: function(messages) {
                $('#chatWindow').empty();
                messages.forEach(message => {
                    $('#chatWindow').append(`<p><strong>${message.username}</strong>: ${message.message}</p>`);
                });
            },
            error: function(response) {
                alert('Error searching messages');
            }
        });
    });

    // Delete History
    $('#deleteHistory').click(function() {
        const userId = prompt('Enter user ID to delete history (leave blank to delete all):');
        const query = userId ? `?userId=${userId}` : '';
        $.ajax({
            url: `/api/chat/history${query}`,
            method: 'DELETE',
            success: function(response) {
                alert('Chat history deleted');
                $('#chatWindow').empty();
            },
            error: function(response) {
                alert('Error deleting chat history');
            }
        });
    });

    // User Conversations in Range
    $('#userConversationsRange').click(function() {
        const userId = prompt('Enter user ID:');
        const startDate = prompt('Enter start date (YYYY-MM-DD):');
        const endDate = prompt('Enter end date (YYYY-MM-DD):');
        $.ajax({
            url: `/api/chat/user-conversations?userId=${userId}&startDate=${startDate}&endDate=${endDate}`,
            method: 'GET',
            success: function(messages) {
                $('#chatWindow').empty();
                messages.forEach(message => {
                    $('#chatWindow').append(`<p><strong>${message.username}</strong>: ${message.message}</p>`);
                });
            },
            error: function(response) {
                alert('Error loading user conversations');
            }
        });
    });

    function updateUsersList(allUsers, connectedUsers) {
        if (allUsers.length > 0) {
            $('#users').empty();
            allUsers.forEach(user => {
                const isConnected = connectedUsers.some(connectedUser => connectedUser.id === user._id.toString());
                $('#users').append(`<p style="color: ${isConnected ? 'green' : 'black'};">(${user._id}) ${user.username}</p>`);
            });
        } else {
            $('#users').children().each(function() {
                const userText = $(this).text();
                const userId = userText.match(/\(([^)]+)\)/)[1];
                const isConnected = connectedUsers.some(connectedUser => connectedUser.id === userId);
                $(this).css('color', isConnected ? 'green' : 'black');
            });
        }
    }
});
