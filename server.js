//SOCKET IO
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const ioi = new Server(server);
const io = ioi.of('/');

let url;
app.use((req, res, next) => {
    url = req.url; // or req.url
    next();
  });

//session

const session = require('express-session');
app.use(session({
    secret: 'keyboard cat', // A secret key for session data encryption
    resave: false, // Don't save the session if it wasn't modified
    saveUninitialized: true, // Save new sessions even if they haven't been modified
}));

//multer
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
app.use(upload.single('pic'));

//mongooes
const db = require('./models/db');
const userModel = require('./models/userModel');
const ticketModel = require('./models/tickets');
const departmentModel = require('./models/departmentModel');

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));//for form data
app.use(express.static('uploads'));

//templating engin
app.set('view engine', 'ejs'); // Set EJS as the view engine

//connect mongooes
db.init().then(function () {
    console.log("DB conneted");
    server.listen(3000, () => {
        console.log('listening on *:3000');
    });
}).catch(function (err) { console.log(err) });


app.post('/login', function (req, res) {
    let email = req.body.email;
    let password = req.body.password;

    userModel.findOne({ Email: email, Password: password })
        .then(function (user) {
            if (user) {
                console.log("User found");
                req.session.flag = true;
                req.session.username = user.userName;
                req.session.profilePic = user.profilePic.filename;
                req.session.departmentFlag = false;

                res.render('home.ejs', {
                    username: req.session.username,
                    profilePic: req.session.profilePic,
                    dep: false,
                    user: true,
                });
                return;
            } else {
                console.log("User not found or incorrect credentials");
                res.render('login.ejs'); // Handle user not found or incorrect credentials
            }
        })
        .catch(function (err) {
            console.log(err);
            res.render('login.ejs'); // Render error page or handle as needed
        });
});

