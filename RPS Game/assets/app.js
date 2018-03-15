$(document).ready(function () {

    // Initialize Firebase
    var config = {
    apiKey: "AIzaSyC-1knUC1VTUiKEPV60Mor9Tmao2fPswrg",
    authDomain: "rpsgame-92dd2.firebaseapp.com",
    databaseURL: "https://rpsgame-92dd2.firebaseio.com",
    projectId: "rpsgame-92dd2",
    storageBucket: "rpsgame-92dd2.appspot.com",
    messagingSenderId: "885620533708"
  };
  firebase.initializeApp(config);

    var database = firebase.database();
    var chats = database.ref('chat');
    var connections = database.ref('connections');

    var con;
    var player = {
        number: '0',
        name: '',
        wins: 0,
        losses: 0,
        turns: 0,
        choice: ''
    };
    var opponent = {
        number: '0',
        name: '',
        wins: 0,
        losses: 0,
        turns: 0,
        choice: ''
    };
    var waiting = false;

    var messages = $('.messages');
    var username = $('#username');

    connections.once('value', function (snapshot) {
        if (Object.keys(snapshot.val()).indexOf('1') === -1) {
            player.number = '1';
            opponent.number = '2';
        } else if (Object.keys(snapshot.val()).indexOf('2') === -1) {
            player.number = '2';
            opponent.number = '1';
        }

 
        if (player.number !== '0') {
            con = connections.child(player.number);
            con.set(player);

            con.onDisconnect().remove();

        } else {
            $('section').remove();
            $('.alert').show();
            app.delete();
        }
    });


    connections.on('value', function (snapshot) {
        if (con) {
            if (Object.keys(snapshot.val()).indexOf(opponent.number) !== -1) {
                opponent = snapshot.val()[opponent.number];
                player = snapshot.val()[player.number];
                if (opponent.name.length > 0) {
                    DOMFunctions.showOpponentInfo();
                    if (player.name.length > 0) {
                        var choice1 = snapshot.val()['1'].choice;
                        var choice2 = snapshot.val()['2'].choice;
                        var turns1 = snapshot.val()['1'].turns;

                        if (choice1.length > 0 && choice2.length > 0) {
                            getWinner(choice1, choice2);
                        } else if (choice1.length === 0 && turns1 === 0) {
                            DOMFunctions.showMoveOptions('1');
                        } else if (choice1.length > 0 && choice2.length === 0) {
                            DOMFunctions.showMoveOptions('2');
                        }
                    }
                }
            } else if (opponent.name.length > 0 && Object.keys(snapshot.val()).indexOf(opponent.number) === -1) {
                $('.turn').text('Opponent left. Waiting for new opponent.');
                $('.waiting-' + opponent.number).show();
                $('.name-' + opponent.number).empty();
                $('.win-loss-' + opponent.number).empty();
            }
        }
    });


    $('#submit-name').on('click', function () {
        player.name = username.val();
        if (player.name.length > 0) {
            con.update({
                name: player.name
            });
            DOMFunctions.showSelfJoin();
        }

        return false;
    });

    var DOMFunctions = {
        showSelfJoin: function () {
            username.val('');
            $('.user-form').hide();
            $('.waiting-' + player.number).hide();
            $('.name-' + player.number).text(player.name);
            $('.win-loss-' + player.number).text('Wins: ' + player.wins + ' | Losses: ' + player.losses);
            $('.hello').text('Hello ' + player.name + '! You are player ' + player.number + '.').show();
            $('.turn').show();
            $('.chat-row').show();
            $('.moves-' + opponent.number).remove();
            this.updateScroll();
        },
        showOpponentInfo: function () {
            $('.waiting-' + opponent.number).hide();
            $('.name-' + opponent.number).text(opponent.name);
            $('.win-loss-' + opponent.number).text('Wins: ' + opponent.wins + ' | Losses: ' + opponent.losses);
        },
        updatePlayerStats: function () {
            $('.win-loss-' + player.number).text('Wins: ' + player.wins + ' | Losses: ' + player.losses);
        },
        updateScroll: function () {
            messages[0].scrollTop = messages[0].scrollHeight;
        },
        showMoveOptions: function (currentPlayer) {
            if (currentPlayer === player.number) {
                $('.moves-' + currentPlayer).css('display', 'flex');
            }
            $('.turn').text('Player ' + currentPlayer + '\'s turn.');
        },
        showChats: function (snap) {
            var chatMessage = snap.val();
            if (Date.now() - chatMessage.timestamp < 1800000) {
                var messageDiv = $('<div class="message">');
                messageDiv.html('<span class="sender">' + chatMessage.sender + '</span>: ' + chatMessage.message);
                messages.append(messageDiv);
            }
            DOMFunctions.updateScroll();
        },
        showGameResult: function (message) {
            this.updatePlayerStats();
            $('.choice-' + opponent.number).text(opponent.choiceText).show();
            $('.turn').hide();
            $('.winner').text(message);
            $('.moves').hide();
            setTimeout(function () {
                $('.winner').empty();
                $('.turn').show();
                $('.choice').empty().hide();
                DOMFunctions.showMoveOptions('1');
            }, 3000)
        }
    };

    $('.move').on('click', function () {
        var choice = $(this).data('choice');
        var move = $(this).data('text');
        con.update({
            choice: choice,
            choiceText: move
        });

        $('.moves-' + player.number).hide();
        $('.choice-' + player.number).text(move).show();
    });

    $('#submit-chat').on('click', function () {
        var message = $('#message');
        var chatObj = {
            message: message.val(),
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            sender: player.name
        };
        chats.push(chatObj);

        message.val('');

        return false;
    });

    chats.on('child_added', function (snapshot) {
        if (snapshot.val()) {
            DOMFunctions.showChats(snapshot);
        }
    });

    var getWinner = function (move1, move2) {
        if (move1 === move2) {recordWin();}
        if (move1 === 'r' && move2 === 's') {recordWin('1', '2');}
        if (move1 === 'r' && move2 === 'p') {recordWin('2', '1');}
        if (move1 === 'p' && move2 === 'r') {recordWin('1', '2');}
        if (move1 === 'p' && move2 === 's') {recordWin('2', '1');}
        if (move1 === 's' && move2 === 'p') {recordWin('1', '2');}
        if (move1 === 's' && move2 === 'r') {recordWin('2', '1');}
    };

    var recordWin = function (winner, loser) {
        player.turns++;
        connections.child(player.number).update({
            choice: '',
            turns: player.turns
        });
        if (winner) {
            if (winner === player.number) {
                player.wins++;
                connections.child(winner).update({
                    wins: player.wins
                });
            } else {
                player.losses++;
                connections.child(loser).update({
                    losses: player.losses
                });
            }
            DOMFunctions.showGameResult('Player ' + winner + ' wins!');
        } else {
            DOMFunctions.showGameResult('Draw.');
        }
    }
});