//register
app.post('/signup', function (req, res) {
    let profilePic = req.file;
    let username = req.body.username;
    let confirmPassword = req.body.confirmPassword;
    let email = req.body.email;
    console.log(profilePic, username, confirmPassword, email);
    let user1 = { userName: username, Password: confirmPassword, Email: email, profilePic: profilePic }
    if (req.body.password !== confirmPassword) {
        res.render('signup');
        return;
    }
    userModel.findOne({ username: username }).then(function (user) {
        console.log('hi');
        if (user) {
            console.log("email exists")
            return;
        }
        userModel.create(user1).then(function () {
            console.log("registered");
            res.render('login.ejs');
        }).catch(function (err) {
            console.log(err);
            res.render("signup.ejs");
        })
    })
})
//POST
app.post('/index', (req, res) => {
    const subject = req.body.subject;
    const description = req.body.description;
    const department = req.body.department;


    // Process the data as needed (e.g., save to a database, etc.)
    // For this example, let's just log the received data
    console.log('Received data:');
    console.log('Subject:', subject);
    console.log('Description:', description);
    console.log('department:', department);

    let ticket = { Subject: subject, Discription: description, Department: department, Username: req.session.username };
    //tickets model
    if (subject != undefined && description != undefined && department != undefined && req.session.username != undefined)
        ticketModel.create(ticket).then(function () {
            console.log("ticket added");

        }).catch(function (err) {
            console.log(err);

        })
    ticketModel.find({ Username: req.session.username }).then(function (data) {
        console.log(data);
        let send = { message: 'Data received successfully!', Data: data };
        res.json(send);
    })

});//dep Register
app.post('/depsignup', function (req, res) {
    let profilePic = req.file;
    let username = req.body.username;
    let confirmPassword = req.body.confirmPassword;
    let email = req.body.email;
    let department = req.body.department;

    console.log(profilePic, username, confirmPassword, email, department);
    let user1 = { userName: username, Password: confirmPassword, Email: email, profilePic: profilePic, department: department }
    if (req.body.password !== confirmPassword) {
        res.render('depsignup');
        return;
    }
    departmentModel.findOne({ username: username }).then(function (user) {
        console.log('hi');
        if (user) {
            console.log(" exists")
            return;
        }
        departmentModel.create(user1).then(function () {
            console.log("registered in dep");
            res.render('deplogin.ejs');
        }).catch(function (err) {
            console.log(err);
            res.render("depignup.ejs");
        })
    })
})
//deplogin
app.post('/deplogin', function (req, res) {
    let email = req.body.email;
    let password = req.body.password;
    let department = req.body.department;

    console.log('dep hi', email, password, department);

    departmentModel.findOne({ Email: email, Password: password, department: department })
        .then(function (user) {
            if (user) {
                console.log("User  found ");
                req.session.flag = true;
                req.session.username = user.userName;
                req.session.profilePic = user.profilePic.filename;
                req.session.department = department;
                req.session.departmentFlag = true;
                res.render('home.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: true, user: false, session: true });
                return;
            } else {
                console.log("User not found or incorrect credentials");
                res.render('deplogin.ejs'); // Handle user not found or incorrect credentials
            }
        })
        .catch(function (err) {
            console.log(err);
            res.render('deplogin.ejs'); // Render error page or handle as needed
        });
});

app.get('/', (req, res) => {
    console.log("session.flag " + req.session.flag);
    if (session.flag === true)
        res.render('home.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: true, user: false, session: true });
    else
        res.render('home.ejs', { username: 'name', profilePic: "/icons/user.png", dep: false, user: false, session: true });
})
app.get('/riseticket', (req, res) => {
    if (req.session.flag === true) {
        if (req.session.departmentFlag === true) {
            res.render('index.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: true, user: false, session: true });
        }
        else {
            res.render('index.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: false, user: true, session: true });
        }
    }
    else res.redirect('/');
})

app.post('/resolveTicket', (req, res) => {
    if (req.session.flag === true) {
        console.log("ffff:",req.session.department) 
        ticketModel.find({ Department: req.session.department }).then(function (data) {
            console.log("data",data);
            let send = { message: 'Data received successfully!', Data: data };
            res.json(send);
        })
    }
    else
        res.redirect('/');
})


app.get('/resolveTicket', (req, res) => {
    if (req.session.flag === true) {
        if (req.session.departmentFlag === true) {
            res.render('resolveTicket.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: true, user: false, session: true });
        }
        else {
            res.render('resolveTicket.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: false, user: true, session: true });
        }
    }
    else
        res.redirect('/');
})
app.get('/home', (req, res) => {
    if (req.session.flag === true) {
        if (req.session.departmentFlag === true) {
            res.render('home.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: true, user: false, session: true });
        } else
            res.render('home.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: false, user: true, session: true });
    } else
        res.render('home.ejs', { username: 'name', profilePic: "/icons/user.png", dep: false, user: false, session: false });
})
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        } else {
            console.log("Session destroyed successfully");
        }
        res.redirect('/');
    });
});

let depf;
app.get('/login', (req, res) => {
    res.render('login.ejs')
})
app.get('/signup', (req, res) => {
    res.render('signup.ejs')
})
app.get('/css/style.css', (req, res) => {
    res.sendFile(__dirname + '/css/style.css')
})
app.get('/icons/user.png', (req, res) => {
    res.sendFile(__dirname + '/icons/user.png')
})
app.get('/deplogin', (req, res) => {
    res.render('deplogin', { username: 'name', profilePic: "/icons/user.png" })
})
app.get('/depsignup', (req, res) => {
    res.render('depsignup', { username: 'name', profilePic: "/icons/user.png" })
})
app.get('/resolveTicket/chat', (req, res) => {
    depf = true;
    let send=[] ;
    ticketModel.find({ department: req.session.department }).then(function (data) {
        console.log(data);
        send = data.chat;
    })
    console.log("r",req.session.profilePic)

    if (req.session.flag === true) {
        if (req.session.departmentFlag === true) {
            res.render('chat.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: true, user: false, session: true });
        }
        else {
            res.render('chat.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: false, user: true, session: true });
        }
    }
    else res.redirect('/');
    // res.sendFile(__dirname + '/views/chat.html');
})
app.get('/index/chat', (req, res) => {
    let send=[] ;
    ticketModel.find({ _id: ticketId }).then(function (data) {
        console.log(data);
        send = data.chat;
    })
    depf = false;
    console.log("r",req.session.profilePic)
    if (req.session.flag === true) {
        if (req.session.departmentFlag === true) {
            res.render('chat.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: true, user: false, session: true });
        }
        else {
            res.render('chat.ejs', { username: req.session.username, profilePic: req.session.profilePic, dep: false, user: true, session: true });
        }
    }
    else res.redirect('/');
    // res.sendFile(__dirname + '/views/chat.html');
})
let ticketId;
app.post("/ticketId", function (req, res) {
    // Retrieve the ticketId from the request body
    const icketId = req.body.ticketId;
    ticketId = icketId;
    console.log("Received ticketId:", icketId, req.body);

    // You can now use the ticketId as needed in your server-side logic
    // For example, you can store it in a session variable or use it for further processing.

    // Send a response back to the client if needed
    res.json({ message: "Received ticketId successfully" });
});
app.post("/chat",function(req,res){
    ticketModel.findOne({_id: ticketId})
    .then(function (t) {
res.json(t.chat);
})})

// Function to parse query parameters from the URL

// Now, you can use the ticketId in your chat functionality as needed.

//--socket--
io.on('connection', (socket) => {
    console.log('a user connected',);
    if (depf == true) {
        ticketModel.findOneAndUpdate(
            { _id: ticketId },
            { $set: { DepSocket: socket.id } },
            { new: true } // To get the updated ticket document
        )
            .then((updatedTicket) => {
                if (updatedTicket) {
                    console.log('Ticket updatedmmmmmmmmmmmmmmmmm:', updatedTicket);
                    // Emit a response back to the client to acknowledge the update
                    socket.emit('ticketUpdated', { success: true, updatedTicket });
                    depf = false;
                } else {
                    console.log('Ticket not found');
                    // Emit a response back to the client to handle the case when the ticket is not found
                    // socket.emit('ticketUpdated', { success: false, message: 'Ticket not found' });
                }
            })
            .catch((err) => {
                console.error('Error updating ticket:', err);
                // Emit a response back to the client to handle errors
                //socket.emit('ticketUpdated', { success: false, message: 'Error updating ticket' });
            });
    }
    else {
        ticketModel.findOneAndUpdate(
            { _id: ticketId },
            { $set: { UserSocket: socket.id } },
            { new: true } // To get the updated ticket document
        )
            .then((updatedTicket) => {
                if (updatedTicket) {
                    console.log('Ticket updated:', updatedTicket);
                    // Emit a response back to the client to acknowledge the update
                    socket.emit('ticketUpdated', { success: true, updatedTicket });
                } else {
                    console.log('Ticket not found');
                    // Emit a response back to the client to handle the case when the ticket is not found
                    // socket.emit('ticketUpdated', { success: false, message: 'Ticket not found' });
                }
            })
            .catch((err) => {
                console.error('Error updating ticket:', err);
                // Emit a response back to the client to handle errors
                //socket.emit('ticketUpdated', { success: false, message: 'Error updating ticket' });
            });
    }




    socket.on('c', (data) => {
        console.log("c        ", data);
    });

    // Get the selected ticket ID from localStorage

    socket.on('chat message', (data) => {
        let arr=[];

        console.log('message: ' + data.msg);
        const message = data.msg;
             const username =data.username;

        console.log("url",url);
        const parts = url.split('/');
        const XYZ = parts[1]; // Index 1 contains "resolveTicket"
        
        console.log(XYZ); // Outputs: "resolveTicket"
        if(XYZ==="resolveTicket")
        {
            //IT IS DEP
            ticketModel.findOne({ _id: ticketId }).then(data => {
                if (data) {
                    console.log("idata.UserSocket", data.UserSocket)
                    console.log("idata.DepSocket", data.DepSocket)
                    console.log("icket", socket.id)
                    // Assuming you have the socket ID of the recipient stored in a variable, e.g., recipientSocketId
                    arr=data.chat;
                    arr.push(data.DepPerson+" : "+message);

                    console.log("arr",arr);

                    // Send a message to the specific socket ID
                    io.to(data.UserSocket).emit('chatmessage', {message:message,
                        Person:username});
    
                    io.to(data.DepSocket).emit('chatmessage', {message:message,
                        Person:username});
                }
                else
                    console.log("not found")
            }).then(function(){
                console.log("arr0",arr);
         
                ticketModel.findOneAndUpdate(
                    {  _id: ticketId },          
                  { $set: { chat: arr} },
                    { new: true } // To get the updated ticket document
                )
                .then((updatedTicket) => {
                    if (updatedTicket) {
                        console.log('arr:', updatedTicket);
                        // Emit a response back to the client to acknowledge the update
                        socket.emit('ticketUpdated', { success: true, updatedTicket });
                    } else {
                        console.log('Ticket not found');
                        // Emit a response back to the client to handle the case when the ticket is not found
                       // socket.emit('ticketUpdated', { success: false, message: 'Ticket not found' });
                    }
                })
                .catch((err) => {
                    console.error('Error updating ticket:', err);
                    // Emit a response back to the client to handle errors
                    //socket.emit('ticketUpdated', { success: false, message: 'Error updating ticket' });
                })});
        
        }
        else{
            ticketModel.findOne({ _id: ticketId }).then(data => {
                if (data) {
                    console.log("idata.UserSocket", data.UserSocket)
                    console.log("idata.DepSocket", data.DepSocket)
                    console.log("icket", socket.id)
                    // Assuming you have the socket ID of the recipient stored in a variable, e.g., recipientSocketId
    
                    // Send a message to the specific socket ID
                    arr.push(username+" : "+message);

                    console.log("arr8",arr);
         

                    io.to(data.UserSocket).emit('chatmessage', {message:message,
                        Person:username});
                    io.to(data.DepSocket).emit('chatmessage', {message:message,
                        Person:username});;
                }
                else
                    console.log("not found")
            }).then(function(){
                console.log("arr0",arr);
         
                ticketModel.findOneAndUpdate(
                    {  _id: ticketId },          
                  { $set: { chat: arr} },
                    { new: true } // To get the updated ticket document
                )
                .then((updatedTicket) => {
                    if (updatedTicket) {
                        console.log('arr:', updatedTicket);
                        // Emit a response back to the client to acknowledge the update
                        socket.emit('ticketUpdated', { success: true, updatedTicket });
                    } else {
                        console.log('Ticket not found');
                        // Emit a response back to the client to handle the case when the ticket is not found
                       // socket.emit('ticketUpdated', { success: false, message: 'Ticket not found' });
                    }
                })
                .catch((err) => {
                    console.error('Error updating ticket:', err);
                    // Emit a response back to the client to handle errors
                    //socket.emit('ticketUpdated', { success: false, message: 'Error updating ticket' });
                });
        
        
            })
        }
        
  



        // if(session.departmentFlag===true)
        // socket.emit('chat message',{msg:msg,dep:true,department:session.department});
        // else
        // socket.emit('chat message',{msg:msg,dep:false,department:session.department});
    });

    //here update ticket having user name session.username with this user socket
    socket.on('onClickCardDep', function (department) {
        console.log("hiiiii", department.Department, department.Username, department._id, socket.id);

        ticketModel.findOneAndUpdate(
            { _id:department._id },          
          { $set: { DepPerson: department.Username } },
            { new: true } // To get the updated ticket document
        )
        .then((updatedTicket) => {
            if (updatedTicket) {
                console.log('Ticket updated  dep person:', updatedTicket);
                // Emit a response back to the client to acknowledge the update
                socket.emit('ticketUpdated', { success: true, updatedTicket });
            } else {
                console.log('Ticket not found');
                // Emit a response back to the client to handle the case when the ticket is not found
               // socket.emit('ticketUpdated', { success: false, message: 'Ticket not found' });
            }
        })
        .catch((err) => {
            console.error('Error updating ticket:', err);
            // Emit a response back to the client to handle errors
            //socket.emit('ticketUpdated', { success: false, message: 'Error updating ticket' });
        });
    });

    socket.on('onClickCardUser', function (department) {
        console.log("hi", department.Department, department.Username, socket.id);
        // console.log(ticketId);
        // ticketModel.findOneAndUpdate(
        //     { _id:ticketId },
        //     { $set: { UserSocket: socket.id } },
        //     { new: true } // To get the updated ticket document
        // )
        // .then((updatedTicket) => {
        //     if (updatedTicket) {
        //         console.log('Ticket updated:', updatedTicket);
        //         // Emit a response back to the client to acknowledge the update
        //         socket.emit('ticketUpdatedUser', { success: true, updatedTicket });
        //     } else {
        //         console.log('Ticket not found');
        //         // Emit a response back to the client to handle the case when the ticket is not found
        //        // socket.emit('ticketUpdated', { success: false, message: 'Ticket not found' });
        //     }
        // })
        // .catch((err) => {
        //     console.error('Error updating ticket:', err);
        //     // Emit a response back to the client to handle errors
        //     //socket.emit('ticketUpdated', { success: false, message: 'Error updating ticket' });
        // });
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
app.post('/resolved',function(req,res){
ticketModel.deleteOne({_id:ticketId}).then(function(){
    console.log("successfull deleted");
    res.json("successfull deleted")
}).catch(function(err){
    console.err(err);
})
})